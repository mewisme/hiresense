export function createAttachmentDisposition(filename: string): string {
  const safe = filename.replace(/[\r\n]/g, '').trim() || 'resume.pdf';
  const fallback = safe.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}