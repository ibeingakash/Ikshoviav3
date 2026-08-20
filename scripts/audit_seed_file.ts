import { OFFICIAL_CURRENT_AFFAIRS } from '../server/db/seedCurrentAffairs.js';

console.log(`Total seed articles in seedCurrentAffairs.ts: ${OFFICIAL_CURRENT_AFFAIRS.length}`);

const dateMap: Record<string, number> = {};
for (const art of OFFICIAL_CURRENT_AFFAIRS) {
  dateMap[art.date] = (dateMap[art.date] || 0) + 1;
}

console.log('Date distribution in seedCurrentAffairs.ts:');
console.table(
  Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))
);
