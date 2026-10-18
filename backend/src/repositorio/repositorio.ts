import { Chamado, NovoChamado, criarChamado } from '../dominio/chamado';

export class ConflitoError extends Error {}

export interface Repositorio {
  listar(): Promise<Chamado[]>;
  obter(id: number): Promise<Chamado | null>;
  criar(novo: NovoChamado, agora: Date): Promise<Chamado>;
  /**
   * Grava a nova versão. Falha com ConflitoError se alguém alterou o chamado depois da leitura
   * (concorrência otimista pelo campo atualizadoEm).
   */
  salvar(atual: Chamado, anterior: Chamado): Promise<void>;
}

/** Repositório em memória: usado nos testes e para rodar a API sem banco. */
export class RepositorioMemoria implements Repositorio {
  private readonly dados = new Map<number, Chamado>();
  private seq = 0;

  async listar(): Promise<Chamado[]> {
    return [...this.dados.values()].map((c) => structuredClone(c));
  }

  async obter(id: number): Promise<Chamado | null> {
    const c = this.dados.get(id);
    return c ? structuredClone(c) : null;
  }

  async criar(novo: NovoChamado, agora: Date): Promise<Chamado> {
    const c = criarChamado(this.seq + 1, novo, agora);
    this.seq++;
    this.dados.set(c.id, structuredClone(c));
    return c;
  }

  async salvar(atual: Chamado, anterior: Chamado): Promise<void> {
    const gravado = this.dados.get(atual.id);
    if (!gravado || gravado.atualizadoEm !== anterior.atualizadoEm)
      throw new ConflitoError('O chamado foi alterado por outra pessoa. Recarregue e tente de novo.');
    this.dados.set(atual.id, structuredClone(atual));
  }
}
