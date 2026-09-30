import pool from "./pool.js";

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\b\d+\.\d+\s+FLT\s+\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function migrateAllMatchQuestions() {
  console.log('[MatchMigration] Starting comprehensive Match-the-Following data cleanup...');

  // Step 1: Ensure options_en matches options for existing MATCH_FOLLOWING
  await pool.query(`
    UPDATE public.questions
    SET options_en = options
    WHERE (type = 'MATCH_FOLLOWING' OR question_type = 'MATCH_FOLLOWING')
      AND options IS NOT NULL;
  `);

  // Step 2: Handle questions where options contain flattened List I / List II + Codes
  // Example: "Kurinji 1. Varunan – fishing and salt manufacture A-2, B-3, C-1, D-4, E-5"
  const flattenedRes = await pool.query(`
    SELECT id, question, options, correct_answer, explanation
    FROM public.questions
    WHERE (match_data IS NULL OR match_data = '{}'::jsonb)
      AND options::text ~* '[A-E]-[1-5]'
      AND options::text ~* '[1-5]\\.'
  `);

  console.log(`[MatchMigration] Inspecting ${flattenedRes.rows.length} questions with flattened options...`);
  let migratedFlattened = 0;

  for (const row of flattenedRes.rows) {
    const rawOptions = Array.isArray(row.options) ? row.options : JSON.parse(row.options || '[]');
    const leftCol: Array<{ key: string; text: string }> = [];
    const rightCol: Array<{ key: string; text: string }> = [];
    const newOptions: Array<{ id: string; text: string }> = [];

    const letters = ['A', 'B', 'C', 'D', 'E'];

    for (let i = 0; i < rawOptions.length; i++) {
      const opt = rawOptions[i];
      const optText = String(opt.text || '');

      // Check if this option contains code at end: e.g. "A-2, B-3, C-1, D-4, E-5"
      const codeMatch = optText.match(/([a-eA-E]-[1-5](?:,\s*[a-eA-E]-[1-5])+)/i);
      const code = codeMatch ? codeMatch[1].trim() : null;

      // Extract left & right items before code
      const textBeforeCode = codeMatch ? optText.substring(0, codeMatch.index).trim() : optText;
      // Pattern: "[LeftText] [1-5]. [RightText]"
      const splitMatch = textBeforeCode.match(/^(.*?)\s*([1-5])[\.\)]\s*(.*)$/);

      if (splitMatch) {
        const leftName = cleanText(splitMatch[1]).replace(/^[A-E][\.\)]\s*/, '');
        const rightNum = splitMatch[2];
        const rightDesc = cleanText(splitMatch[3]).replace(/Select the correct.*$/i, '').replace(/Sectional Test.*$/i, '').trim();

        if (leftName && rightDesc) {
          const letter = letters[leftCol.length] || String.fromCharCode(65 + leftCol.length);
          leftCol.push({ key: letter, text: leftName });
          rightCol.push({ key: rightNum, text: rightDesc });
        }
      }

      if (code) {
        newOptions.push({ id: opt.id, text: code });
      } else if (optText.toLowerCase().includes('not attempted')) {
        newOptions.push({ id: opt.id, text: 'Not Attempted' });
      }
    }

    if (leftCol.length >= 2 && rightCol.length >= 2 && newOptions.length >= 2) {
      const matchData = {
        leftHeader: 'List-I',
        rightHeader: 'List-II',
        leftColumn: leftCol,
        rightColumn: rightCol,
      };

      await pool.query(`
        UPDATE public.questions SET
          type = 'MATCH_FOLLOWING',
          question_type = 'MATCH_FOLLOWING',
          match_data = $1,
          options = $2,
          options_en = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [JSON.stringify(matchData), JSON.stringify(newOptions), row.id]);

      migratedFlattened++;
    }
  }
  console.log(`[MatchMigration] Successfully migrated ${migratedFlattened} questions with flattened options.`);

  // Step 3: Handle questions where List-I and List-II are embedded in question text
  const stemRes = await pool.query(`
    SELECT id, question, question_en, options, correct_answer
    FROM public.questions
    WHERE (match_data IS NULL OR match_data = '{}'::jsonb)
      AND (
        question ~* 'List\\s*[-–.]?\\s*I'
        OR question ~* 'सूची\\s*[-–.]?\\s*I'
      )
  `);

  console.log(`[MatchMigration] Inspecting ${stemRes.rows.length} questions with List-I in text...`);
  let migratedStem = 0;

  for (const row of stemRes.rows) {
    const text = row.question || '';
    // Pattern to find lines with Letter item and Number item
    // Examples:
    // P. Oxytocin. \t1. Stimulates...
    // A. Lothal \t1. Dockyard
    // A. Conduction \t1. Heat transfer...
    const lines = text.split(/\n+/);
    const leftCol: Array<{ key: string; text: string }> = [];
    const rightCol: Array<{ key: string; text: string }> = [];

    const itemRegex = /([A-Za-z])[\.\)]\s*([^\t\n0-9]+?)(?:\.|\t|\s{2,})\s*([1-9])[\.\)]\s*(.*)/;
    let stemEndIndex = -1;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const m = line.trim().match(itemRegex);
      if (m) {
        if (stemEndIndex === -1) {
          stemEndIndex = idx;
        }
        leftCol.push({ key: m[1].toUpperCase(), text: cleanText(m[2]) });
        rightCol.push({ key: m[3], text: cleanText(m[4]) });
      }
    }

    if (leftCol.length >= 2 && rightCol.length >= 2) {
      // Clean question stem
      const cleanStem = lines.slice(0, stemEndIndex > 0 ? stemEndIndex : 1).join('\n')
        .replace(/List\s*[-–.]?\s*I.*List\s*[-–.]?\s*II:?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const matchData = {
        leftHeader: 'List-I',
        rightHeader: 'List-II',
        leftColumn: leftCol,
        rightColumn: rightCol,
      };

      await pool.query(`
        UPDATE public.questions SET
          type = 'MATCH_FOLLOWING',
          question_type = 'MATCH_FOLLOWING',
          question = $1,
          question_en = $1,
          match_data = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [cleanStem || row.question, JSON.stringify(matchData), row.id]);

      migratedStem++;
    }
  }

  console.log(`[MatchMigration] Successfully extracted ${migratedStem} questions with embedded List-I/II in stem.`);
  console.log('[MatchMigration] Completed.');
}
