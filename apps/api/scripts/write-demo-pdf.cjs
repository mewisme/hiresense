const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'test', 'fixtures', 'demo');
fs.mkdirSync(outDir, { recursive: true });

const content =
  'BT /F1 12 Tf 72 720 Td (An Nguyen) Tj 0 -20 Td (Full-stack developer) Tj 0 -20 Td (Skills: TypeScript, React, NestJS, PostgreSQL, Docker, Git) Tj 0 -20 Td (Experience: Software Engineer at Demo Soft 2023-2025) Tj 0 -20 Td (Education: Bachelor of Computer Science) Tj ET';

const objects = [
  '1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj',
  '2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj',
  '3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj',
  `4 0 obj<< /Length ${Buffer.byteLength(content)} >>stream\n${content}\nendstream\nendobj`,
  '5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj',
];

let body = '%PDF-1.4\n';
const offsets = [0];
for (const obj of objects) {
  offsets.push(Buffer.byteLength(body));
  body += `${obj}\n`;
}
const xrefStart = Buffer.byteLength(body);
body += `xref\n0 ${objects.length + 1}\n`;
body += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i += 1) {
  body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
body += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

const outFile = path.join(outDir, 'cv-an-nguyen.pdf');
fs.writeFileSync(outFile, body);
console.log(`wrote ${outFile} (${Buffer.byteLength(body)} bytes)`);
