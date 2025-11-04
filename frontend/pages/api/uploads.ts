import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { v4 as uuid } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'news');

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Method Not Allowed');
    return;
  }

  const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  await ensureUploadsDir();

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(400).json({ error: 'Unable to parse form data' });
      return;
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      res.status(400).json({ error: 'Missing file' });
      return;
    }

    const extension = path.extname(file.originalFilename || '') || '.jpg';
    const fileName = `${uuid()}${extension}`;
    const destination = path.join(uploadsDir, fileName);

    await fs.copyFile(file.filepath, destination);
    try {
      await fs.unlink(file.filepath);
    } catch (unlinkErr) {
      console.warn('Could not remove temp file', unlinkErr);
    }
    res.status(201).json({ url: `/uploads/news/${fileName}` });
  });
}
