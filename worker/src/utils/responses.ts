export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers,
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}
