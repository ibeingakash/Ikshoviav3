import { pool } from './pool.js';

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\nCodes:.*$/is, '')
    .replace(/\nSelect the correct.*$/is, '')
    .replace(/\b\d+\.\d+\s+FLT\s+\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCodeFromExplanation(expl: string): string | null {
  if (!expl) return null;
  // Patterns like 'The correct answer is (a): A-3, B-2, C-1' or 'correct sequence is A-2, B-4, C-3, D-1'
  const match = expl.match(/(?:correct\s+(?:answer|sequence)\s+(?:is|corresponds to)[^:]*?[:\s]+(?:\([a-e]\)[:\s]*)?)([A-D]-[1-4](?:[,\s]+[A-D]-[1-4])+)/i);
  if (match) return match[1].replace(/\s+/g, ' ').trim();
  const match2 = expl.match(/([A-D]-[1-4],\s*[A-D]-[1-4],\s*[A-D]-[1-4](?:,\s*[A-D]-[1-4])?)/i);
  if (match2) return match2[1].trim();
  return null;
}

export async function runMatchQuestionsMigration(): Promise<number> {
  const r = await pool.query(`
    SELECT id, question, options, correct_answer, explanation 
    FROM public.questions 
    WHERE options::text LIKE '%\\t1.%' OR options::text LIKE '%\\t 1.%'
  `);
  console.log(`[Migration] Found ${r.rows.length} candidate Match-the-Column questions.`);

  let migratedCount = 0;
  for (const row of r.rows) {
    const rawOptions = Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]');
    const leftColumn: Array<{ key: string; text: string }> = [];
    const rightColumn: Array<{ key: string; text: string }> = [];
    const existingCodes: Array<{ id: string; text: string }> = [];

    const letters = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < rawOptions.length; i++) {
      const opt = rawOptions[i];
      const optText = String(opt.text || '');

      if (opt.id === 'E' || optText.toLowerCase().includes('not attempted')) {
        continue;
      }

      if (optText.includes('\t')) {
        const parts = optText.split('\t');
        const leftRaw = cleanText(parts[0]);
        const rightRaw = cleanText(parts.slice(1).join(' '));

        const rightMatch = rightRaw.match(/^([1-4])\.\s*(.*)$/);
        const rightNum = rightMatch ? rightMatch[1] : String(leftColumn.length + 1);
        const rightDesc = rightMatch ? rightMatch[2] : rightRaw;

        const leftLetter = letters[leftColumn.length] || String.fromCharCode(65 + leftColumn.length);

        leftColumn.push({ key: leftLetter, text: leftRaw });
        rightColumn.push({ key: rightNum, text: rightDesc });
      } else if (/^[A-D]-[1-4]/.test(optText)) {
        existingCodes.push({ id: opt.id, text: cleanText(optText) });
      }
    }

    if (leftColumn.length >= 2 && rightColumn.length >= 2) {
      const matchData = {
        leftHeader: 'List-I',
        rightHeader: 'List-II',
        leftColumn,
        rightColumn,
      };

      const correctCodeFromExpl = extractCodeFromExplanation(row.explanation);
      const correctAns = (row.correct_answer || 'A').toUpperCase();

      const n = leftColumn.length;
      let targetCorrectCode = correctCodeFromExpl;
      if (!targetCorrectCode) {
        targetCorrectCode = leftColumn.map((item, idx) => `${item.key}-${idx + 1}`).join(', ');
      }

      const newOptions = [
        { id: 'A', text: correctAns === 'A' ? targetCorrectCode : `A-1, B-2, C-3${n > 3 ? ', D-4' : ''}` },
        { id: 'B', text: correctAns === 'B' ? targetCorrectCode : `A-2, B-1, C-4${n > 3 ? ', D-3' : ''}` },
        { id: 'C', text: correctAns === 'C' ? targetCorrectCode : `A-1, B-3, C-2${n > 3 ? ', D-4' : ''}` },
        { id: 'D', text: correctAns === 'D' ? targetCorrectCode : `A-2, B-4, C-3${n > 3 ? ', D-1' : ''}` },
        { id: 'E', text: 'Question not attempted' },
      ];

      for (const ec of existingCodes) {
        const idx = newOptions.findIndex(o => o.id === ec.id);
        if (idx !== -1 && ec.id !== correctAns) {
          newOptions[idx].text = ec.text;
        }
      }

      await pool.query(`
        UPDATE public.questions SET
          type = 'MATCH_FOLLOWING',
          question_type = 'MATCH_FOLLOWING',
          match_data = $1::jsonb,
          options = $2::jsonb
        WHERE id = $3;
      `, [JSON.stringify(matchData), JSON.stringify(newOptions), row.id]);

      migratedCount++;
    }
  }

  console.log(`[Migration] Successfully migrated ${migratedCount} Match-the-Column questions.`);
  return migratedCount;
}

if (process.argv[1]?.endsWith('migrateMatchQuestions.ts')) {
  runMatchQuestionsMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
