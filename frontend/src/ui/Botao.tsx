import type { ButtonHTMLAttributes } from 'react';

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo';
  tamanho?: 'normal' | 'pequeno';
}

export function Botao({ variante = 'primario', tamanho = 'normal', className = '', type = 'button', ...resto }: BotaoProps) {
  const classes = ['ui-botao', `ui-botao--${variante}`, tamanho === 'pequeno' && 'ui-botao--pequeno', className];
  return <button type={type} className={classes.filter(Boolean).join(' ')} {...resto} />;
}
