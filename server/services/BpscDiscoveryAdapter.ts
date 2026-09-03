import https from 'https';
import crypto from 'crypto';
import fs from 'fs';

export interface BpscCcePaperMetadata {
  id: string;
  exam: 'BPSC';
  examName: string;
  year: number;
  examCycle: string;
  cycleNumber: number;
  stage: 'Prelims';
  paper: string;
  paperName: string;
  paperCode: string;
  officialSourceUrl: string;
  officialPaperUrl: string;
  sourceDomain: string;
  expectedQuestionCount: number;
  marksPerCorrect: number;
  negativeMarking: number;
  durationMinutes: number;
  language: string;
  hasOfficialAnswerKey: boolean;
  notes?: string;
}

export interface ValidatedPdfResult {
  valid: boolean;
  buffer?: Buffer;
  hash?: string;
  sizeBytes?: number;
  contentType?: string;
  statusCode?: number;
  error?: string;
}

export class BpscDiscoveryAdapter {
  private static instance: BpscDiscoveryAdapter;
  private readonly baseUrl = 'https://bpsc.bihar.gov.in/question-booklets/';
  private readonly ajaxUrl = 'https://bpsc.bihar.gov.in/wp-admin/admin-ajax.php';

  public static getInstance(): BpscDiscoveryAdapter {
    if (!BpscDiscoveryAdapter.instance) {
      BpscDiscoveryAdapter.instance = new BpscDiscoveryAdapter();
    }
    return BpscDiscoveryAdapter.instance;
  }

  private fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        rejectUnauthorized: false
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  private postAjax(action: string, nonce: string, params: Record<string, string> = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const postData = new URLSearchParams({ action, nonce, ...params }).toString();
      const req = https.request(this.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': this.baseUrl,
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000,
        rejectUnauthorized: false
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * Dynamically query the official BPSC portal to discover all CCE Prelims papers.
   */
  async discoverAllCcePapers(): Promise<BpscCcePaperMetadata[]> {
    const discovered: BpscCcePaperMetadata[] = [];

    try {
      const html = await this.fetchHtml(this.baseUrl);
      const nonceMatch = html.match(/question_booklets_params\s*=\s*\{[^}]*\"nonce\":\"([^\"]+)\"/);
      if (!nonceMatch) {
        console.warn('[BpscDiscoveryAdapter] Nonce not found, using authoritative cached catalog');
        return this.getAuthoritativeCatalog();
      }

      const nonce = nonceMatch[1];
      // Parent ID 2 = Combined Competitive Examination (CCE)
      const cceRes = await this.postAjax('get_children', nonce, { parent_id: '2' });
      const cycles = cceRes?.data?.children || [];

      for (const cycle of cycles) {
        const cycleTitle = cycle.title;
        const cycleMatch = cycleTitle.match(/(\d+)(?:st|nd|rd|th)/i);
        const cycleNum = cycleMatch ? parseInt(cycleMatch[1], 10) : 70;

        const stageRes = await this.postAjax('get_children', nonce, { parent_id: cycle.id });
        const stages = stageRes?.data?.children || [];

        for (const stage of stages) {
          if (stage.title.toLowerCase().includes('prelim') || stage.title.toLowerCase().includes('pt')) {
            const pdfRes = await this.postAjax('get_question_booklets_pdfs', nonce, { item_id: stage.id });
            const pdfs = pdfRes?.data?.pdfs || [];

            for (const pdf of pdfs) {
              if (pdf.title.toLowerCase().includes('general studies') || pdf.title.toLowerCase().includes('gs')) {
                const combinedMetadata = `${cycleTitle} ${stage.title} ${pdf.title || ''} ${pdf.file_url || ''}`;
                
                // Derive year directly from official source text or file URL
                let year: number | null = null;
                const yearMatch = combinedMetadata.match(/\b(202\d|203\d)\b/);
                if (yearMatch) {
                  year = parseInt(yearMatch[1], 10);
                } else {
                  const datePattern = combinedMetadata.match(/(\d{2})[-_/](\d{2})[-_/](20)?(\d{2})/);
                  if (datePattern) {
                    year = 2000 + parseInt(datePattern[4], 10);
                  }
                }

                // Fallback to official commission examination gazette mapping for verified past cycles
                if (!year) {
                  if (cycleNum === 71) year = 2025;
                  else if (cycleNum === 70) year = 2024;
                  else if (cycleNum === 69) year = 2023;
                  else if (cycleNum === 68) year = 2023;
                  else if (cycleNum === 67) year = 2022;
                  else if (cycleNum === 66) year = 2020;
                  else year = new Date().getFullYear();
                }

                const getOrdinal = (n: number) => {
                  const j = n % 10, k = n % 100;
                  if (j === 1 && k !== 11) return 'st';
                  if (j === 2 && k !== 12) return 'nd';
                  if (j === 3 && k !== 13) return 'rd';
                  return 'th';
                };
                const ord = getOrdinal(cycleNum);
                const isReExam = pdf.title.toLowerCase().includes('re-exam') || pdf.title.includes('04-01-25');
                const paperId = `paper_bpsc_${cycleNum}${ord}_gs${isReExam ? '_re' : ''}`;

                discovered.push({
                  id: paperId,
                  exam: 'BPSC',
                  examName: 'Combined Competitive Examination (CCE)',
                  year,
                  examCycle: `${cycleNum}${ord} CCE`,
                  cycleNumber: cycleNum,
                  stage: 'Prelims',
                  paper: 'General Studies',
                  paperName: `${cycleNum}th BPSC CCE Prelims - ${pdf.title || 'General Studies'}`,
                  paperCode: `BPSC-${cycleNum}-GS`,
                  officialSourceUrl: this.baseUrl,
                  officialPaperUrl: pdf.file_url,
                  sourceDomain: 'bpsc.bihar.gov.in',
                  expectedQuestionCount: 150,
                  marksPerCorrect: 1.0,
                  negativeMarking: cycleNum >= 68 ? 0.333 : 0,
                  durationMinutes: 120,
                  language: 'bilingual',
                  hasOfficialAnswerKey: true
                });
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('[BpscDiscoveryAdapter] Dynamic discovery error:', err.message);
    }

    if (discovered.length === 0) {
      return this.getAuthoritativeCatalog();
    }

    return discovered;
  }

  /**
   * Authoritative catalog of exact official PDF URLs mapped from bpsc.bihar.gov.in
   */
  getAuthoritativeCatalog(): BpscCcePaperMetadata[] {
    return [
      {
        id: 'paper_bpsc_71st_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2025,
        examCycle: '71st CCE',
        cycleNumber: 71,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '71st BPSC Combined Competitive (Preliminary) Examination - General Studies',
        paperCode: 'BPSC-CCE-71',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/General-Studies-4.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0.333,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true,
        notes: 'Official BPSC Question Booklet Booklet Series A'
      },
      {
        id: 'paper_bpsc_70th_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2024,
        examCycle: '70th CCE',
        cycleNumber: 70,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '70th BPSC Combined Competitive (Preliminary) Examination - General Studies',
        paperCode: 'BPSC-CCE-70',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/GENERAL-STUDIES-13-12-24.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0.333,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true
      },
      {
        id: 'paper_bpsc_69th_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2023,
        examCycle: '69th CCE',
        cycleNumber: 69,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '69th BPSC Combined Competitive (Preliminary) Examination - General Studies',
        paperCode: 'BPSC-CCE-69',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/NB-2023-09-30-01-1-1.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0.333,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true
      },
      {
        id: 'paper_bpsc_68th_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2023,
        examCycle: '68th CCE',
        cycleNumber: 68,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '68th BPSC Combined Competitive (Preliminary) Examination - General Studies',
        paperCode: 'BPSC-CCE-68',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/General-Studies.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0.25,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true
      },
      {
        id: 'paper_bpsc_67th_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2022,
        examCycle: '67th CCE',
        cycleNumber: 67,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '67th BPSC Combined Competitive (Preliminary) Examination - General Studies (Re-Exam)',
        paperCode: 'BPSC-CCE-67',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/General-Studies-Re-Exam.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true
      },
      {
        id: 'paper_bpsc_66th_gs',
        exam: 'BPSC',
        examName: 'Combined Competitive Examination (CCE)',
        year: 2020,
        examCycle: '66th CCE',
        cycleNumber: 66,
        stage: 'Prelims',
        paper: 'General Studies',
        paperName: '66th BPSC Combined Competitive (Preliminary) Examination - General Studies',
        paperCode: 'BPSC-CCE-66',
        officialSourceUrl: 'https://bpsc.bihar.gov.in/question-booklets/',
        officialPaperUrl: 'https://bpsc.bihar.gov.in/wp-content/uploads/BPSC_content/QuestionBooklets/General-Studies-2.pdf',
        sourceDomain: 'bpsc.bihar.gov.in',
        expectedQuestionCount: 150,
        marksPerCorrect: 1.0,
        negativeMarking: 0,
        durationMinutes: 120,
        language: 'bilingual',
        hasOfficialAnswerKey: true
      }
    ];
  }

  /**
   * Download and validate official PDF buffer from BPSC URL.
   */
  async downloadAndValidatePdf(url: string): Promise<ValidatedPdfResult> {
    return new Promise((resolve) => {
      https.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/pdf,*/*'
        },
        timeout: 30000,
        rejectUnauthorized: false
      }, (res) => {
        const statusCode = res.statusCode || 0;
        const contentType = res.headers['content-type'] || '';

        if (statusCode !== 200) {
          return resolve({
            valid: false,
            statusCode,
            contentType,
            error: `HTTP error ${statusCode} downloading PDF from ${url}`
          });
        }

        const chunks: Buffer[] = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          if (buffer.length < 10000) {
            return resolve({
              valid: false,
              statusCode,
              contentType,
              sizeBytes: buffer.length,
              error: `Downloaded file too small (${buffer.length} bytes), likely error response`
            });
          }

          // Check PDF magic header %PDF
          const magic = buffer.subarray(0, 5).toString('ascii');
          if (!magic.startsWith('%PDF')) {
            return resolve({
              valid: false,
              statusCode,
              contentType,
              sizeBytes: buffer.length,
              error: `Invalid file header (${magic}), not a valid PDF`
            });
          }

          const hash = crypto.createHash('sha256').update(buffer).digest('hex');

          return resolve({
            valid: true,
            buffer,
            hash,
            sizeBytes: buffer.length,
            contentType,
            statusCode
          });
        });
      }).on('error', (err) => {
        resolve({
          valid: false,
          error: `Network error downloading PDF: ${err.message}`
        });
      });
    });
  }
}

export const bpscDiscoveryAdapter = BpscDiscoveryAdapter.getInstance();
