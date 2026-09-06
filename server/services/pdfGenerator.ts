/**
 * Lightweight pure TypeScript PDF 1.4 Generator
 * Creates valid multi-page PDF files with embedded text, headers, margins, and page numbers
 * without requiring external heavy binary CLI dependencies.
 */

export interface PdfPageContent {
  pageNumber: number;
  title: string;
  chapter?: string;
  content: string[];
}

export function generateMultiPagePdf(
  documentTitle: string,
  author: string,
  pages: PdfPageContent[]
): Buffer {
  const safePages = pages.length > 0 ? pages : [
    {
      pageNumber: 1,
      title: documentTitle,
      chapter: 'Introduction',
      content: ['IKSHOVIA Learner Resource Library', 'Official Reference Document'],
    },
  ];

  const objects: string[] = [];

  const addObject = (content: string): number => {
    objects.push(content);
    return objects.length; // 1-based object number
  };

  // Object 1: Catalog
  const catalogObjNum = 1;
  // Object 2: Pages container
  const pagesObjNum = 2;
  // Object 3: Font
  const fontObjNum = 3;

  objects.push(''); // placeholder for 1 (catalog)
  objects.push(''); // placeholder for 2 (pages)
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // obj 3

  const pageObjNums: number[] = [];

  for (const page of safePages) {
    // Sanitize string for PDF string literal
    const escapePdf = (str: string) =>
      str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const streamLines: string[] = [];

    // Header bar background & title
    streamLines.push('BT');
    streamLines.push('/F1 16 Tf');
    streamLines.push('1 0 0 1 50 780 Tm');
    streamLines.push(`(${escapePdf(documentTitle.substring(0, 60))}) Tj`);
    streamLines.push('ET');

    // Subtitle / Chapter
    streamLines.push('BT');
    streamLines.push('/F1 10 Tf');
    streamLines.push('0.3 0.3 0.3 rg'); // muted gray
    streamLines.push('1 0 0 1 50 762 Tm');
    streamLines.push(`(${escapePdf(page.chapter || author)}) Tj`);
    streamLines.push('ET');

    // Divider rule
    streamLines.push('0.8 0.8 0.8 RG');
    streamLines.push('1 w');
    streamLines.push('50 750 m 562 750 l S');

    // Page Section Title
    streamLines.push('BT');
    streamLines.push('0 0 0 rg');
    streamLines.push('/F1 13 Tf');
    streamLines.push('1 0 0 1 50 725 Tm');
    streamLines.push(`(${escapePdf(page.title)}) Tj`);
    streamLines.push('ET');

    // Body content lines
    let currentY = 695;
    streamLines.push('BT');
    streamLines.push('/F1 10 Tf');
    streamLines.push('0.15 0.15 0.15 rg');

    for (const rawParagraph of page.content) {
      // Word wrap paragraph to ~75 chars
      const words = rawParagraph.split(/\s+/);
      let line = '';
      for (const word of words) {
        if ((line + ' ' + word).trim().length > 76) {
          streamLines.push(`1 0 0 1 50 ${currentY} Tm`);
          streamLines.push(`(${escapePdf(line.trim())}) Tj`);
          currentY -= 15;
          line = word;
          if (currentY < 70) break;
        } else {
          line = line ? line + ' ' + word : word;
        }
      }
      if (line && currentY >= 70) {
        streamLines.push(`1 0 0 1 50 ${currentY} Tm`);
        streamLines.push(`(${escapePdf(line.trim())}) Tj`);
        currentY -= 22; // paragraph gap
      }
      if (currentY < 70) break;
    }
    streamLines.push('ET');

    // Footer divider and page number
    streamLines.push('0.85 0.85 0.85 RG');
    streamLines.push('50 50 m 562 50 l S');

    streamLines.push('BT');
    streamLines.push('/F1 9 Tf');
    streamLines.push('0.5 0.5 0.5 rg');
    streamLines.push('1 0 0 1 50 36 Tm');
    streamLines.push('(IKSHOVIA Learning Intelligence Platform -- Verified Study Material) Tj');

    streamLines.push(`1 0 0 1 490 36 Tm`);
    streamLines.push(`(Page ${page.pageNumber} of ${safePages.length}) Tj`);
    streamLines.push('ET');

    const streamData = streamLines.join('\n');
    const streamLen = Buffer.byteLength(streamData, 'ascii');

    // Content stream object
    const contentObjNum = addObject(`<< /Length ${streamLen} >>\nstream\n${streamData}\nendstream`);

    // Page object
    const pageObjNum = addObject(`<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 612 842]
  /Resources <<
    /Font << /F1 3 0 R >>
  >>
  /Contents ${contentObjNum} 0 R
>>`);

    pageObjNums.push(pageObjNum);
  }

  // Populate Object 1 (Catalog) & Object 2 (Pages)
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>`;

  // Build complete PDF binary with xref table
  let pdfOutput = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const xrefOffsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    const objNum = i + 1;
    const offset = Buffer.byteLength(pdfOutput, 'ascii');
    xrefOffsets.push(offset);
    pdfOutput += `${objNum} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdfOutput, 'ascii');
  pdfOutput += `xref\n0 ${objects.length + 1}\n`;
  pdfOutput += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i++) {
    const off = xrefOffsets[i].toString().padStart(10, '0');
    pdfOutput += `${off} 00000 n \n`;
  }

  pdfOutput += `trailer\n<<\n  /Size ${objects.length + 1}\n  /Root 1 0 R\n>>\nstartxref\n${startXref}\n%%EOF\n`;

  return Buffer.from(pdfOutput, 'utf8');
}
