'use server';

import fs from 'fs';
import path from 'path';

export async function getImagesList() {
  const videoDir = path.join(process.cwd(), 'public/images');
  const files = fs.readdirSync(videoDir);
  return files.filter(file => file.endsWith('.jpg') || file.endsWith('.png'));
}
