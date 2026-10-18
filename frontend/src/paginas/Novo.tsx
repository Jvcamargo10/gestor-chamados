import { CATEGORIAS, PRIORIDADES, ROTULO_PRIORIDADE, SLA_HORAS, validarNovo, type NovoChamado } from '@dominio/chamado';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/api';
import { Botao, Campo, Cartao } from '../ui';

const vazio: NovoChamado = { titulo: '', descricao: '', categoria: 'Outros', prioridade: 'media', solicitante: '' };

export function Novo() {
  const api = useApi();
  const navegar = useNavigate();
  const [dados, setDados] = useState<NovoChamado>(vazio);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const alterar = <K extends keyof NovoChamado>(campo: K, valor: NovoChamado[K]) => setDados((d) => ({ ...d, [campo]: valor }));
  const erroDe = (trecho: string) => erros.find((e) => e.toLowerCase().includes(trecho)) ?? null;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const encontrados = validarNovo(dados);
    setErros(encontrados);
    if (encontrados.length) return;
    setEnviando(true);
    try {
      const criado = await api.criar(dados);
      navegar(`/chamados/${criado.id}`);
    } catch (err) {
      setErros([err instanceof Error ? err.message : 'Não foi possível abrir o chamado.']);
      setEnviando(false);
    }
  }

  return (
    <>
      <h1>Abrir chamado</h1>
      <p className="lead">Descreva o problema. O prazo de atendimento depende da prioridade.</p>
      <Cartao className="formulario-chamado">
        <form onSubmit={enviar} noValidate className="formulario">
          <Campo rotulo="Título" value={dados.titulo} onChange={(e) => alterar('titulo', e.target.value)} erro={erroDe('título')} maxLength={120} />
          <Campo tipo="area" rotulo="Descrição" value={dados.descricao} onChange={(e) => alterar('descricao', e.target.value)}
            erro={erroDe('descreva')} ajuda="O que aconteceu, desde quando e o que já foi tentado." />
          <div className="duas-colunas">
            <Campo tipo="lista" rotulo="Categoria" value={dados.categoria}
              opcoes={CATEGORIAS.map((c) => ({ valor: c, rotulo: c }))}
              onChange={(e) => alterar('categoria', e.target.value as NovoChamado['categoria'])} />
            <Campo tipo="lista" rotulo="Prioridade" value={dados.prioridade}
              opcoes={PRIORIDADES.map((p) => ({ valor: p, rotulo: `${ROTULO_PRIORIDADE[p]} (até ${SLA_HORAS[p]}h)` }))}
              onChange={(e) => alterar('prioridade', e.target.value as NovoChamado['prioridade'])} />
          </div>
          <Campo rotulo="Solicitante" value={dados.solicitante} onChange={(e) => alterar('solicitante', e.target.value)} erro={erroDe('quem')} />
          {erros.length > 0 && !erroDe('título') && !erroDe('descreva') && !erroDe('quem') && (
            <p className="erro" role="alert">{erros.join(' ')}</p>
          )}
          <div className="acoes">
            <Botao type="submit" disabled={enviando}>{enviando ? 'Abrindo…' : 'Abrir chamado'}</Botao>
            <Botao variante="secundario" onClick={() => navegar('/')}>Cancelar</Botao>
          </div>
        </form>
      </Cartao>
    </>
  );
}
