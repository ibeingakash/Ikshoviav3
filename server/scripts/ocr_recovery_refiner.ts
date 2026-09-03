import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import { OfficialPyqQuestion } from '../db/pyq/types.js';

function cleanText(str: string): string {
  return str
    .replace(/\r\n/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\[\s*P\.T\.O\.?\s*\]/gi, '')
    .replace(/\b(?:GA|CC|PT)-\d+[^\s]*/gi, '')
    .replace(/=+[A-Z0-9™=~`\s:;]*$/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Super robust question parser for difficult/scanned layouts.
 * Matches questions formatted as "12.", "12)", "12 -", "12 ", etc.
 * Supports options with (A), (B), (C), (D), (E), [A], [B], A., B., etc.
 */
export function parseAllQuestionsFromRawText(text: string, pageNum: number): Map<number, { stem: string; options: Array<{ id: string; text: string }>; questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING'; statements?: string[]; matchData?: { listI: string[]; listII: string[] } }> {
  const result = new Map<number, any>();

  // Standardize options markers
  let norm = text
    .replace(/\r\n/g, '\n')
    .replace(/(?:^|\n|\s+)[\(\[]\s*([A-Ea-e])\s*[\)\]\.\-:]\s*/g, '\n---OPT:$1--- ')
    .replace(/(?:^|\n|\s+)(?:®|\(B\)|8\))\s*/g, '\n---OPT:B--- ')
    .replace(/(?:^|\n|\s+)(?:©|\(C\)|\(CO\)|\(0\)|\(O\))\s*/g, '\n---OPT:C--- ')
    .replace(/(?:^|\n|\s+)(?:DO\)|O\)|©)\s*/g, '\n---OPT:D--- ');

  // Split into question blocks
  const blocks = norm.split(/(?:^|\n)(?=\s*\d{1,3}\s*[\.\)\:\-]\s+)/);

  for (const b of blocks) {
    const trimmed = b.trim();
    if (!trimmed) continue;

    const m = trimmed.match(/^(\d{1,3})\s*[\.\)\:\-]\s+([\s\S]+)$/);
    if (!m) continue;

    const qNum = parseInt(m[1], 10);
    if (qNum < 1 || qNum > 150) continue;

    const body = m[2];
    const parts = body.split(/\n---OPT:([A-Ea-e])---\s*/);
    const stem = cleanText(parts[0]);

    if (!stem || stem.length < 5) continue;

    const options: Array<{ id: string; text: string }> = [];
    for (let i = 1; i < parts.length; i += 2) {
      const optId = parts[i].toUpperCase();
      const optVal = cleanText(parts[i + 1] || '');
      if (optVal && ['A', 'B', 'C', 'D', 'E'].includes(optId)) {
        if (!options.some(o => o.id === optId)) {
          options.push({ id: optId, text: optVal });
        }
      }
    }

    let questionType: 'SINGLE_CHOICE' | 'STATEMENT_BASED' | 'MATCH_FOLLOWING' = 'SINGLE_CHOICE';
    let statements: string[] | undefined;
    let matchData: { listI: string[]; listII: string[] } | undefined;

    const stemLower = stem.toLowerCase();
    if (stemLower.includes('match list') || stemLower.includes('list-i') || stemLower.includes('list i') || stemLower.includes('column-i')) {
      questionType = 'MATCH_FOLLOWING';
      matchData = { listI: [], listII: [] };

      const listIMatches = [...stem.matchAll(/(?:^|\s+)([a-d])[\)\.]\s*([^\n1-4]+)/gi)];
      const listIIMatches = [...stem.matchAll(/(?:^|\s+)([1-4])[\)\.]\s*([^\na-d]+)/g)];

      for (const lim of listIMatches) {
        const item = cleanText(lim[2]);
        if (item && item.length > 2) matchData.listI.push(`${lim[1].toLowerCase()}) ${item}`);
      }
      for (const liim of listIIMatches) {
        const item = cleanText(liim[2]);
        if (item && item.length > 2) matchData.listII.push(`${liim[1]}) ${item}`);
      }
    } else if (stemLower.includes('consider the following') || stemLower.includes('which of the following statement') || stem.match(/(?:^|\s+)[1-4]\)\s+/)) {
      questionType = 'STATEMENT_BASED';
      statements = [];
      const stmtMatches = [...stem.matchAll(/(?:^|\s+)([1-4])[\)\.]\s*([^\n]+)/g)];
      for (const sm of stmtMatches) {
        const item = cleanText(sm[2]);
        if (item && item.length > 3) statements.push(`${sm[1]}) ${item}`);
      }
    }

    result.set(qNum, {
      stem,
      options,
      questionType,
      statements: statements && statements.length > 0 ? statements : undefined,
      matchData: matchData && (matchData.listI.length > 0 || matchData.listII.length > 0) ? matchData : undefined
    });
  }

  return result;
}
