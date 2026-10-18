import type { Meta, StoryObj } from '@storybook/react-vite';
import { Botao } from './Botao';
import { Cartao, Indicador, Vazio } from './Cartao';

const meta = { title: 'Componentes/Cartão e indicadores', component: Cartao, args: { children: null } } satisfies Meta<typeof Cartao>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComTitulo: Story = { args: { titulo: 'Descrição', children: <p>Mostra papel atolado mesmo vazia.</p> } };

export const Indicadores: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 180px)', gap: 12 }}>
      <Indicador valor={5} rotulo="em aberto" />
      <Indicador valor={1} rotulo="vencendo o SLA" tom="alerta" />
      <Indicador valor={2} rotulo="atrasados" tom="perigo" />
    </div>
  ),
};

export const EstadoVazio: Story = {
  render: () => (
    <Cartao>
      <Vazio titulo="Nenhum chamado encontrado">
        <p>Ajuste os filtros ou abra um chamado.</p>
        <Botao>Abrir chamado</Botao>
      </Vazio>
    </Cartao>
  ),
};
