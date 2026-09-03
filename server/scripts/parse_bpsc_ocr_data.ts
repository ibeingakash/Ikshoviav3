import fs from 'fs';
import path from 'path';
import { BpscPdfExtractor } from '../services/BpscPdfExtractor.js';
import { OfficialPyqQuestion } from '../db/pyq/types.js';

interface RawPageOcr {
  left: string;
  right: string;
}

const extractor = BpscPdfExtractor.getInstance();

export const pageQuestionRanges: Record<number, [number, number]> = {
  2: [1, 8],
  4: [9, 16],
  6: [17, 23],
  8: [24, 31],
  10: [32, 37],
  12: [38, 44],
  14: [45, 49],
  16: [50, 54],
  18: [55, 59],
  20: [60, 65],
  22: [66, 72],
  24: [73, 80],
  26: [81, 87],
  28: [88, 91],
  30: [92, 96],
  32: [97, 101],
  34: [102, 109],
  36: [110, 117],
  38: [118, 125],
  40: [126, 134],
  42: [135, 142],
  44: [143, 150]
};

function cleanOcrArtifacts(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/11\/GA\/CC\/PT-2025-E[^\n]*/gi, '')
    .replace(/GA-\d+[^\n]*/gi, '')
    .replace(/\[P\.T\.O\.\]?/gi, '')
    .replace(/\[ELE\d+\/[^\]]+\]/gi, '')
    .replace(/\[E\d+\]/gi, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\b([a-zA-Z]+)gquntry\b/gi, '$1 country')
    .replace(/\bfiieng\b/gi, 'friend')
    .replace(/\bflahg\b/gi, 'flag')
    .replace(/\btumg\b/gi, 'turns')
    .replace(/\bJeff\b/gi, 'left')
    .replace(/=+([A-Z0-9™=~`\s:;]*)$/gi, '')
    .replace(/\s+(?:sdB|Ee|Sp|f|s=|==|™=\d+|EY\s*\d+|&|=)\s*$/gi, '')
    .replace(/\s+[=£¥#~`|§_]+\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanOption(text: string): string {
  let cleaned = cleanOcrArtifacts(text);
  cleaned = cleaned
    .replace(/^[\)\.\-:]\s*/, '')
    .replace(/\s*\(?(?:OD|DO|O)\)\s*$/gi, '')
    .replace(/\s*\(?[A-E]\)\s*$/gi, '')
    .replace(/^[Aa]\s+/, '')
    .trim();
  return cleaned;
}

export interface ExtractedQ {
  questionNumber: number;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING';
  statements?: string[];
  matchData?: { listI: string[]; listII: string[] };
  pageNumber: number;
}

export function parseAllQuestionsFromRawOcr(): ExtractedQ[] {
  const ocrData: Record<number, RawPageOcr> = JSON.parse(
    fs.readFileSync('/tmp/bpsc_english_raw_ocr.json', 'utf8')
  );

  const allQuestionsMap = new Map<number, ExtractedQ>();

  for (const [pStr, range] of Object.entries(pageQuestionRanges)) {
    const pageNum = parseInt(pStr, 10);
    const page = ocrData[pageNum];
    if (!page) continue;

    const [minQ, maxQ] = range;

    for (const colText of [page.left, page.right]) {
      if (!colText) continue;

      const lines = colText.split('\n');
      const questionBlocks: { qNum: number; lines: string[] }[] = [];
      let currentBlock: { qNum: number; lines: string[] } | null = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Match starting question number in the allowed page range
        const qMatch = line.match(/^([0-9]{1,3}|5S|8S|9S|3S|7S)\s*[\.\)]\s*(.*)$/i);
        if (qMatch) {
          let numStr = qMatch[1].replace(/S/gi, '');
          const qNum = parseInt(numStr, 10);
          if (qNum >= minQ && qNum <= maxQ) {
            currentBlock = { qNum, lines: [qMatch[2]] };
            questionBlocks.push(currentBlock);
            continue;
          }
        }

        if (currentBlock) {
          currentBlock.lines.push(line);
        }
      }

      for (const block of questionBlocks) {
        const qNum = block.qNum;
        const fullBlockText = block.lines.join('\n');

        // Standardize Option markers with comprehensive OCR symbols
        const standardized = fullBlockText
          .replace(/(?:^|\n|\s{2,}|\s)\s*(?:[\(]?\s*A\s*[\)\.\-:]|A\)|@|Aa\s+)\s*/gi, '\n---OPT:A--- ')
          .replace(/(?:^|\n|\s{2,}|\s)\s*(?:[\(]?\s*B\s*[\)\.\-:]|®|B\)|'\(B\)|'B\))\s*/gi, '\n---OPT:B--- ')
          .replace(/(?:^|\n|\s{2,}|\s)\s*(?:[\(]?\s*C\s*[\)\.\-:]|©|\(CO\)|\(0\)|\(O\)|C\)|€\)|C€\))\s*/gi, '\n---OPT:C--- ')
          .replace(/(?:^|\n|\s{2,}|\s)\s*(?:[\(]?\s*D\s*[\)\.\-:]|O\)|\(OD\)|\bDO\)|D\)|\(DO|\(O\))\s*/gi, '\n---OPT:D--- ')
          .replace(/(?:^|\n|\s{2,}|\s)\s*(?:[\(]?\s*E\s*[\)\.\-:]|E\))\s*/gi, '\n---OPT:E--- ');

        const parts = standardized.split(/\n?---OPT:([A-E])---\s*/);
        const stemRaw = parts[0];
        const stem = cleanOcrArtifacts(stemRaw);

        const options: Array<{ id: string; text: string }> = [];
        for (let i = 1; i < parts.length; i += 2) {
          const optId = parts[i].toUpperCase();
          const rawOptText = parts[i + 1] || '';
          const optText = cleanOption(rawOptText);
          if (optText.length > 0) {
            if (!options.some(o => o.id === optId)) {
              options.push({ id: optId, text: optText });
            }
          }
        }

        options.sort((a, b) => a.id.localeCompare(b.id));

        let questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING' = 'SINGLE_CHOICE';
        const statements: string[] = [];
        let matchData: { listI: string[]; listII: string[] } | undefined;

        if (stem.toLowerCase().includes('match list') || stem.toLowerCase().includes('list-i') || stem.toLowerCase().includes('list i')) {
          questionType = 'MATCH_FOLLOWING';
        } else if (stem.toLowerCase().includes('consider the following') || stem.match(/(?:^|\n|\s+)[1-4]\)\s+/)) {
          questionType = 'STATEMENT_BASED';
        }

        allQuestionsMap.set(qNum, {
          questionNumber: qNum,
          questionText: stem,
          options,
          questionType,
          statements: statements.length > 0 ? statements : undefined,
          matchData,
          pageNumber: pageNum
        });
      }
    }
  }

  const results: ExtractedQ[] = [];
  for (let q = 1; q <= 150; q++) {
    const found = allQuestionsMap.get(q);
    if (found) {
      results.push(found);
    }
  }

  return results;
}
