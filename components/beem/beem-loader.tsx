/**
 * Full-screen branded splash. A fixed overlay so it covers the header too,
 * shown while a route segment is still streaming from the server.
 */
export function BeemLoader() {
  return (
    <div className="beem-loader" role="status" aria-label="Loading">
      <img src="/beem-logo.svg" alt="" className="beem-loader-mark" />
    </div>
  )
}
