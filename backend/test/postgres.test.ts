import { Pool } from 'pg';
import { mudarStatus } from '../src/dominio/chamado';
import { RepositorioPostgres } from '../src/repositorio/postgres';
import { ConflitoError } from '../src/repositorio/repositorio';

/** Roda contra um PostgreSQL de verdade quando DATABASE_URL_TESTE existe (no CI, um container de serviço). */
const url = process.env.DATABASE_URL_TESTE;
const descrever = url ? describe : describe.skip;

descrever('RepositorioPostgres', () => {
  const pool = new Pool({ connectionString: url });
  const repo = new RepositorioPostgres(pool);
  const t0 = new Date('2026-10-19T09:00:00.000Z');

  beforeAll(async () => {
    await pool.query('DROP TABLE IF EXISTS eventos; DROP TABLE IF EXISTS chamados;');
    await repo.migrar();
  });
  afterAll(() => pool.end());

  it('grava chamado e histórico na mesma transação e lê de volta igual', async () => {
    const criado = await repo.criar(
      { titulo: 'VPN não conecta', descricao: 'Erro 809 ao conectar de casa.', categoria: 'Rede e internet', prioridade: 'alta', solicitante: 'Rita' },
      t0,
    );
    const atendido = mudarStatus(criado, 'em_atendimento', 'João', new Date('2026-10-19T09:30:00.000Z'));
    await repo.salvar(atendido, criado);

    const lido = await repo.obter(criado.id);
    expect(lido).toEqual(atendido);
    expect((await repo.listar()).map((c) => c.id)).toContain(criado.id);
  });

  it('detecta edição concorrente', async () => {
    const criado = await repo.criar(
      { titulo: 'Monitor piscando', descricao: 'Pisca a cada poucos segundos.', categoria: 'Equipamento', prioridade: 'baixa', solicitante: 'Rita' },
      t0,
    );
    const primeiro = mudarStatus(criado, 'em_atendimento', 'João', new Date('2026-10-19T10:00:00.000Z'));
    const segundo = mudarStatus(criado, 'em_atendimento', 'Maria', new Date('2026-10-19T10:00:01.000Z'));
    await repo.salvar(primeiro, criado);
    await expect(repo.salvar(segundo, criado)).rejects.toBeInstanceOf(ConflitoError);
  });
});
