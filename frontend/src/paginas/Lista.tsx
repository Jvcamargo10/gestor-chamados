import { PRIORIDADES, ROTULO_PRIORIDADE, ROTULO_STATUS, STATUS, type Chamado, type Filtro, type Resumo } from '@dominio/chamado';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../api/api';
import { Botao, Campo, Cartao, Indicador, SeloPrioridade, SeloSla, SeloStatus, Vazio } from '../ui';
import { useAgora } from './useAgora';

export function Lista() {
  const api = useApi();
  const agora = useAgora();
  const [filtro, setFiltro] = useState<Filtro>({});
  const [chamados, setChamados] = useState<Chamado[] | null>(null);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    Promise.all([api.listar(filtro), api.resumo()])
      .then(([lista, r]) => {
        if (!ativo) return;
        setChamados(lista);
        setResumo(r);
      })
      .catch((e: Error) => ativo && setErro(e.message));
    return () => {
      ativo = false;
    };
  }, [api, filtro]);

  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Chamados</h1>
          <p className="lead">Fila do service desk, ordenada pelo prazo de atendimento.</p>
        </div>
        <Link to="/novo" className="ui-botao ui-botao--primario">
          Abrir chamado
        </Link>
      </div>

      {resumo && (
        <div className="indicadores" aria-label="Resumo">
          <Indicador valor={resumo.abertos} rotulo="em aberto" />
          <Indicador valor={resumo.vencendo} rotulo="vencendo o SLA" tom={resumo.vencendo ? 'alerta' : undefined} />
          <Indicador valor={resumo.atrasados} rotulo="atrasados" tom={resumo.atrasados ? 'perigo' : undefined} />
          <Indicador valor={resumo.resolvidosNoPrazo} rotulo="resolvidos no prazo" />
        </div>
      )}

      <Cartao>
        <form className="filtros" role="search" onSubmit={(e) => e.preventDefault()}>
          <Campo rotulo="Buscar" placeholder="Título, solicitante ou nº" value={filtro.busca ?? ''}
            onChange={(e) => setFiltro((f) => ({ ...f, busca: e.target.value || undefined }))} />
          <Campo tipo="lista" rotulo="Status" value={filtro.status ?? ''}
            opcoes={[{ valor: '', rotulo: 'Todos' }, ...STATUS.map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))]}
            onChange={(e) => setFiltro((f) => ({ ...f, status: (e.target.value || undefined) as Filtro['status'] }))} />
          <Campo tipo="lista" rotulo="Prioridade" value={filtro.prioridade ?? ''}
            opcoes={[{ valor: '', rotulo: 'Todas' }, ...PRIORIDADES.map((p) => ({ valor: p, rotulo: ROTULO_PRIORIDADE[p] }))]}
            onChange={(e) => setFiltro((f) => ({ ...f, prioridade: (e.target.value || undefined) as Filtro['prioridade'] }))} />
          {(filtro.busca || filtro.status || filtro.prioridade) && (
            <Botao variante="secundario" tamanho="pequeno" onClick={() => setFiltro({})}>
              Limpar filtros
            </Botao>
          )}
        </form>

        {erro && <p className="erro" role="alert">{erro}</p>}
        {chamados === null && !erro && <p className="muted">Carregando…</p>}
        {chamados?.length === 0 && <Vazio titulo="Nenhum chamado encontrado">Ajuste os filtros ou abra um chamado.</Vazio>}
        {!!chamados?.length && (
          <ul className="lista-chamados">
            {chamados.map((c) => (
              <li key={c.id}>
                <Link to={`/chamados/${c.id}`} className="linha-chamado">
                  <span className="id">#{c.id}</span>
                  <span className="titulo">
                    <strong>{c.titulo}</strong>
                    <span className="muted">{c.solicitante} · {c.categoria}</span>
                  </span>
                  <span className="selos">
                    <SeloPrioridade prioridade={c.prioridade} />
                    <SeloStatus status={c.status} />
                    <SeloSla chamado={c} agora={agora} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Cartao>
    </>
  );
}
