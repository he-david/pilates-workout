import type { ReactNode } from 'react'

type PageTitleProps = { title: string; children?: ReactNode }

/** Placeholder page body used until the real screens land. */
export function PageTitle({ title, children }: PageTitleProps) {
  return (
    <main className="flex flex-col gap-[18px] px-5 pt-[max(28px,env(safe-area-inset-top))] pb-5">
      <h1 className="text-3xl font-extrabold tracking-tight-display">{title}</h1>
      {children}
    </main>
  )
}
