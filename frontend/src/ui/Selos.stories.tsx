import { criarChamado, mudarStatus, PRIORIDADES, STATUS } from '@dominio/chamado';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Selo } from './Selo';
import { SeloPrioridade, SeloSla, SeloStatus } from './Selos';

const meta = { title: 'Componentes/Selos', component: Selo, args: { children: 'Selo' } } satisfies Meta<typeof Selo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['neutro', 'marca', 'sucesso', 'alerta', 'perigo'] as const).map((t) => (
        <Selo key={t} tom={t}>{t}</Selo>
      ))}
    </div>
  ),
};

export const StatusEPrioridade: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{STATUS.map((s) => <SeloStatus key={s} status={s} />)}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{PRIORIDADES.map((p) => <SeloPrioridade key={p} prioridade={p} />)}</div>
    </div>
  ),
};

const t0 = new Date('2026-10-19T09:00:00Z');
const chamado = criarChamado(1, { titulo: 'VPN não conecta', descricao: 'Erro 809 ao conectar.', categoria: 'Rede e internet', prioridade: 'alta', solicitante: 'Rita' }, t0);
const h = (horas: number) => new Date(t0.getTime() + horas * 3_600_000);

export const Sla: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <SeloSla chamado={chamado} agora={h(2)} />
      <SeloSla chamado={chamado} agora={h(6.5)} />
      <SeloSla chamado={chamado} agora={h(10)} />
      <SeloSla chamado={mudarStatus(mudarStatus(chamado, 'em_atendimento', 'João', h(1)), 'resolvido', 'João', h(5))} agora={h(20)} />
    </div>
  ),
};
