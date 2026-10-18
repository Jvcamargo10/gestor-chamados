import type { ReactNode } from 'react';

export type TomSelo = 'neutro' | 'marca' | 'sucesso' | 'alerta' | 'perigo';

/** Etiqueta curta. Sempre tem texto: a cor nunca é a única forma de informar o estado. */
export function Selo({ tom = 'neutro', ponto = false, children }: { tom?: TomSelo; ponto?: boolean; children: ReactNode }) {
  return (
    <span className={`ui-selo ui-selo--${tom}`}>
      {ponto && <span className="ui-selo-ponto" aria-hidden="true" />}
      {children}
    </span>
  );
}
