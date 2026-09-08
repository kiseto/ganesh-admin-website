// Setup is CLI-only: database migrations and seeds never run through a web endpoint.
export async function POST() {
  return Response.json({ error: "Use the local migration and seed commands. Web bootstrap is disabled." }, { status: 410 });
}
