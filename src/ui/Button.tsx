import type { ComponentProps } from 'react'
import { Link } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-ink text-lg font-extrabold',
  secondary: 'border-[1.5px] border-border text-ink text-md font-bold',
  ghost: 'text-link text-md font-bold',
}

const BASE =
  'flex h-[54px] items-center justify-center gap-2 rounded-xl no-underline touch-manipulation'

type ButtonProps = { variant?: Variant } & ComponentProps<'button'>
type ButtonLinkProps = { variant?: Variant; to: string } & Omit<ComponentProps<typeof Link>, 'to'>

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest} />
}

export function ButtonLink({ variant = 'primary', className = '', ...rest }: ButtonLinkProps) {
  return <Link className={`${BASE} ${VARIANTS[variant]} ${className}`} {...rest} />
}
