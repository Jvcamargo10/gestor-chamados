/**
 * Regras de negócio dos chamados. Este arquivo não depende de nada: é usado pela API
 * e importado pelo front-end (modo demonstração), para que as duas pontas sigam as mesmas regras.
 */

export const PRIORIDADES = ['baixa', 'media', 'alta', 'critica'] as const;
export type Prioridade = (typeof PRIORIDADES)[number];

export const STATUS = ['aberto', 'em_atendimento', 'aguardando_solicitante', 'resolvido', 'fechado'] as const;
export type Status = (typeof STATUS)[number];

export const CATEGORIAS = ['Acesso e senhas', 'Equipamento', 'Sistemas internos', 'Rede e internet', 'Outros'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

/** Prazo de solução, em horas, por prioridade. */
export const SLA_HORAS: Record<Prioridade, number> = { baixa: 72, media: 24, alta: 8, critica: 4 };

export const ROTULO_STATUS: Record<Status, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  aguardando_solicitante: 'Aguardando solicitante',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
};

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = { baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica' };

/** Fluxo permitido. "resolvido" pode voltar a "em_atendimento" se o solicitante reabrir. */
export const TRANSICOES: Record<Status, Status[]> = {
  aberto: ['em_atendimento', 'fechado'],
  em_atendimento: ['aguardando_solicitante', 'resolvido'],
  aguardando_solicitante: ['em_atendimento', 'resolvido'],
  resolvido: ['fechado', 'em_atendimento'],
  fechado: [],
};

export type TipoEvento = 'criado' | 'status' | 'comentario';

export interface Evento {
  em: string;
  tipo: TipoEvento;
  autor: string;
  texto: string;
}

export interface Chamado {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  prioridade: Prioridade;
  status: Status;
  solicitante: string;
  responsavel: string | null;
  criadoEm: string;
  atualizadoEm: string;
  prazo: string;
  resolvidoEm: string | null;
  historico: Evento[];
}

export interface NovoChamado {
  titulo: string;
  descricao: string;
  categoria: Categoria;
  prioridade: Prioridade;
  solicitante: string;
}

export class RegraVioladaError extends Error {}

export function calcularPrazo(criadoEm: Date, prioridade: Prioridade): Date {
  return new Date(criadoEm.getTime() + SLA_HORAS[prioridade] * 3_600_000);
}

export function validarNovo(n: Partial<NovoChamado>): string[] {
  const erros: string[] = [];
  if (!n.titulo || n.titulo.trim().length < 5) erros.push('O título precisa ter pelo menos 5 caracteres.');
  if (n.titulo && n.titulo.length > 120) erros.push('O título pode ter no máximo 120 caracteres.');
  if (!n.descricao || n.descricao.trim().length < 10) erros.push('Descreva o problema com pelo menos 10 caracteres.');
  if (!n.solicitante?.trim()) erros.push('Informe quem está abrindo o chamado.');
  if (!n.categoria || !CATEGORIAS.includes(n.categoria)) erros.push('Escolha uma categoria válida.');
  if (!n.prioridade || !PRIORIDADES.includes(n.prioridade)) erros.push('Escolha uma prioridade válida.');
  return erros;
}

export function criarChamado(id: number, n: NovoChamado, agora: Date): Chamado {
  const erros = validarNovo(n);
  if (erros.length) throw new RegraVioladaError(erros.join(' '));
  const em = agora.toISOString();
  return {
    id,
    titulo: n.titulo.trim(),
    descricao: n.descricao.trim(),
    categoria: n.categoria,
    prioridade: n.prioridade,
    status: 'aberto',
    solicitante: n.solicitante.trim(),
    responsavel: null,
    criadoEm: em,
    atualizadoEm: em,
    prazo: calcularPrazo(agora, n.prioridade).toISOString(),
    resolvidoEm: null,
    historico: [{ em, tipo: 'criado', autor: n.solicitante.trim(), texto: 'Chamado aberto' }],
  };
}

/** Muda o status respeitando o fluxo. Quem assume o atendimento vira o responsável. */
export function mudarStatus(c: Chamado, novo: Status, autor: string, agora: Date, comentario?: string): Chamado {
  if (!autor.trim()) throw new RegraVioladaError('Informe quem está alterando o chamado.');
  if (!TRANSICOES[c.status].includes(novo))
    throw new RegraVioladaError(`Não é possível passar de "${ROTULO_STATUS[c.status]}" para "${ROTULO_STATUS[novo]}".`);
  if (novo === 'aguardando_solicitante' && !comentario?.trim())
    throw new RegraVioladaError('Diga o que está faltando para o solicitante.');

  const em = agora.toISOString();
  const texto = `${ROTULO_STATUS[c.status]} → ${ROTULO_STATUS[novo]}${comentario?.trim() ? `: ${comentario.trim()}` : ''}`;
  return {
    ...c,
    status: novo,
    responsavel: novo === 'em_atendimento' && !c.responsavel ? autor.trim() : c.responsavel,
    resolvidoEm: novo === 'resolvido' ? em : novo === 'em_atendimento' ? null : c.resolvidoEm,
    atualizadoEm: em,
    historico: [...c.historico, { em, tipo: 'status', autor: autor.trim(), texto }],
  };
}

export function comentar(c: Chamado, autor: string, texto: string, agora: Date): Chamado {
  if (!autor.trim() || !texto.trim()) throw new RegraVioladaError('Comentário e autor são obrigatórios.');
  if (c.status === 'fechado') throw new RegraVioladaError('Chamado fechado não recebe comentários.');
  const em = agora.toISOString();
  return { ...c, atualizadoEm: em, historico: [...c.historico, { em, tipo: 'comentario', autor: autor.trim(), texto: texto.trim() }] };
}

export type SituacaoSla = 'no_prazo' | 'vencendo' | 'atrasado' | 'cumprido' | 'violado';

/**
 * Situação do SLA. Enquanto o chamado aguarda o solicitante, o relógio segue correndo
 * (regra simples, comum em service desks internos).
 */
export function situacaoSla(c: Chamado, agora: Date): SituacaoSla {
  const prazo = new Date(c.prazo).getTime();
  if (c.resolvidoEm) return new Date(c.resolvidoEm).getTime() <= prazo ? 'cumprido' : 'violado';
  if (c.status === 'fechado') return 'cumprido';
  const restante = prazo - agora.getTime();
  if (restante < 0) return 'atrasado';
  const total = SLA_HORAS[c.prioridade] * 3_600_000;
  return restante <= total * 0.25 ? 'vencendo' : 'no_prazo';
}

export function tempoRestante(c: Chamado, agora: Date): string {
  const ms = new Date(c.prazo).getTime() - agora.getTime();
  const horas = Math.floor(Math.abs(ms) / 3_600_000);
  const minutos = Math.floor((Math.abs(ms) % 3_600_000) / 60_000);
  const texto = horas >= 24 ? `${Math.floor(horas / 24)}d ${horas % 24}h` : `${horas}h ${String(minutos).padStart(2, '0')}min`;
  return ms < 0 ? `atrasado há ${texto}` : `${texto} restantes`;
}

export interface Filtro {
  status?: Status;
  prioridade?: Prioridade;
  busca?: string;
}

const ORDEM_PRIORIDADE: Record<Prioridade, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

/** Ativos primeiro, depois por prazo mais próximo e prioridade. */
export function ordenar(chamados: Chamado[]): Chamado[] {
  const ativo = (c: Chamado) => (c.status === 'resolvido' || c.status === 'fechado' ? 1 : 0);
  return [...chamados].sort(
    (a, b) => ativo(a) - ativo(b) || a.prazo.localeCompare(b.prazo) || ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade],
  );
}

export function filtrar(chamados: Chamado[], f: Filtro): Chamado[] {
  const busca = f.busca?.trim().toLowerCase();
  return chamados.filter(
    (c) =>
      (!f.status || c.status === f.status) &&
      (!f.prioridade || c.prioridade === f.prioridade) &&
      (!busca || `${c.id} ${c.titulo} ${c.solicitante} ${c.categoria}`.toLowerCase().includes(busca)),
  );
}

export interface Resumo {
  abertos: number;
  vencendo: number;
  atrasados: number;
  resolvidosNoPrazo: number;
}

export function resumir(chamados: Chamado[], agora: Date): Resumo {
  const r: Resumo = { abertos: 0, vencendo: 0, atrasados: 0, resolvidosNoPrazo: 0 };
  for (const c of chamados) {
    const sla = situacaoSla(c, agora);
    if (c.status !== 'resolvido' && c.status !== 'fechado') r.abertos++;
    if (sla === 'vencendo') r.vencendo++;
    if (sla === 'atrasado') r.atrasados++;
    if (sla === 'cumprido' && c.resolvidoEm) r.resolvidosNoPrazo++;
  }
  return r;
}
