import { ROTULO_STATUS, TRANSICOES, type Chamado, type Status } from '@dominio/chamado';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../api/api';
import { Botao, Campo, Cartao, SeloPrioridade, SeloSla, SeloStatus } from '../ui';
import { useAgora } from './useAgora';

function rotuloAcao(atual: Status, destino: Status): string {
  if (destino === 'em_atendimento') return atual === 'aberto' ? 'Assumir atendimento' : atual === 'resolvido' ? 'Reabrir' : 'Retomar atendimento';
  return { aguardando_solicitante: 'Pedir informação', resolvido: 'Marcar como resolvido', fechado: 'Fechar' }[destino as string] ?? ROTULO_STATUS[destino];
}

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function Detalhe() {
  const { id } = useParams();
  const api = useApi();
  const agora = useAgora();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [autor, setAutor] = useState('');
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.obter(Number(id)).then(setChamado).catch((e: Error) => setErro(e.message));
  }, [api, id]);

  async function executar(operacao: () => Promise<Chamado>) {
    setSalvando(true);
    setErro(null);
    try {
      setChamado(await operacao());
      setTexto('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  if (!chamado)
    return erro ? <p className="erro" role="alert">{erro} <Link to="/">Voltar</Link></p> : <p className="muted">Carregando…</p>;

  const comentar = (e: FormEvent) => {
    e.preventDefault();
    executar(() => api.comentar(chamado.id, autor, texto));
  };
  const mudar = (s: Status) => executar(() => api.mudarStatus(chamado.id, s, autor, texto || undefined));

  return (
    <>
      <p className="muted"><Link to="/">← Chamados</Link></p>
      <div className="cabecalho-pagina">
        <div>
          <h1>#{chamado.id} · {chamado.titulo}</h1>
          <div className="selos">
            <SeloStatus status={chamado.status} />
            <SeloPrioridade prioridade={chamado.prioridade} />
            <SeloSla chamado={chamado} agora={agora} />
          </div>
        </div>
      </div>

      <div className="detalhe">
        <div className="coluna">
          <Cartao titulo="Descrição">
            <p className="descricao">{chamado.descricao}</p>
            <dl className="ficha">
              <dt>Solicitante</dt><dd>{chamado.solicitante}</dd>
              <dt>Categoria</dt><dd>{chamado.categoria}</dd>
              <dt>Responsável</dt><dd>{chamado.responsavel ?? '—'}</dd>
              <dt>Aberto em</dt><dd>{dataHora(chamado.criadoEm)}</dd>
              <dt>Prazo</dt><dd>{dataHora(chamado.prazo)}</dd>
            </dl>
          </Cartao>

          <Cartao titulo="Histórico">
            <ol className="historico">
              {chamado.historico.map((ev, i) => (
                <li key={i} data-tipo={ev.tipo}>
                  <span className="muted">{dataHora(ev.em)} · {ev.autor}</span>
                  <span>{ev.texto}</span>
                </li>
              ))}
            </ol>
          </Cartao>
        </div>

        <Cartao titulo="Atualizar">
          {TRANSICOES[chamado.status].length === 0 ? (
            <p className="muted">Chamado {ROTULO_STATUS[chamado.status].toLowerCase()}. Nada mais a fazer.</p>
          ) : (
            <form onSubmit={comentar} className="formulario">
              <Campo rotulo="Seu nome" value={autor} onChange={(e) => setAutor(e.target.value)} required />
              <Campo tipo="area" rotulo="Comentário" value={texto} onChange={(e) => setTexto(e.target.value)}
                ajuda="Também vai junto com a mudança de status, se houver." />
              {erro && <p className="erro" role="alert">{erro}</p>}
              <Botao type="submit" variante="secundario" disabled={salvando || !autor.trim() || !texto.trim()}>
                Comentar
              </Botao>
              <div className="acoes">
                {TRANSICOES[chamado.status].map((s) => (
                  <Botao key={s} disabled={salvando || !autor.trim()} variante={s === 'fechado' ? 'perigo' : 'primario'} onClick={() => mudar(s)}>
                    {rotuloAcao(chamado.status, s)}
                  </Botao>
                ))}
              </div>
            </form>
          )}
        </Cartao>
      </div>
    </>
  );
}
