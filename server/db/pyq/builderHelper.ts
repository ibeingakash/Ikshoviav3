import fs from 'fs';
import path from 'path';

// Helper to write JSON/TS files
export function writePaperFile(filename: string, varName: string, questions: any[]) {
  const content = `import { OfficialPyqQuestion } from './types.js';\n\nexport const ${varName}: OfficialPyqQuestion[] = ${JSON.stringify(questions, null, 2)};\n`;
  const targetPath = path.join(process.cwd(), 'server', 'db', 'pyq', filename);
  fs.writeFileSync(targetPath, content, 'utf-8');
  console.log(`[PYQ Builder] Written ${questions.length} questions to ${filename}`);
}
