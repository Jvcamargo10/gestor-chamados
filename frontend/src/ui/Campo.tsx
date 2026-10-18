import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface Base {
  rotulo: string;
  ajuda?: string;
  erro?: string | null;
}

type Props =
  | (Base & { tipo?: 'texto' } & InputHTMLAttributes<HTMLInputElement>)
  | (Base & { tipo: 'area' } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  | (Base & { tipo: 'lista'; opcoes: { valor: string; rotulo: string }[] } & SelectHTMLAttributes<HTMLSelectElement>);

/** Campo de formulário acessível: rótulo ligado ao controle, ajuda e erro anunciados por aria-describedby. */
export function Campo(props: Props) {
  const id = useId();
  const { rotulo, ajuda, erro } = props;
  const descricao = [ajuda && `${id}-ajuda`, erro && `${id}-erro`].filter(Boolean).join(' ') || undefined;
  const comuns = { id, className: 'ui-campo-controle', 'aria-invalid': erro ? true : undefined, 'aria-describedby': descricao };

  let controle;
  if (props.tipo === 'area') {
    const { rotulo: _r, ajuda: _a, erro: _e, tipo: _t, ...resto } = props;
    controle = <textarea {...resto} {...comuns} />;
  } else if (props.tipo === 'lista') {
    const { rotulo: _r, ajuda: _a, erro: _e, tipo: _t, opcoes, ...resto } = props;
    controle = (
      <select {...resto} {...comuns}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    );
  } else {
    const { rotulo: _r, ajuda: _a, erro: _e, tipo: _t, ...resto } = props;
    controle = <input {...resto} {...comuns} />;
  }

  return (
    <div className="ui-campo">
      <label htmlFor={id} className="ui-campo-rotulo">
        {rotulo}
      </label>
      {controle}
      {ajuda && (
        <span id={`${id}-ajuda`} className="ui-campo-ajuda">
          {ajuda}
        </span>
      )}
      {erro && (
        <span id={`${id}-erro`} className="ui-campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}
