import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import { ApiContexto, type ApiChamados } from './api/api';
import { Detalhe } from './paginas/Detalhe';
import { Lista } from './paginas/Lista';
import { Novo } from './paginas/Novo';

export function App({ api, demo, urlStorybook }: { api: ApiChamados; demo: boolean; urlStorybook: string }) {
  return (
    <ApiContexto.Provider value={api}>
      <HashRouter>
        {demo && (
          <div className="faixa-demo" role="note">
            Modo demonstração: os dados ficam só no seu navegador e as regras são as mesmas da API Node.
          </div>
        )}
        <header className="topo">
          <Link to="/" className="marca">
            <span className="marca-icone" aria-hidden="true">✓</span> Gestor de Chamados
          </Link>
          <nav aria-label="Principal">
            <Link to="/">Chamados</Link>
            <Link to="/novo">Abrir chamado</Link>
            <a href={urlStorybook}>Design system</a>
          </nav>
        </header>
        <main className="conteudo">
          <Routes>
            <Route path="/" element={<Lista />} />
            <Route path="/novo" element={<Novo />} />
            <Route path="/chamados/:id" element={<Detalhe />} />
          </Routes>
        </main>
        <footer className="rodape">
          Projeto de portfólio de <a href="https://jvcamargo10.github.io/portfolio/">João Camargo</a> ·{' '}
          <a href="https://github.com/Jvcamargo10/gestor-chamados">código no GitHub</a>
        </footer>
      </HashRouter>
    </ApiContexto.Provider>
  );
}
