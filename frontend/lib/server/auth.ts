import type { NextApiRequest, NextApiResponse } from 'next';

export function extractAdminToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  const headerToken = req.headers['x-admin-token'];
  if (Array.isArray(headerToken)) {
    return headerToken[0];
  }
  if (headerToken) {
    return headerToken;
  }
  return null;
}

export function ensureAdmin(req: NextApiRequest, res: NextApiResponse): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_TOKEN is not configured' });
    return false;
  }
  const provided = extractAdminToken(req);
  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
