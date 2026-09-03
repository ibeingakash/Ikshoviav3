import https from 'https';
import { DiscoveredPaper } from './OfficialPyqDiscoveryService.js';

function fetchHttps(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...headers
      },
      timeout: 15000,
      rejectUnauthorized: false
    }, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http') ? res.headers.location : `https://upsc.gov.in${res.headers.location}`;
        return fetchHttps(redirectUrl, headers).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

export class UpscDiscoveryAdapter {
  private static instance: UpscDiscoveryAdapter;
  private readonly baseUrl = 'https://www.upsc.gov.in/examinations/previous-question-papers';

  public static getInstance(): UpscDiscoveryAdapter {
    if (!UpscDiscoveryAdapter.instance) {
      UpscDiscoveryAdapter.instance = new UpscDiscoveryAdapter();
    }
    return UpscDiscoveryAdapter.instance;
  }

  /**
   * Validate that URL belongs to official commission domain
   */
  isValidOfficialDomain(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'upsc.gov.in' || parsed.hostname.endsWith('.upsc.gov.in');
    } catch {
      return false;
    }
  }

  /**
   * Dynamically query the official UPSC previous question papers archive.
   * Discovers Civil Services (Preliminary) Examination for ANY year dynamically.
   */
  async discoverAllUpscPapers(): Promise<DiscoveredPaper[]> {
    const discovered: DiscoveredPaper[] = [];

    try {
      const html = await fetchHttps(this.baseUrl);
      
      // Match captions like:
      // <caption>Civil Services (Preliminary) Examination, 2026</caption>
      // <caption>Civil Services (Preliminary) Examination, 2027</caption>
      const tableRegex = /<caption>\s*Civil Services \(Preliminary\) Examination,\s*(\d{4})\s*<\/caption>([\s\S]*?)<\/table>/gi;
      let match: RegExpExecArray | null;

      while ((match = tableRegex.exec(html)) !== null) {
        const year = parseInt(match[1], 10);
        const tableBody = match[2];
        const linkMatches = [...tableBody.matchAll(/<li>\s*([^<]+?)\s*<a\s+href="([^"]+)"/gi)];

        for (const lm of linkMatches) {
          const rawName = lm[1].trim();
          let pdfUrl = lm[2].trim();
          if (pdfUrl.startsWith('/')) {
            pdfUrl = `https://www.upsc.gov.in${pdfUrl}`;
          }

          if (!this.isValidOfficialDomain(pdfUrl)) {
            console.warn(`[UpscDiscoveryAdapter] Skipped non-official domain URL: ${pdfUrl}`);
            continue;
          }

          let paperKey = 'GS Paper I';
          let paperName = `Civil Services (Preliminary) ${year} - General Studies Paper I`;
          let paperCode = 'CSP-GS1';
          let expectedCount = 100;
          let marks = 2.0;
          let neg = 0.666;

          const isPaper2 = rawName.toLowerCase().includes('paper - ii') || 
                           rawName.toLowerCase().includes('paper ii') || 
                           rawName.toLowerCase().includes('csat') ||
                           rawName.toLowerCase().includes('general studies-ii');

          if (isPaper2) {
            paperKey = 'CSAT';
            paperName = `Civil Services (Preliminary) ${year} - General Studies Paper II (CSAT)`;
            paperCode = 'CSP-CSAT';
            expectedCount = 80;
            marks = 2.5;
            neg = 0.833;
          }

          const id = `paper_upsc_${year}_${isPaper2 ? 'csat' : 'gs1'}`;

          discovered.push({
            id,
            exam: 'UPSC CSE',
            examName: 'Civil Services (Preliminary) Examination',
            year,
            examCycle: String(year),
            stage: 'Prelims',
            paper: paperKey,
            paperName,
            paperCode,
            officialSourceUrl: this.baseUrl,
            officialPaperUrl: pdfUrl,
            sourceDomain: 'upsc.gov.in',
            expectedQuestionCount: expectedCount,
            marksPerCorrect: marks,
            negativeMarking: neg,
            durationMinutes: 120,
            language: 'bilingual'
          });
        }
      }
    } catch (err: any) {
      console.warn('[UpscDiscoveryAdapter] Live archive discovery warning:', err.message);
    }

    if (discovered.length === 0) {
      return this.getAuthoritativeCatalog();
    }

    return discovered;
  }

  /**
   * Authoritative baseline catalog of official UPSC Prelims papers
   */
  getAuthoritativeCatalog(): DiscoveredPaper[] {
    return [
      {
        id: 'paper_upsc_2026_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2026,
        examCycle: '2026',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2026 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2026_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2026,
        examCycle: '2026',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2026 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-II.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2025_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2025,
        examCycle: '2025',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2025 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2025_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2025,
        examCycle: '2025',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2025 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-II.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2024_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2024,
        examCycle: '2024',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2024 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-I-180624.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2024_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2024,
        examCycle: '2024',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2024 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-24-GENERAL-STUDIES-PAPER-II-180624.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2023_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2023,
        examCycle: '2023',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2023 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-23-GeneralStudiesPaper-I-290523.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2023_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2023,
        examCycle: '2023',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2023 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-23-GeneralStudiesPaper-II-290523.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2022_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2022,
        examCycle: '2022',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2022 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-22-GS-P-I-070622.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2022_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2022,
        examCycle: '2022',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2022 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-22-GS-P-II-070622.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2021_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2021,
        examCycle: '2021',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2021 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-21-GS-P-I.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2021_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2021,
        examCycle: '2021',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2021 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-21-GS-P-II.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2020_gs1',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2020,
        examCycle: '2020',
        stage: 'Prelims',
        paper: 'GS Paper I',
        paperName: 'Civil Services (Preliminary) 2020 - General Studies Paper I',
        paperCode: 'CSP-GS1',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-20-GS-P-I.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 100,
        marksPerCorrect: 2.0,
        negativeMarking: 0.666,
        durationMinutes: 120,
        language: 'bilingual'
      },
      {
        id: 'paper_upsc_2020_csat',
        exam: 'UPSC CSE',
        examName: 'Civil Services (Preliminary) Examination',
        year: 2020,
        examCycle: '2020',
        stage: 'Prelims',
        paper: 'CSAT',
        paperName: 'Civil Services (Preliminary) 2020 - General Studies Paper II (CSAT)',
        paperCode: 'CSP-CSAT',
        officialSourceUrl: this.baseUrl,
        officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-20-GS-P-II.pdf',
        sourceDomain: 'upsc.gov.in',
        expectedQuestionCount: 80,
        marksPerCorrect: 2.5,
        negativeMarking: 0.833,
        durationMinutes: 120,
        language: 'bilingual'
      }
    ];
  }
}

export const upscDiscoveryAdapter = UpscDiscoveryAdapter.getInstance();
