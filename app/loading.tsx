import { BeemLoader } from '@/components/beem/beem-loader'

// Next renders this while any route segment without its own loading UI streams,
// so the branded splash appears across the whole app on first load and navigation.
export default function Loading() {
  return <BeemLoader />
}
