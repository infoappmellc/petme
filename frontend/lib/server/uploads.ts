import type { File } from 'formidable';
import { promises as fs } from 'node:fs';

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.filepath) {
      fs.readFile(file.filepath)
        .then((buffer) => {
          const contentType = file.mimetype || 'application/octet-stream';
          const base64 = buffer.toString('base64');
          resolve(`data:${contentType};base64,${base64}`);
        })
        .catch(reject);
      return;
    }

    if (file.toBuffer) {
      file.toBuffer((err, buffer) => {
        if (err) return reject(err);
        const contentType = file.mimetype || 'application/octet-stream';
        const base64 = buffer.toString('base64');
        resolve(`data:${contentType};base64,${base64}`);
      });
      return;
    }

    reject(new Error('Unsupported file upload source'));
  });
}
