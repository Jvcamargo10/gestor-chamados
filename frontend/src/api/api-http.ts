import type { Chamado, Filtro, NovoChamado, Resumo, Status } from '@dominio/chamado';
import { ErroApi, type ApiChamados } from './api';

export class ApiHttp implements ApiChamados {
  private readonly base: string;

  constructor(base = '') {
    this.base = base;
  }

  listar(filtro: Filtro = {}): Promise<Chamado[]> {
    const q = new URLSearchParams(Object.entries(filtro).filter(([, v]) => v) as [string, string][]);
    return this.pedir(`/api/chamados${q.size ? `?${q}` : ''}`);
  }

  obter(id: number): Promise<Chamado> {
    return this.pedir(`/api/chamados/${id}`);
  }

  resumo(): Promise<Resumo> {
    return this.pedir('/api/resumo');
  }

  criar(novo: NovoChamado): Promise<Chamado> {
    return this.pedir('/api/chamados', 'POST', novo);
  }

  mudarStatus(id: number, status: Status, autor: string, comentario?: string): Promise<Chamado> {
    return this.pedir(`/api/chamados/${id}/status`, 'POST', { status, autor, comentario });
  }

  comentar(id: number, autor: string, texto: string): Promise<Chamado> {
    return this.pedir(`/api/chamados/${id}/comentarios`, 'POST', { autor, texto });
  }

  private async pedir<T>(caminho: string, metodo = 'GET', corpo?: unknown): Promise<T> {
    const resposta = await fetch(this.base + caminho, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    }).catch(() => {
      throw new ErroApi('Não foi possível falar com a API.');
    });
    if (!resposta.ok) {
      const problema = await resposta.json().catch(() => null);
      throw new ErroApi(problema?.detail ?? `Erro ${resposta.status}`);
    }
    return resposta.json() as Promise<T>;
  }
}
