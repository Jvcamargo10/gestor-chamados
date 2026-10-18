import {
  ROTULO_PRIORIDADE, ROTULO_STATUS, situacaoSla, tempoRestante, type Chamado, type Prioridade, type SituacaoSla, type Status,
} from '@dominio/chamado';
import { Selo, type TomSelo } from './Selo';

const TOM_STATUS: Record<Status, TomSelo> = {
  aberto: 'marca',
  em_atendimento: 'alerta',
  aguardando_solicitante: 'neutro',
  resolvido: 'sucesso',
  fechado: 'neutro',
};

const TOM_PRIORIDADE: Record<Prioridade, TomSelo> = { baixa: 'neutro', media: 'marca', alta: 'alerta', critica: 'perigo' };

const SLA: Record<SituacaoSla, { tom: TomSelo; rotulo: string }> = {
  no_prazo: { tom: 'sucesso', rotulo: 'No prazo' },
  vencendo: { tom: 'alerta', rotulo: 'Vencendo' },
  atrasado: { tom: 'perigo', rotulo: 'Atrasado' },
  cumprido: { tom: 'sucesso', rotulo: 'SLA cumprido' },
  violado: { tom: 'perigo', rotulo: 'SLA violado' },
};

export function SeloStatus({ status }: { status: Status }) {
  return <Selo tom={TOM_STATUS[status]}>{ROTULO_STATUS[status]}</Selo>;
}

export function SeloPrioridade({ prioridade }: { prioridade: Prioridade }) {
  return (
    <Selo tom={TOM_PRIORIDADE[prioridade]} ponto>
      {ROTULO_PRIORIDADE[prioridade]}
    </Selo>
  );
}

export function SeloSla({ chamado, agora }: { chamado: Chamado; agora: Date }) {
  const situacao = situacaoSla(chamado, agora);
  const s = SLA[situacao];
  const ativo = !chamado.resolvidoEm && chamado.status !== 'fechado';
  const texto = !ativo
    ? s.rotulo
    : situacao === 'atrasado'
      ? `Atrasado há ${tempoRestante(chamado, agora).replace('atrasado há ', '')}`
      : `${s.rotulo} · ${tempoRestante(chamado, agora)}`;
  return <Selo tom={s.tom}>{texto}</Selo>;
}
