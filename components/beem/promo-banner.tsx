import type { Promo } from './data'

export function PromoBanner({ promo }: { promo: Promo }) {
  return <article className={`promo-banner ${promo.className}`}><div><span className="promo-brand">{promo.eyebrow}</span><p>{promo.title}</p></div><button type="button">{promo.action}</button></article>
}
