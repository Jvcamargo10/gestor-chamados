import type { Meta, StoryObj } from '@storybook/react-vite';
import { Campo } from './Campo';

const meta = {
  title: 'Componentes/Campo',
  component: Campo,
  args: { rotulo: 'Título', placeholder: 'Ex.: VPN não conecta' },
} satisfies Meta<typeof Campo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Texto: Story = {};
export const ComAjuda: Story = { args: { ajuda: 'Use até 120 caracteres.' } };
export const ComErro: Story = { args: { erro: 'O título precisa ter pelo menos 5 caracteres.', defaultValue: 'Oi' } };
export const Area: Story = { args: { tipo: 'area', rotulo: 'Descrição', ajuda: 'O que aconteceu e desde quando.' } };
export const Lista: Story = {
  args: {
    tipo: 'lista',
    rotulo: 'Prioridade',
    opcoes: [
      { valor: 'baixa', rotulo: 'Baixa (até 72h)' },
      { valor: 'alta', rotulo: 'Alta (até 8h)' },
    ],
  },
};
