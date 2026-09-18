const API_URL = (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Uploaded images are stored by the API and addressed as /media/<id>, so the
  // same address works as an <img src> on this site whichever host the API is on.
  async rewrites() {
    return [{ source: '/media/:id', destination: `${API_URL}/media/:id` }]
  },
}

export default nextConfig
