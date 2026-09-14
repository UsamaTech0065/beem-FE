# beem-web

Next.js 16 front end for beem. The API lives separately in `../Beem-backend`.

## First run

```bash
npm install
cp .env.example .env.local     # point NEXT_PUBLIC_API_URL at the running API
npm run dev
```

Runs on `http://localhost:3000`. Start the API separately:

```bash
cd ../Beem-backend && npm run dev
```

## Notes

- `lib/api-types.ts` mirrors the API's `src/contract.ts`. The two projects are
  independent, so a response-shape change has to be made in both.
- `NEXT_PUBLIC_API_URL` is read at build time and baked into the client bundle.
  A different environment needs a different build, or a runtime config shim.

## When the API is unreachable

The public feeds (`/`, `/live/*`) and the category tabs fall back to bundled
demo content from `lib/demo-data.ts`, which mirrors the API's seed. The site
therefore looks alive on a deployment whose backend is down, asleep, or not
yet configured. The fallback applies only when the request fails; an API that
answers with an empty list is shown as empty. Personalised feeds never use it.
One warning per endpoint is logged server-side so a dead API is visible.

## Sessions

Tokens live in httpOnly cookies written by the handlers under `app/api/auth/`.
Access tokens last 15 minutes and refresh tokens 30 days.

`proxy.ts` runs before every page and RSC request. When the access cookie is
missing, or its token expires within 60 seconds, it exchanges the refresh
cookie for a new pair and sets both on the response. Next merges those into
`cookies()` for the same render, so the page sees the new token immediately.

The API rotates the refresh token on every use and treats a second use as
theft, revoking every session for the user. A browser can send several
requests with the same old cookie before the first response lands (a page plus
its link prefetches), so `lib/refresh.ts` performs one exchange per token and
remembers the result for 30 seconds. That memory is per process: behind a load
balancer, use sticky sessions or move the map to a shared store.
