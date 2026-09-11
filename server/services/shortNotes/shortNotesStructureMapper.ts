import crypto from 'crypto';
import {
  ShortNoteBlock,
  ShortNoteBlockType,
  ShortNoteTableData,
  ShortNoteFactBoxData,
  ShortNoteComparisonData,
  ShortNoteTimelineData,
  ShortNoteImportantPointsData,
} from '../../../src/types/index.js';
import { PageOcrOutput } from './shortNotesOcrAdapter.js';

interface MapperOptions {
  resourceId: string;
  documentId?: string;
  title: string;
}

/**
 * ShortNotesStructureMapper
 * Transforms raw OCR text & page boundaries from the Existing Test Paper OCR
 * into structured revision blocks for civil service exam preparation.
 * 
 * Accurately detects:
 * - Headings (Level 1, 2, 3)
 * - Tables (pipe '|' separated or tabulated columns)
 * - Comparison blocks ("X vs Y", tabular differences)
 * - Timelines (chronological year / era sequences)
 * - Fact boxes & Key Points ("Key Facts", "Constitutional Articles", "Prelims Pointer")
 * - Bullet lists & Numbered lists
 * - Paragraphs with bold emphasis
 */
export class ShortNotesStructureMapper {
  public static mapOcrPagesToBlocks(pages: PageOcrOutput[], options: MapperOptions): ShortNoteBlock[] {
    const blocks: ShortNoteBlock[] = [];
    let orderIndex = 0;

    for (const page of pages) {
      const pageBlocks = this.parsePageText(page.text, page.pageNumber, options, orderIndex);
      blocks.push(...pageBlocks);
      orderIndex += pageBlocks.length;
    }

    // If no blocks were created (empty document), provide a fallback paragraph block
    if (blocks.length === 0) {
      blocks.push({
        id: `blk_${crypto.randomBytes(4).toString('hex')}`,
        type: 'paragraph',
        resource_id: options.resourceId,
        document_id: options.documentId,
        page_number: 1,
        order_index: 0,
        text: 'Document content is being processed or contains scanned diagrams.',
      });
    }

    return blocks;
  }

  private static parsePageText(
    rawText: string,
    pageNumber: number,
    options: MapperOptions,
    startOrderIndex: number
  ): ShortNoteBlock[] {
    const blocks: ShortNoteBlock[] = [];
    let currentOrder = startOrderIndex;

    const lines = rawText.split('\n');
    let lineIdx = 0;

    while (lineIdx < lines.length) {
      const line = lines[lineIdx].trim();

      // Skip blank lines
      if (!line) {
        lineIdx++;
        continue;
      }

      // Check 1: Table Detection (lines with '|' or multiple tab/space separated columns)
      if (this.isTableLine(line)) {
        const tableLines: string[] = [];
        while (lineIdx < lines.length && (this.isTableLine(lines[lineIdx].trim()) || lines[lineIdx].trim() === '')) {
          if (lines[lineIdx].trim()) {
            tableLines.push(lines[lineIdx].trim());
          }
          lineIdx++;
        }

        const tableData = this.parseTableLines(tableLines);
        if (tableData) {
          // Check if table is a Comparison block (e.g. 2 or 3 columns with aspects/vs)
          if (this.isComparisonTable(tableData)) {
            blocks.push({
              id: `blk_${crypto.randomBytes(4).toString('hex')}`,
              type: 'comparison_block',
              resource_id: options.resourceId,
              document_id: options.documentId,
              page_number: pageNumber,
              order_index: currentOrder++,
              comparison: this.tableToComparisonData(tableData),
            });
          } else {
            blocks.push({
              id: `blk_${crypto.randomBytes(4).toString('hex')}`,
              type: 'table',
              resource_id: options.resourceId,
              document_id: options.documentId,
              page_number: pageNumber,
              order_index: currentOrder++,
              table: tableData,
            });
          }
          continue;
        }
      }

      // Check 2: Timeline Sequence (e.g. "1773: Regulating Act", "1857 - Revolt of 1857", "1905: Partition of Bengal")
      if (this.isTimelineLine(line)) {
        const timelineEvents: { timeOrYear: string; title: string; description: string }[] = [];
        while (lineIdx < lines.length && this.isTimelineLine(lines[lineIdx].trim())) {
          const parsed = this.parseTimelineLine(lines[lineIdx].trim());
          if (parsed) timelineEvents.push(parsed);
          lineIdx++;
        }

        if (timelineEvents.length >= 2) {
          blocks.push({
            id: `blk_${crypto.randomBytes(4).toString('hex')}`,
            type: 'timeline',
            resource_id: options.resourceId,
            document_id: options.documentId,
            page_number: pageNumber,
            order_index: currentOrder++,
            timeline: { events: timelineEvents },
          });
          continue;
        }
      }

      // Check 3: Fact Box or Key Points Callout (e.g. "KEY POINTS:", "PRELIMS POINTER:", "IMPORTANT ARTICLES:")
      if (this.isFactBoxHeader(line)) {
        const title = line.replace(/[:\-#]+$/, '').trim();
        lineIdx++;
        const points: string[] = [];

        while (lineIdx < lines.length && !this.isHeaderLine(lines[lineIdx].trim()) && lines[lineIdx].trim() !== '') {
          points.push(lines[lineIdx].trim().replace(/^[-*•\d+.)\s]+/, ''));
          lineIdx++;
        }

        blocks.push({
          id: `blk_${crypto.randomBytes(4).toString('hex')}`,
          type: 'fact_box',
          resource_id: options.resourceId,
          document_id: options.documentId,
          page_number: pageNumber,
          order_index: currentOrder++,
          factBox: {
            title: title || 'Key Revision Facts',
            facts: points.length > 0 ? points : [line],
          },
        });
        continue;
      }

      // Check 4: Headings & Subheadings
      if (this.isHeaderLine(line)) {
        const level = line.startsWith('# ') ? 1 : line.startsWith('## ') ? 2 : line.startsWith('### ') ? 3 : this.inferHeaderLevel(line);
        const cleanTitle = line.replace(/^#{1,3}\s*/, '').replace(/[:\-]+$/, '').trim();

        blocks.push({
          id: `blk_${crypto.randomBytes(4).toString('hex')}`,
          type: level === 1 ? 'heading' : 'subheading',
          resource_id: options.resourceId,
          document_id: options.documentId,
          page_number: pageNumber,
          order_index: currentOrder++,
          text: cleanTitle,
          level: (level === 1 ? 1 : level === 2 ? 2 : 3) as 1 | 2 | 3,
        });
        lineIdx++;
        continue;
      }

      // Check 5: Bullet or Numbered List
      if (this.isListLine(line)) {
        const isNumbered = /^\d+[\.\)]\s/.test(line);
        const listItems: string[] = [];

        while (lineIdx < lines.length && (this.isListLine(lines[lineIdx].trim()) || (lines[lineIdx].startsWith('   ') && lines[lineIdx].trim()))) {
          const curr = lines[lineIdx].trim();
          if (this.isListLine(curr)) {
            listItems.push(curr.replace(/^[-*•\d+.)\s]+/, '').trim());
          } else if (listItems.length > 0) {
            // Continuation line of previous item
            listItems[listItems.length - 1] += ' ' + curr;
          }
          lineIdx++;
        }

        blocks.push({
          id: `blk_${crypto.randomBytes(4).toString('hex')}`,
          type: isNumbered ? 'numbered_list' : 'bullet_list',
          resource_id: options.resourceId,
          document_id: options.documentId,
          page_number: pageNumber,
          order_index: currentOrder++,
          items: listItems,
        });
        continue;
      }

      // Check 6: Important Exam Highlights
      if (/^(Note|Important|Prelims Note|Key Takeaway)[:\-]/i.test(line)) {
        blocks.push({
          id: `blk_${crypto.randomBytes(4).toString('hex')}`,
          type: 'important_points',
          resource_id: options.resourceId,
          document_id: options.documentId,
          page_number: pageNumber,
          order_index: currentOrder++,
          importantPoints: {
            points: [line.replace(/^(Note|Important|Prelims Note|Key Takeaway)[:\-]\s*/i, '').trim()],
            calloutType: 'key',
          },
        });
        lineIdx++;
        continue;
      }

      // Default: Paragraph (accumulate continuous text lines until blank line or header)
      const paragraphLines: string[] = [line];
      lineIdx++;

      while (
        lineIdx < lines.length &&
        lines[lineIdx].trim() !== '' &&
        !this.isHeaderLine(lines[lineIdx].trim()) &&
        !this.isListLine(lines[lineIdx].trim()) &&
        !this.isTableLine(lines[lineIdx].trim()) &&
        !this.isTimelineLine(lines[lineIdx].trim())
      ) {
        paragraphLines.push(lines[lineIdx].trim());
        lineIdx++;
      }

      blocks.push({
        id: `blk_${crypto.randomBytes(4).toString('hex')}`,
        type: 'paragraph',
        resource_id: options.resourceId,
        document_id: options.documentId,
        page_number: pageNumber,
        order_index: currentOrder++,
        text: paragraphLines.join(' '),
      });
    }

    return blocks;
  }

  // --- Detection Helpers ---

  private static isHeaderLine(line: string): boolean {
    if (/^#{1,3}\s/.test(line)) return true;
    if (line.length < 80 && /^[A-Z0-9\s,\-\:]{4,70}$/.test(line) && !line.includes('.') && !line.startsWith('-')) {
      return true;
    }
    if (/^(Introduction|Background|Key Features|Causes|Consequences|Significance|Criticism|Way Forward|Conclusion)[:\-]?$/i.test(line)) {
      return true;
    }
    return false;
  }

  private static inferHeaderLevel(line: string): 1 | 2 | 3 {
    if (line.length < 35 && line === line.toUpperCase()) return 1;
    if (line.length < 50) return 2;
    return 3;
  }

  private static isListLine(line: string): boolean {
    return /^(\*|-|•|–|\d+[\.\)])\s+/.test(line);
  }

  private static isTableLine(line: string): boolean {
    if (line.includes('|')) return true;
    // Check for multi-column format with at least 2 distinct whitespace gaps of 3+ spaces
    const parts = line.split(/\s{3,}/).filter(Boolean);
    return parts.length >= 3;
  }

  private static parseTableLines(lines: string[]): ShortNoteTableData | null {
    if (lines.length < 2) return null;

    const parsedRows: string[][] = [];
    for (const rawLine of lines) {
      if (/^[\-\|\s\:\+]+$/.test(rawLine)) continue; // Separator line like |---|---|
      let cols: string[] = [];
      if (rawLine.includes('|')) {
        cols = rawLine.split('|').map(c => c.trim()).filter((_, idx, arr) => {
          if (idx === 0 && arr[0] === '') return false;
          if (idx === arr.length - 1 && arr[arr.length - 1] === '') return false;
          return true;
        });
      } else {
        cols = rawLine.split(/\s{3,}/).map(c => c.trim());
      }
      if (cols.length >= 2) {
        parsedRows.push(cols);
      }
    }

    if (parsedRows.length < 2) return null;

    const headers = parsedRows[0];
    const rows = parsedRows.slice(1);

    return {
      headers,
      rows,
    };
  }

  private static isComparisonTable(table: ShortNoteTableData): boolean {
    if (table.headers.length === 2 || table.headers.length === 3) {
      const headerStr = table.headers.join(' ').toLowerCase();
      if (headerStr.includes('vs') || headerStr.includes('difference') || headerStr.includes('comparison')) {
        return true;
      }
    }
    return false;
  }

  private static tableToComparisonData(table: ShortNoteTableData): ShortNoteComparisonData {
    const rows = table.rows.map(r => ({
      aspect: r[0] || 'Aspect',
      left: r[1] || '',
      right: r[2] || '',
    }));
    return {
      headers: table.headers,
      rows,
    };
  }

  private static isTimelineLine(line: string): boolean {
    return /^(\b\d{4}\b|\b\d{3}\s?BC\b|\b\d{3}\s?AD\b|c\.\s*\d{4})[:\-\s]/.test(line);
  }

  private static parseTimelineLine(line: string): { timeOrYear: string; title: string; description: string } | null {
    const match = line.match(/^(\b\d{4}\b|\b\d{3}\s?BC\b|\b\d{3}\s?AD\b|c\.\s*\d{4})[:\-\s]+(.*)$/i);
    if (!match) return null;

    const timeOrYear = match[1].trim();
    const rest = match[2].trim();
    const colonIdx = rest.indexOf(':');

    if (colonIdx > 0 && colonIdx < 40) {
      return {
        timeOrYear,
        title: rest.substring(0, colonIdx).trim(),
        description: rest.substring(colonIdx + 1).trim(),
      };
    }

    return {
      timeOrYear,
      title: rest,
      description: '',
    };
  }

  private static isFactBoxHeader(line: string): boolean {
    return /^(Key Facts|Prelims Pointer|Essential Facts|Important Articles|Quick Reference)[:\-]?$/i.test(line);
  }
}
