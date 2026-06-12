// Liveness probe for the staging host (Fly.io health checks hit this).
// Intentionally DB-free: it proves the server process is up and serving.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ status: "ok" });
}
