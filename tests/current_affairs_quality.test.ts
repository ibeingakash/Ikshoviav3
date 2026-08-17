import { describe, it, expect, beforeAll } from 'vitest';
import { currentAffairsRepository } from '../server/repositories/CurrentAffairsRepository.js';

describe('Current Affairs Article Quality Gate & News Engine', () => {
  beforeAll(async () => {
    await currentAffairsRepository.ensureSeedArticles();
  });

  it('1. Excludes generic homepages from Current Affairs feed', async () => {
    const articles = await currentAffairsRepository.listArticles();
    
    // Ensure no generic institutional homepage titles exist
    const homepageTitles = [
      'indian space research organisation',
      'reserve bank of india',
      'example domain',
      'home',
      'index',
      'welcome'
    ];

    for (const art of articles) {
      const lowerTitle = art.title.toLowerCase().trim();
      expect(homepageTitles).not.toContain(lowerTitle);
      if (art.sourceUrl) {
        expect(art.sourceUrl).not.toBe('https://www.isro.gov.in/');
        expect(art.sourceUrl).not.toBe('https://rbi.org.in/');
      }
    }
  });

  it('2. Excludes proxy/test resources from Current Affairs feed', async () => {
    const articles = await currentAffairsRepository.listArticles();
    for (const art of articles) {
      expect(art.id).not.toBe('res_03fb84bc5a39');
      expect(art.title.toLowerCase()).not.toContain('proxy test');
    }
  });

  it('3. Surfaces actual verified events & announcements with structured schema', async () => {
    const articles = await currentAffairsRepository.listArticles();
    expect(articles.length).toBeGreaterThanOrEqual(7);

    // Verify ISRO Gaganyaan mission announcement is surfaced with all fields
    const gaganyaanArt = articles.find(a => a.id === 'ca_isro_gaganyaan_2026');
    expect(gaganyaanArt).toBeDefined();
    expect(gaganyaanArt?.title).toContain('ISRO Successfully Validates Gaganyaan');
    expect(gaganyaanArt?.whyInNews).toBeDefined();
    expect(gaganyaanArt?.whatHappened).toBeDefined();
    expect(gaganyaanArt?.keyFacts?.length).toBeGreaterThanOrEqual(3);
    expect(gaganyaanArt?.whyItMatters).toBeDefined();
    expect(gaganyaanArt?.prelimsPointers?.length).toBeGreaterThanOrEqual(2);
    expect(gaganyaanArt?.mainsDimensions).toBeDefined();
    expect(gaganyaanArt?.source).toBe('Indian Space Research Organisation (ISRO)');
  });

  it('4. Never displays "Generic Http" or raw metadata as publisher', async () => {
    const articles = await currentAffairsRepository.listArticles();
    for (const art of articles) {
      expect(art.source.toLowerCase()).not.toBe('generic http');
      expect(art.source).not.toBe('PRIMARY_GOVT');
      expect(art.source.length).toBeGreaterThan(2);
    }
  });

  it('5. Filters Bihar-specific current affairs accurately', async () => {
    const biharArticles = await currentAffairsRepository.listArticles({ biharOnly: true });
    expect(biharArticles.length).toBeGreaterThanOrEqual(1);

    const kosiArt = biharArticles.find(a => a.id === 'ca_kosi_mechi_bihar_2026');
    expect(kosiArt).toBeDefined();
    expect(kosiArt?.category).toBe('Bihar Current Affairs');
    expect(kosiArt?.biharRelevance).toContain('BPSC');
  });

  it('6. Supports Spaced Repetition bookmarking', async () => {
    const testUserId = 'usr_student';
    const testArtId = 'ca_sc_writ_226';

    const bookmarked = await currentAffairsRepository.bookmarkForRevision(testUserId, testArtId);
    expect(bookmarked).toBe(true);

    const isBookmarked = await currentAffairsRepository.isBookmarkedBy(testUserId, testArtId);
    expect(isBookmarked).toBe(true);
  });
});
