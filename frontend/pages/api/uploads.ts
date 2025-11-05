import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { File } from 'formidable';
import { ensureAdmin } from '../../lib/server/auth';
import { fileToDataUrl } from '../../lib/server/uploads';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest): Promise<File> {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      const file = (files.file || files.image || files.upload) as File | File[] | undefined;
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      resolve(Array.isArray(file) ? file[0] : file);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!ensureAdmin(req, res)) return;

  try {
    const file = await parseForm(req);
    const dataUrl = await fileToDataUrl(file);
    res.status(200).json({ url: dataUrl });
  } catch (error) {
    console.error('Failed to process upload', error);
    res.status(400).json({ error: (error as Error).message || 'Unable to process upload' });
  }
}
