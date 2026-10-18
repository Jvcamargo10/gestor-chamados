import { criarChamado } from '@dominio/chamado';
import { render, screen } from '@testing-library/react';
import { Campo, SeloSla } from '../ui';

describe('design system', () => {
  it('Campo liga rótulo, ajuda e erro ao controle', () => {
    render(<Campo rotulo="Título" ajuda="Seja breve" erro="Obrigatório" defaultValue="" />);
    const campo = screen.getByLabelText('Título');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('Seja breve Obrigatório');
  });

  it('SeloSla mostra o tempo e não depende só da cor', () => {
    const t0 = new Date('2026-10-19T09:00:00Z');
    const c = criarChamado(1, { titulo: 'VPN não conecta', descricao: 'Erro 809 ao conectar.', categoria: 'Rede e internet', prioridade: 'alta', solicitante: 'Rita' }, t0);
    const { rerender } = render(<SeloSla chamado={c} agora={new Date('2026-10-19T15:30:00Z')} />);
    expect(screen.getByText('Vencendo · 1h 30min restantes')).toBeInTheDocument();
    rerender(<SeloSla chamado={c} agora={new Date('2026-10-19T19:00:00Z')} />);
    expect(screen.getByText('Atrasado há 2h 00min')).toBeInTheDocument();
  });
});
