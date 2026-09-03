import { pyqRepository } from '../../repositories/PyqRepository.js';

async function main() {
  console.log('[Seed DB] Starting official PYQ database re-seeding...');
  await pyqRepository.seedOfficialPapers();
  console.log('[Seed DB] Database successfully re-seeded with official verified questions.');
  process.exit(0);
}

main().catch(err => {
  console.error('[Seed DB] Error during re-seed:', err);
  process.exit(1);
});
