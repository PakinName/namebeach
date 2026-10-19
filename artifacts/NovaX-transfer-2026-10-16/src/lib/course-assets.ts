import path from 'node:path';
export const assetDirectory = path.join(process.cwd(), '.data', 'course-assets');
export const assetPath = (id: string) => {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid asset');
  return path.join(assetDirectory, id);
};
export function detectAsset(name: string, bytes: Buffer): string | null {
  const extension = path.extname(name).toLowerCase();
  if (extension === '.png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (['.jpg','.jpeg'].includes(extension) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (extension === '.webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (extension === '.pdf' && bytes.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  if (['.txt','.md','.csv'].includes(extension) && !bytes.includes(0)) return 'text/plain';
  const office: Record<string,string> = { '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  if (office[extension] && bytes[0] === 80 && bytes[1] === 75 && bytes[2] === 3 && bytes[3] === 4) return office[extension];
  return null;
}
