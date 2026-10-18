import { Chamado, NovoChamado, comentar, criarChamado, mudarStatus, resumir, situacaoSla, tempoRestante } from '../src/dominio/chamado';

const t0 = new Date('2026-10-19T09:00:00Z');
const horas = (h: number) => new Date(t0.getTime() + h * 3_600_000);
const novo: NovoChamado = {
  titulo: 'Sem acesso ao sistema de protocolo',
  descricao: 'Ao entrar aparece "usuário bloqueado".',
  categoria: 'Acesso e senhas',
  prioridade: 'alta',
  solicitante: 'Carla Mendes',
};

describe('chamado', () => {
  it('nasce aberto, com prazo de acordo com a prioridade', () => {
    const c = criarChamado(1, novo, t0);
    expect(c.status).toBe('aberto');
    expect(c.prazo).toBe(horas(8).toISOString());
    expect(c.historico).toHaveLength(1);
  });

  it('rejeita dados incompletos com mensagens claras', () => {
    expect(() => criarChamado(1, { ...novo, titulo: 'Oi', solicitante: ' ' }, t0)).toThrow(
      'O título precisa ter pelo menos 5 caracteres. Informe quem está abrindo o chamado.',
    );
  });

  it('segue o fluxo: quem assume vira responsável; não pula etapas', () => {
    let c = criarChamado(1, novo, t0);
    expect(() => mudarStatus(c, 'resolvido', 'João', t0)).toThrow('Não é possível passar de "Aberto" para "Resolvido".');
    c = mudarStatus(c, 'em_atendimento', 'João', horas(1));
    expect(c.responsavel).toBe('João');
    c = mudarStatus(c, 'resolvido', 'João', horas(2), 'Senha redefinida');
    expect(c.resolvidoEm).toBe(horas(2).toISOString());
    expect(c.historico.at(-1)?.texto).toBe('Em atendimento → Resolvido: Senha redefinida');
  });

  it('exige motivo para aguardar o solicitante e bloqueia comentário em chamado fechado', () => {
    let c = mudarStatus(criarChamado(1, novo, t0), 'em_atendimento', 'João', t0);
    expect(() => mudarStatus(c, 'aguardando_solicitante', 'João', t0)).toThrow('Diga o que está faltando para o solicitante.');
    c = mudarStatus(mudarStatus(c, 'resolvido', 'João', t0), 'fechado', 'João', t0);
    expect(() => comentar(c, 'Carla', 'Obrigada', t0)).toThrow('Chamado fechado não recebe comentários.');
  });
});

describe('SLA', () => {
  const c: Chamado = criarChamado(1, novo, t0);

  it('fica "vencendo" no último quarto do prazo e "atrasado" depois dele', () => {
    expect(situacaoSla(c, horas(5))).toBe('no_prazo');
    expect(situacaoSla(c, horas(6.5))).toBe('vencendo');
    expect(situacaoSla(c, horas(9))).toBe('atrasado');
    expect(tempoRestante(c, horas(9.5))).toBe('atrasado há 1h 30min');
  });

  it('avalia cumprido ou violado pela data de resolução', () => {
    const atendido = mudarStatus(c, 'em_atendimento', 'João', horas(1));
    expect(situacaoSla(mudarStatus(atendido, 'resolvido', 'João', horas(7)), horas(30))).toBe('cumprido');
    expect(situacaoSla(mudarStatus(atendido, 'resolvido', 'João', horas(9)), horas(30))).toBe('violado');
  });

  it('resume a fila', () => {
    const lista = [c, criarChamado(2, { ...novo, prioridade: 'baixa' }, t0)];
    expect(resumir(lista, horas(9))).toEqual({ abertos: 2, vencendo: 0, atrasados: 1, resolvidosNoPrazo: 0 });
  });
});
