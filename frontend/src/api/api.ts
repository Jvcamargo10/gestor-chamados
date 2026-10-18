import type { Chamado, Filtro, NovoChamado, Resumo, Status } from '@dominio/chamado';
import { createContext, useContext } from 'react';

export interface ApiChamados {
  listar(filtro?: Filtro): Promise<Chamado[]>;
  obter(id: number): Promise<Chamado>;
  resumo(): Promise<Resumo>;
  criar(novo: NovoChamado): Promise<Chamado>;
  mudarStatus(id: number, status: Status, autor: string, comentario?: string): Promise<Chamado>;
  comentar(id: number, autor: string, texto: string): Promise<Chamado>;
}

export class ErroApi extends Error {}

export const ApiContexto = createContext<ApiChamados | null>(null);

export function useApi(): ApiChamados {
  const api = useContext(ApiContexto);
  if (!api) throw new Error('ApiContexto não foi fornecido.');
  return api;
}
