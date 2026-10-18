import {
  comentar, criarChamado, filtrar, mudarStatus, ordenar, RegraVioladaError, resumir,
  type Chamado, type Filtro, type NovoChamado, type Resumo, type Status,
} from '@dominio/chamado';
import { ErroApi, type ApiChamados } from './api';

const CHAVE = 'gestor-chamados-demo-v1';

/**
 * API que roda no navegador para a demonstração no GitHub Pages.
 * Usa as mesmas regras de domínio da API Node (importadas de backend/src/dominio)
 * e guarda os dados no localStorage deste navegador.
 */
export class ApiDemo implements ApiChamados {
  private chamados: Chamado[];
  private readonly agora: () => Date;
  private readonly armazenar: boolean;

  constructor(agora: () => Date = () => new Date(), armazenar = true) {
    this.agora = agora;
    this.armazenar = armazenar;
    this.chamados = (armazenar && this.ler()) || semear(agora());
  }

  async listar(filtro: Filtro = {}): Promise<Chamado[]> {
    return ordenar(filtrar(this.chamados, filtro));
  }

  async obter(id: number): Promise<Chamado> {
    const c = this.chamados.find((x) => x.id === id);
    if (!c) throw new ErroApi(`Chamado ${id} não encontrado.`);
    return c;
  }

  async resumo(): Promise<Resumo> {
    return resumir(this.chamados, this.agora());
  }

  async criar(novo: NovoChamado): Promise<Chamado> {
    const id = Math.max(0, ...this.chamados.map((c) => c.id)) + 1;
    return this.gravar(() => criarChamado(id, novo, this.agora()));
  }

  async mudarStatus(id: number, status: Status, autor: string, comentario?: string): Promise<Chamado> {
    const atual = await this.obter(id);
    return this.gravar(() => mudarStatus(atual, status, autor, this.agora(), comentario));
  }

  async comentar(id: number, autor: string, texto: string): Promise<Chamado> {
    const atual = await this.obter(id);
    return this.gravar(() => comentar(atual, autor, texto, this.agora()));
  }

  private gravar(operacao: () => Chamado): Chamado {
    let c: Chamado;
    try {
      c = operacao();
    } catch (e) {
      throw new ErroApi(e instanceof RegraVioladaError ? e.message : 'Não foi possível salvar.');
    }
    this.chamados = [...this.chamados.filter((x) => x.id !== c.id), c];
    if (this.armazenar) {
      try {
        localStorage.setItem(CHAVE, JSON.stringify(this.chamados));
      } catch {
        /* sem armazenamento (aba anônima): a demo segue só em memória */
      }
    }
    return c;
  }

  private ler(): Chamado[] | null {
    try {
      const texto = localStorage.getItem(CHAVE);
      return texto ? (JSON.parse(texto) as Chamado[]) : null;
    } catch {
      return null;
    }
  }
}

/** Fila fictícia de um service desk, com horários relativos a agora para o SLA fazer sentido. */
export function semear(agora: Date): Chamado[] {
  const h = (horas: number) => new Date(agora.getTime() - horas * 3_600_000);
  const a = (c: Chamado, s: Status, autor: string, horasAtras: number, comentario?: string) =>
    mudarStatus(c, s, autor, h(horasAtras), comentario);

  const c1 = criarChamado(1, { titulo: 'Sem acesso ao sistema de protocolo', descricao: 'Ao entrar aparece "usuário bloqueado" desde hoje cedo.', categoria: 'Acesso e senhas', prioridade: 'alta', solicitante: 'Carla Mendes' }, h(7.2));
  const c2 = a(criarChamado(2, { titulo: 'Servidor de arquivos lento', descricao: 'Abrir pastas da rede leva mais de um minuto em todo o setor.', categoria: 'Rede e internet', prioridade: 'critica', solicitante: 'Roberto Alves' }, h(2)), 'em_atendimento', 'João Camargo', 1.8);
  const c3 = a(a(criarChamado(3, { titulo: 'Monitor piscando na recepção', descricao: 'A tela pisca a cada poucos segundos, principalmente de manhã.', categoria: 'Equipamento', prioridade: 'baixa', solicitante: 'Lúcia Prado' }, h(30)), 'em_atendimento', 'Ana Ribeiro', 26), 'aguardando_solicitante', 'Ana Ribeiro', 25, 'Preciso do número de patrimônio do monitor.');
  const c4 = a(a(criarChamado(4, { titulo: 'Instalar leitor de PDF na sala 12', descricao: 'Os novos computadores da sala 12 não abrem PDFs.', categoria: 'Sistemas internos', prioridade: 'media', solicitante: 'Paulo Reis' }, h(20)), 'em_atendimento', 'João Camargo', 18), 'resolvido', 'João Camargo', 16, 'Instalado nos 6 computadores.');
  const c5 = criarChamado(5, { titulo: 'Criar e-mail para nova servidora', descricao: 'A servidora Fernanda Lima começa na segunda-feira no RH.', categoria: 'Acesso e senhas', prioridade: 'media', solicitante: 'Helena Duarte' }, h(3));
  const c6 = a(criarChamado(6, { titulo: 'Impressora do 2º andar parada', descricao: 'Mostra papel atolado mesmo vazia; já reiniciamos.', categoria: 'Equipamento', prioridade: 'alta', solicitante: 'Paulo Reis' }, h(10)), 'em_atendimento', 'Ana Ribeiro', 9);
  return [c1, c2, c3, c4, c5, c6];
}
