import { Pool, PoolClient } from 'pg';
import { Chamado, Evento, NovoChamado, criarChamado } from '../dominio/chamado';
import { ConflitoError, Repositorio } from './repositorio';

export const ESQUEMA = `
CREATE TABLE IF NOT EXISTS chamados (
  id            SERIAL PRIMARY KEY,
  titulo        TEXT        NOT NULL,
  descricao     TEXT        NOT NULL,
  categoria     TEXT        NOT NULL,
  prioridade    TEXT        NOT NULL,
  status        TEXT        NOT NULL,
  solicitante   TEXT        NOT NULL,
  responsavel   TEXT,
  criado_em     TIMESTAMPTZ NOT NULL,
  atualizado_em TIMESTAMPTZ NOT NULL,
  prazo         TIMESTAMPTZ NOT NULL,
  resolvido_em  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_chamados_status_prazo ON chamados (status, prazo);

CREATE TABLE IF NOT EXISTS eventos (
  id         SERIAL PRIMARY KEY,
  chamado_id INTEGER     NOT NULL REFERENCES chamados (id) ON DELETE CASCADE,
  em         TIMESTAMPTZ NOT NULL,
  tipo       TEXT        NOT NULL,
  autor      TEXT        NOT NULL,
  texto      TEXT        NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_eventos_chamado ON eventos (chamado_id, em);
`;

interface LinhaChamado {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Chamado['categoria'];
  prioridade: Chamado['prioridade'];
  status: Chamado['status'];
  solicitante: string;
  responsavel: string | null;
  criado_em: Date;
  atualizado_em: Date;
  prazo: Date;
  resolvido_em: Date | null;
}

interface LinhaEvento {
  chamado_id: number;
  em: Date;
  tipo: Evento['tipo'];
  autor: string;
  texto: string;
}

const paraChamado = (l: LinhaChamado, historico: Evento[]): Chamado => ({
  id: l.id,
  titulo: l.titulo,
  descricao: l.descricao,
  categoria: l.categoria,
  prioridade: l.prioridade,
  status: l.status,
  solicitante: l.solicitante,
  responsavel: l.responsavel,
  criadoEm: l.criado_em.toISOString(),
  atualizadoEm: l.atualizado_em.toISOString(),
  prazo: l.prazo.toISOString(),
  resolvidoEm: l.resolvido_em?.toISOString() ?? null,
  historico,
});

const paraEvento = (l: LinhaEvento): Evento => ({ em: l.em.toISOString(), tipo: l.tipo, autor: l.autor, texto: l.texto });

export class RepositorioPostgres implements Repositorio {
  constructor(private readonly pool: Pool) {}

  async migrar(): Promise<void> {
    await this.pool.query(ESQUEMA);
  }

  async listar(): Promise<Chamado[]> {
    const chamados = await this.pool.query<LinhaChamado>('SELECT * FROM chamados');
    const eventos = await this.pool.query<LinhaEvento>('SELECT chamado_id, em, tipo, autor, texto FROM eventos ORDER BY em, id');
    const porChamado = new Map<number, Evento[]>();
    for (const e of eventos.rows) porChamado.set(e.chamado_id, [...(porChamado.get(e.chamado_id) ?? []), paraEvento(e)]);
    return chamados.rows.map((l) => paraChamado(l, porChamado.get(l.id) ?? []));
  }

  async obter(id: number): Promise<Chamado | null> {
    const c = await this.pool.query<LinhaChamado>('SELECT * FROM chamados WHERE id = $1', [id]);
    if (!c.rowCount) return null;
    const e = await this.pool.query<LinhaEvento>(
      'SELECT chamado_id, em, tipo, autor, texto FROM eventos WHERE chamado_id = $1 ORDER BY em, id',
      [id],
    );
    return paraChamado(c.rows[0], e.rows.map(paraEvento));
  }

  async criar(novo: NovoChamado, agora: Date): Promise<Chamado> {
    const rascunho = criarChamado(0, novo, agora);
    return this.transacao(async (db) => {
      const { rows } = await db.query<{ id: number }>(
        `INSERT INTO chamados (titulo, descricao, categoria, prioridade, status, solicitante, responsavel,
                               criado_em, atualizado_em, prazo, resolvido_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [rascunho.titulo, rascunho.descricao, rascunho.categoria, rascunho.prioridade, rascunho.status, rascunho.solicitante,
         rascunho.responsavel, rascunho.criadoEm, rascunho.atualizadoEm, rascunho.prazo, rascunho.resolvidoEm],
      );
      const chamado = { ...rascunho, id: rows[0].id };
      await this.inserirEventos(db, chamado.id, chamado.historico);
      return chamado;
    });
  }

  async salvar(atual: Chamado, anterior: Chamado): Promise<void> {
    await this.transacao(async (db) => {
      const r = await db.query(
        `UPDATE chamados SET status = $2, responsavel = $3, atualizado_em = $4, resolvido_em = $5
         WHERE id = $1 AND atualizado_em = $6`,
        [atual.id, atual.status, atual.responsavel, atual.atualizadoEm, atual.resolvidoEm, anterior.atualizadoEm],
      );
      if (r.rowCount === 0) throw new ConflitoError('O chamado foi alterado por outra pessoa. Recarregue e tente de novo.');
      await this.inserirEventos(db, atual.id, atual.historico.slice(anterior.historico.length));
    });
  }

  private async inserirEventos(db: PoolClient, chamadoId: number, eventos: Evento[]): Promise<void> {
    for (const e of eventos)
      await db.query('INSERT INTO eventos (chamado_id, em, tipo, autor, texto) VALUES ($1, $2, $3, $4, $5)', [
        chamadoId, e.em, e.tipo, e.autor, e.texto,
      ]);
  }

  private async transacao<T>(fn: (db: PoolClient) => Promise<T>): Promise<T> {
    const db = await this.pool.connect();
    try {
      await db.query('BEGIN');
      const resultado = await fn(db);
      await db.query('COMMIT');
      return resultado;
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    } finally {
      db.release();
    }
  }
}
