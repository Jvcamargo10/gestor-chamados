import type { ReactNode } from 'react';

export function Cartao({ titulo, children, className = '' }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`ui-cartao ${className}`.trim()} aria-label={titulo}>
      {titulo && <h2 className="ui-cartao-titulo">{titulo}</h2>}
      {children}
    </section>
  );
}

export function Indicador({ valor, rotulo, tom }: { valor: ReactNode; rotulo: string; tom?: 'alerta' | 'perigo' }) {
  return (
    <div className={`ui-indicador${tom ? ` ui-indicador--${tom}` : ''}`}>
      <strong>{valor}</strong>
      <span>{rotulo}</span>
    </div>
  );
}

export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="ui-vazio">
      <strong>{titulo}</strong>
      {children}
    </div>
  );
}
