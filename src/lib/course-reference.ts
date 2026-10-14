import { PDFParse } from 'pdf-parse';
export async function extractCourseReference(file: File | null) {
  if (!file || !file.size) return { text: '', truncated: false };
  if (file.size > 5 * 1024 * 1024) throw new Error('FILE_TOO_LARGE');
  const extension = file.name.split('.').pop()?.toLowerCase();
  let text = ''; let morePages = false;
  if (extension === 'pdf') {
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (Buffer.from(bytes.subarray(0,5)).toString() !== '%PDF-') throw new Error('INVALID_FILE');
    const parser = new PDFParse({ data: bytes, isEvalSupported: false });
    try { const result = await parser.getText({ first: 20, pageJoiner: '' }); text = result.text; morePages = result.total > 20; }
    catch { throw new Error('INVALID_FILE'); }
    finally { await parser.destroy(); }
    if (text.trim().length < 20) throw new Error('PDF_NO_TEXT');
  } else if (extension === 'txt' || extension === 'md') {
    text = await file.text();
    if (text.length > 30000 || text.includes('\u0000')) throw new Error('INVALID_FILE');
  } else throw new Error('INVALID_FILE');
  return { text: text.trim().slice(0,6000), truncated: morePages || text.trim().length > 6000 };
}
