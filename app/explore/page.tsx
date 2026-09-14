import { permanentRedirect } from 'next/navigation'

/** Explore moved to /live/<category>; the old URL and its query keep working. */
export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  permanentRedirect(`/live/${category ? encodeURIComponent(category) : 'nearby'}`)
}
