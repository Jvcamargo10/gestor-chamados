import type { Meta, StoryObj } from '@storybook/react-vite';
import { Botao } from './Botao';

const meta = {
  title: 'Componentes/Botão',
  component: Botao,
  args: { children: 'Abrir chamado' },
  argTypes: { variante: { control: 'inline-radio' }, tamanho: { control: 'inline-radio' } },
} satisfies Meta<typeof Botao>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primario: Story = {};
export const Secundario: Story = { args: { variante: 'secundario', children: 'Cancelar' } };
export const Perigo: Story = { args: { variante: 'perigo', children: 'Fechar chamado' } };
export const Pequeno: Story = { args: { tamanho: 'pequeno', variante: 'secundario', children: 'Limpar filtros' } };
export const Desabilitado: Story = { args: { disabled: true } };
