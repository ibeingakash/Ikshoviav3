export function getMockDisplayTitle(test: {
  displayName?: string | null;
  display_name?: string | null;
  title?: string | null;
  name?: string | null;
  paper?: string | null;
  originalSourceName?: string | null;
  original_source_name?: string | null;
  exam?: string | null;
} | null | undefined): string {
  if (!test) return 'Mock Test';

  const adminName = test.displayName || test.display_name;
  if (adminName && typeof adminName === 'string' && adminName.trim()) {
    return adminName.trim();
  }

  const rawTitle = test.title || test.name || '';

  // Detect raw internal filename artifacts
  const isRawFilename =
    rawTitle.includes('DOC-') ||
    rawTitle.includes('WA00') ||
    rawTitle.includes('removed') ||
    rawTitle.endsWith('.pdf') ||
    /job_ocr_\d+/.test(rawTitle);

  if (!isRawFilename && rawTitle.trim()) {
    return rawTitle.trim();
  }

  // Fallback to human readable name based on paper / exam
  if (test.paper && typeof test.paper === 'string' && !test.paper.includes('DOC-') && !test.paper.endsWith('.pdf')) {
    return `${test.exam || 'BPSC'} — ${test.paper}`;
  }

  // If original source has a clean test number: e.g. "Full Length test 3.pdf" or "2.0 FLT 2 eng 2.pdf"
  const orig = test.originalSourceName || test.original_source_name || rawTitle;
  const fltMatch = orig.match(/FLT\s*(\d+)/i) || orig.match(/test\s*(\d+)/i);
  if (fltMatch) {
    return `${test.exam || 'BPSC 71st Prelims'} — Full Mock Test ${fltMatch[1]}`;
  }

  return 'BPSC 71st Prelims — Full Mock Test';
}
