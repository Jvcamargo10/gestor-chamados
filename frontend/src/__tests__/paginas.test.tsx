import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ApiContexto } from '../api/api';
import { ApiDemo } from '../api/api-demo';
import { Detalhe } from '../paginas/Detalhe';
import { Lista } from '../paginas/Lista';
import { Novo } from '../paginas/Novo';

function montar(rota: string, api = new ApiDemo(() => new Date(), false)) {
  render(
    <ApiContexto.Provider value={api}>
      <MemoryRouter initialEntries={[rota]}>
        <Routes>
          <Route path="/" element={<Lista />} />
          <Route path="/novo" element={<Novo />} />
          <Route path="/chamados/:id" element={<Detalhe />} />
        </Routes>
      </MemoryRouter>
    </ApiContexto.Provider>,
  );
  return api;
}

describe('páginas', () => {
  it('lista a fila com o atrasado primeiro e filtra por prioridade', async () => {
    montar('/');
    const itens = await screen.findAllByRole('listitem');
    expect(itens[0]).toHaveTextContent('Impressora do 2º andar parada');
    expect(within(itens[0]).getByText(/Atrasado há/)).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Prioridade'), 'critica');
    expect(await screen.findByText('Servidor de arquivos lento')).toBeInTheDocument();
    expect(screen.queryByText('Impressora do 2º andar parada')).not.toBeInTheDocument();
  });

  it('valida o formulário antes de enviar e abre o chamado', async () => {
    const api = montar('/novo');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));
    expect(screen.getByText('O título precisa ter pelo menos 5 caracteres.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Título'), 'Teclado sem funcionar');
    await userEvent.type(screen.getByLabelText('Descrição'), 'Várias teclas não respondem.');
    await userEvent.type(screen.getByLabelText('Solicitante'), 'Rita Gomes');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir chamado' }));

    expect(await screen.findByRole('heading', { name: '#7 · Teclado sem funcionar' })).toBeInTheDocument();
    expect((await api.obter(7)).status).toBe('aberto');
  });

  it('mostra só as ações permitidas e o erro da regra de negócio', async () => {
    montar('/chamados/2');
    await screen.findByRole('heading', { name: /Servidor de arquivos lento/ });
    expect(screen.queryByRole('button', { name: 'Fechar' })).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Seu nome'), 'João');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir informação' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Diga o que está faltando para o solicitante.');

    await userEvent.type(screen.getByLabelText('Comentário'), 'Qual pasta está lenta?');
    await userEvent.click(screen.getByRole('button', { name: 'Pedir informação' }));
    expect(await screen.findByText('Em atendimento → Aguardando solicitante: Qual pasta está lenta?')).toBeInTheDocument();
  });
});
