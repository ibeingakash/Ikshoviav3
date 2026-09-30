/**
 * High-Fidelity Pure TypeScript PDF 1.4 Generator
 * Creates authentic multi-page book and document PDF files with:
 * - Proper PostScript Type 1 fonts (/F1 Regular, /F2 Bold, /F3 Italic)
 * - Two-column civil services question paper & textbook layouts
 * - Authentic running headers, section titles, margins, and page numbers
 * - Preserved question numbering, options alignment, exam citation tags, and explanation blocks
 * - Direct vector text rendering compatible with PDF.js and native browser PDF engines
 */

export interface PdfPageContent {
  pageNumber: number;
  title?: string;
  chapter?: string;
  content: string[];
}

export interface BookPageInput {
  pageNumber: number;
  headerText?: string;
  rawLines: string[];
}

function escapePdfText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, '*');
}

/**
 * Generates an authentic two-column / structured civil services textbook PDF
 */
export function generateBookPdf(
  bookTitle: string,
  author: string,
  pages: BookPageInput[]
): Buffer {
  const safePages = pages.length > 0 ? pages : [
    { pageNumber: 1, rawLines: [bookTitle, author, 'Verified Civil Services Resource'] }
  ];

  const objects: string[] = [];

  const addObject = (content: string): number => {
    objects.push(content);
    return objects.length;
  };

  // Pre-allocate objects 1, 2, 3, 4, 5
  objects.push(''); // 1: Catalog
  objects.push(''); // 2: Pages root
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); // 3: /F1 Regular
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4: /F2 Bold
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>'); // 5: /F3 Italic

  const pageObjNums: number[] = [];

  for (const page of safePages) {
    const streamLines: string[] = [];

    // Header geometry
    // A4: 595 x 842 pt
    const pageWidth = 595;
    const pageHeight = 842;
    const marginX = 42;
    const rightMargin = 553;
    const usableWidth = rightMargin - marginX; // 511 pt

    // Determine running header from first line or page input
    let runningHeaderLeft = '';
    let runningHeaderRight = bookTitle;

    const rawLines = [...page.rawLines];
    if (rawLines.length > 0) {
      const firstLine = rawLines[0].trim();
      if (/^[DABC][\u2013\u2014\-]\d+/i.test(firstLine) || firstLine.includes('General Studies') || firstLine.includes('Indian Polity')) {
        const parts = firstLine.split(/\t+|\s{3,}/);
        if (parts.length >= 2) {
          runningHeaderLeft = parts[0].trim();
          runningHeaderRight = parts.slice(1).join(' - ').trim();
        } else {
          runningHeaderLeft = firstLine.substring(0, 35);
        }
        rawLines.shift(); // Remove header line from body content
      } else if (page.headerText) {
        runningHeaderLeft = page.headerText;
      }
    }

    if (!runningHeaderLeft) {
      runningHeaderLeft = `Page ${page.pageNumber}`;
    }

    // Top Running Header Rule & Text
    streamLines.push('BT');
    streamLines.push('/F2 8.5 Tf');
    streamLines.push('0.2 0.2 0.2 rg');
    streamLines.push(`1 0 0 1 ${marginX} 818 Tm`);
    streamLines.push(`(${escapePdfText(runningHeaderLeft.substring(0, 40))}) Tj`);
    streamLines.push('ET');

    streamLines.push('BT');
    streamLines.push('/F1 8.5 Tf');
    streamLines.push('0.3 0.3 0.3 rg');
    const headerRightText = runningHeaderRight.substring(0, 45);
    const approxRightWidth = headerRightText.length * 4.8;
    streamLines.push(`1 0 0 1 ${Math.max(250, rightMargin - approxRightWidth)} 818 Tm`);
    streamLines.push(`(${escapePdfText(headerRightText)}) Tj`);
    streamLines.push('ET');

    // Thin header divider rule
    streamLines.push('0.75 0.75 0.75 RG');
    streamLines.push('0.6 w');
    streamLines.push(`${marginX} 810 m ${rightMargin} 810 l S`);

    // Two-Column Layout Parameters
    // Left column: marginX to marginX + colWidth
    // Right column: rightColX to rightColX + colWidth
    const colGap = 16;
    const colWidth = (usableWidth - colGap) / 2; // ~247.5 pt
    const col1X = marginX;
    const col2X = marginX + colWidth + colGap; // ~305.5 pt
    const dividerX = marginX + colWidth + colGap / 2; // ~297.5 pt

    // Vertical column divider rule
    streamLines.push('0.85 0.85 0.85 RG');
    streamLines.push('0.5 w');
    streamLines.push(`${dividerX} 800 m ${dividerX} 48 l S`);

    // Process lines into flow tokens
    const columnBlocks: { x: number; y: number; text: string; font: '/F1' | '/F2' | '/F3'; size: number; color: string }[] = [];

    let activeCol = 1;
    let curX = col1X;
    let curY = 798;
    const minY = 50;

    const advanceLine = (gap: number = 11.5) => {
      curY -= gap;
      if (curY < minY) {
        if (activeCol === 1) {
          activeCol = 2;
          curX = col2X;
          curY = 798;
        } else {
          // Bottom of page reached
          curY = -999;
        }
      }
    };

    // Helper: Wrap text to fit column width
    const wrapAndAdd = (text: string, font: '/F1' | '/F2' | '/F3', size: number, color: string, indent: number = 0) => {
      if (curY < minY && activeCol === 2) return;
      const charLimit = Math.floor((colWidth - indent) / (size * 0.52));
      const words = text.split(/\s+/);
      let line = '';

      for (const word of words) {
        if ((line + ' ' + word).trim().length > charLimit) {
          if (line) {
            columnBlocks.push({ x: curX + indent, y: curY, text: line.trim(), font, size, color });
            advanceLine(size * 1.25);
            if (curY < minY && activeCol === 2) return;
          }
          line = word;
        } else {
          line = line ? line + ' ' + word : word;
        }
      }
      if (line.trim() && (curY >= minY || activeCol === 1)) {
        columnBlocks.push({ x: curX + indent, y: curY, text: line.trim(), font, size, color });
        advanceLine(size * 1.25);
      }
    };

    for (const raw of rawLines) {
      if (curY < minY && activeCol === 2) break;
      const line = raw.trim();
      if (!line) {
        advanceLine(5);
        continue;
      }

      // 1. Question Number Start (e.g. "5.", "60.", "15.")
      if (/^\d+\.\s+/.test(line)) {
        advanceLine(4);
        wrapAndAdd(line, '/F2', 9.5, '0 0 0', 0);
      }
      // 2. Options (a), (b), (c), (d)
      else if (/^\([a-eA-E]\)\s+/.test(line) || /^[a-eA-E]\.\s+/.test(line)) {
        wrapAndAdd(line, '/F1', 9.0, '0.1 0.1 0.1', 8);
      }
      // 3. Exam citation (e.g. "I.A.S. (Pre) 2025", "M.P.P.C.S. (Pre) 2017")
      else if (/(\b(I\.?A\.?S\.?|P\.?C\.?S\.?|B\.?P\.?S\.?|U\.?P\.?P\.?C\.?S\.?|R\.?A\.?S\.?|M\.?P\.?P\.?C\.?S\.?|Pre|Mains)\b|\(\d{4}\)|\b\d{4}\b)/i.test(line) && line.length < 50) {
        advanceLine(2);
        wrapAndAdd(`[ ${line} ]`, '/F3', 8.2, '0.2 0.35 0.55', 8);
      }
      // 4. Answer key (e.g. "Ans. (a)", "Ans. (*)")
      else if (/^Ans\.?\s*\([a-eA-E\*]\)/i.test(line) || /^Answer:?\s*/i.test(line)) {
        advanceLine(2);
        wrapAndAdd(line, '/F2', 9.0, '0.1 0.45 0.2', 8);
      }
      // 5. Section / Subtitle / Table Heading
      else if (/^(List\s*[-–]\s*[I|1]|Chapter|INDEX|Notes?|Important|Explanation)/i.test(line)) {
        advanceLine(3);
        wrapAndAdd(line, '/F2', 9.2, '0.15 0.15 0.15', 2);
      }
      // 6. Regular body text / explanation text
      else {
        wrapAndAdd(line, '/F1', 8.8, '0.15 0.15 0.15', 0);
      }
    }

    // Emit text blocks
    for (const b of columnBlocks) {
      streamLines.push('BT');
      streamLines.push(`${b.font} ${b.size} Tf`);
      streamLines.push(`${b.color} rg`);
      streamLines.push(`1 0 0 1 ${b.x.toFixed(1)} ${b.y.toFixed(1)} Tm`);
      streamLines.push(`(${escapePdfText(b.text)}) Tj`);
      streamLines.push('ET');
    }

    // Footer divider rule
    streamLines.push('0.85 0.85 0.85 RG');
    streamLines.push('0.6 w');
    streamLines.push(`${marginX} 44 m ${rightMargin} 44 l S`);

    // Footer Page Number
    streamLines.push('BT');
    streamLines.push('/F1 8.5 Tf');
    streamLines.push('0.4 0.4 0.4 rg');
    streamLines.push(`1 0 0 1 ${rightMargin - 30} 32 Tm`);
    streamLines.push(`(${page.pageNumber}) Tj`);
    streamLines.push('ET');

    const streamData = streamLines.join('\n');
    const streamLen = Buffer.byteLength(streamData, 'ascii');

    // Page stream object
    const contentObjNum = addObject(`<< /Length ${streamLen} >>\nstream\n${streamData}\nendstream`);

    // Page object with 3 fonts: /F1 (Regular), /F2 (Bold), /F3 (Italic)
    const pageObjNum = addObject(`<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${pageWidth} ${pageHeight}]
  /Resources <<
    /Font <<
      /F1 3 0 R
      /F2 4 0 R
      /F3 5 0 R
    >>
  >>
  /Contents ${contentObjNum} 0 R
>>`);

    pageObjNums.push(pageObjNum);
  }

  // Object 1: Catalog
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  // Object 2: Pages root
  objects[1] = `<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjNums.length} >>`;

  // Build binary with xref
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

/**
 * Standard backward-compatible multi-page PDF generator
 */
export function generateMultiPagePdf(
  documentTitle: string,
  author: string,
  pages: PdfPageContent[]
): Buffer {
  const bookPages: BookPageInput[] = pages.map((p) => ({
    pageNumber: p.pageNumber,
    headerText: p.chapter || documentTitle,
    rawLines: [p.title, ...(p.content || [])].filter((line): line is string => typeof line === 'string' && line.length > 0),
  }));

  return generateBookPdf(documentTitle, author, bookPages);
}
