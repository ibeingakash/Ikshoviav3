import {
  UserProfile,
  Subject,
  Topic,
  Concept,
  ConceptRelationship,
  ConceptMastery,
  LearnerModel,
  NextBestAction,
  Question,
  QuestionAttempt,
  RevisionItem,
  MockTest,
  MockAttempt,
  CurrentAffairArticle,
  LearningResource,
  StudyGoal,
  ChatConversation,
  AIContentDraft,
  NotificationItem,
  MistakeCategory,
  OCRJob,
  AuditLogRecord,
  AdminUser,
} from '../src/types/index.js';

class IKSHOVIADatabase {
  public users: Map<string, UserProfile> = new Map();
  public subjects: Map<string, Subject> = new Map();
  public topics: Map<string, Topic> = new Map();
  public concepts: Map<string, Concept> = new Map();
  public relationships: ConceptRelationship[] = [];
  public mastery: Map<string, ConceptMastery> = new Map(); // key: userId_conceptId
  public learnerModels: Map<string, LearnerModel> = new Map();
  public questions: Map<string, Question> = new Map();
  public questionAttempts: QuestionAttempt[] = [];
  public mockTests: Map<string, MockTest> = new Map();
  public mockAttempts: MockAttempt[] = [];
  public currentAffairs: Map<string, CurrentAffairArticle> = new Map();
  public resources: Map<string, LearningResource> = new Map();
  public goals: Map<string, StudyGoal> = new Map();
  public conversations: Map<string, ChatConversation> = new Map();
  public aiDrafts: Map<string, AIContentDraft> = new Map();
  public notifications: Map<string, NotificationItem[]> = new Map();
  public ocrJobs: Map<string, OCRJob> = new Map();
  public auditLogs: AuditLogRecord[] = [];
  public adminPermissions: Map<string, string[]> = new Map();

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // 1. Seed Users
    const demoUser: UserProfile = {
      id: 'usr_demo',
      email: 'student@ikshovia.com',
      name: 'Ananya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'USER',
      isOnboarded: true,
      onboarding: {
        targetExam: 'UPSC CSE 2026',
        selectedSubjects: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography'],
        dailyGoalMinutes: 120,
        experienceLevel: 'Intermediate',
        goalStatement: 'Aiming for Top 100 rank in UPSC Civil Services Examination with strong grasp on Polity and Economy.',
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const adminUser: UserProfile = {
      id: 'usr_admin',
      email: 'admin@ikshovia.com',
      name: 'Dr. Vikramaditya (Admin)',
      role: 'ADMIN',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };

    const superAdminUser: UserProfile = {
      id: 'usr_superadmin',
      email: 'superadmin@ikshovia.com',
      name: 'Chief Admin (Super Admin)',
      role: 'SUPER_ADMIN',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };

    this.users.set(demoUser.id, demoUser);
    this.users.set(adminUser.id, adminUser);
    this.users.set(superAdminUser.id, superAdminUser);

    this.adminPermissions.set('usr_admin', [
      'QUESTION_CREATE',
      'QUESTION_EDIT',
      'QUESTION_PUBLISH',
      'OCR_IMPORT',
      'OCR_REVIEW',
      'MOCK_CREATE',
      'CONCEPT_CREATE',
    ]);
    this.adminPermissions.set('usr_superadmin', [
      'ALL_PERMISSIONS',
      'ADMIN_MANAGE',
      'SYSTEM_SETTINGS',
      'AUDIT_LOG_VIEW',
    ]);

    // 2. Seed Subjects
    const subPolity: Subject = {
      id: 'sub_polity',
      name: 'Indian Polity & Governance',
      code: 'POLITY',
      description: 'Constitution, Fundamental Rights, Federal Structure, Judiciary, Executive & Parliament',
      iconName: 'Landmark',
      color: 'indigo',
      topicsCount: 4,
      conceptsCount: 8,
    };

    const subEconomy: Subject = {
      id: 'sub_economy',
      name: 'Indian Economy & Banking',
      code: 'ECONOMY',
      description: 'Macroeconomics, Monetary Policy, Fiscal Federalism, Banking, Inflation & Trade',
      iconName: 'TrendingUp',
      color: 'emerald',
      topicsCount: 3,
      conceptsCount: 6,
    };

    const subHistory: Subject = {
      id: 'sub_history',
      name: 'Indian History & Art/Culture',
      code: 'HISTORY',
      description: 'Ancient, Medieval, Modern Freedom Movement and Heritage',
      iconName: 'Scroll',
      color: 'amber',
      topicsCount: 3,
      conceptsCount: 5,
    };

    const subGeo: Subject = {
      id: 'sub_geography',
      name: 'Geography & Environment',
      code: 'GEOGRAPHY',
      description: 'Physical Geography, Western Ghats, Biodiversity, Monsoon & Climate Change',
      iconName: 'Compass',
      color: 'blue',
      topicsCount: 3,
      conceptsCount: 5,
    };

    const subCA: Subject = {
      id: 'sub_ca',
      name: 'Current Affairs & Governance',
      code: 'CURRENT_AFFAIRS',
      description: 'National, International Affairs, Policy Updates and Judicial Judgments',
      iconName: 'Newspaper',
      color: 'rose',
      topicsCount: 2,
      conceptsCount: 4,
    };

    [subPolity, subEconomy, subHistory, subGeo, subCA].forEach(s => this.subjects.set(s.id, s));

    // 3. Seed Topics
    const topics: Topic[] = [
      { id: 'top_const', subjectId: 'sub_polity', name: 'Constitutional Framework', description: 'Preamble, Features, Amendments', order: 1, conceptsCount: 2 },
      { id: 'top_rights', subjectId: 'sub_polity', name: 'Fundamental Rights & Duties', description: 'Articles 12 to 35, Writs & Duties', order: 2, conceptsCount: 3 },
      { id: 'top_judiciary', subjectId: 'sub_polity', name: 'Judiciary & Writs', description: 'Supreme Court, High Courts, Judicial Review', order: 3, conceptsCount: 2 },
      { id: 'top_federalism', subjectId: 'sub_polity', name: 'Federal System', description: 'Union-State Relations, Emergency Provisions', order: 4, conceptsCount: 1 },

      { id: 'top_monetary', subjectId: 'sub_economy', name: 'Monetary Policy & Banking', description: 'RBI, Repo Rate, MPC, Inflation', order: 1, conceptsCount: 3 },
      { id: 'top_fiscal', subjectId: 'sub_economy', name: 'Fiscal Policy & Federalism', description: 'Finance Commission, GST Council, Deficit', order: 2, conceptsCount: 2 },
      { id: 'top_banking', subjectId: 'sub_economy', name: 'Financial Markets', description: 'Money Market, Capital Market, SEBI', order: 3, conceptsCount: 1 },

      { id: 'top_ancient', subjectId: 'sub_history', name: 'Ancient Indian Civilizations', description: 'Indus Valley, Vedic Age, Buddhism/Jainism', order: 1, conceptsCount: 2 },
      { id: 'top_modern', subjectId: 'sub_history', name: 'Indian National Movement', description: '1857 Revolt, Non-Cooperation, Quit India', order: 2, conceptsCount: 3 },

      { id: 'top_phys_geo', subjectId: 'sub_geography', name: 'Physical Geography of India', description: 'Himalayas, Rivers, Monsoon Mechanism', order: 1, conceptsCount: 3 },
      { id: 'top_env', subjectId: 'sub_geography', name: 'Environment & Biodiversity', description: 'Western Ghats, Protected Areas, Climate Treaties', order: 2, conceptsCount: 2 },

      { id: 'top_ca_national', subjectId: 'sub_ca', name: 'Judicial & Legislative Updates', description: 'Key judgments, Acts and Bills', order: 1, conceptsCount: 2 },
      { id: 'top_ca_economy', subjectId: 'sub_ca', name: 'Economic Issues in News', description: 'Global inflation, Forex, Trade Agreements', order: 2, conceptsCount: 2 },
    ];
    topics.forEach(t => this.topics.set(t.id, t));

    // 4. Seed Concepts
    const concepts: Concept[] = [
      {
        id: 'c_art21',
        subjectId: 'sub_polity',
        topicId: 'top_rights',
        title: 'Article 21: Protection of Life and Personal Liberty',
        summary: 'Guarantees right to life and personal liberty. Interpreted broadly by Supreme Court to include right to privacy, clean environment, and dignity.',
        explanation: 'Article 21 states: "No person shall be deprived of his life or personal liberty except according to procedure established by law." Through famous cases like Maneka Gandhi (1978) and Puttaswamy (2017), the Supreme Court transitioned from strict "procedure established by law" to "due process of law", declaring right to privacy, livelihood, and clean environment as intrinsic components.',
        examples: ['KS Puttaswamy Judgment declaring Privacy as Fundamental Right', 'Right to Speedy Trial and Free Legal Aid'],
        keyPoints: [
          'Applies to both Citizens and Non-Citizens',
          'Cannot be suspended even during National Emergency (Article 359)',
          'Expanded through judicial activist interpretations',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: ['c_preamble'],
        relatedIds: ['c_writs', 'c_art32'],
        tags: ['Polity', 'Constitution', 'Rights', 'Supreme Court'],
      },
      {
        id: 'c_art32',
        subjectId: 'sub_polity',
        topicId: 'top_judiciary',
        title: 'Article 32: Constitutional Remedies & SC Writs',
        summary: 'Heart and Soul of the Constitution allowing citizens to move Supreme Court directly for enforcement of Fundamental Rights.',
        explanation: 'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul of the Indian Constitution". It confers the right to move the Supreme Court by appropriate proceedings for the enforcement of Fundamental Rights. Supreme Court can issue 5 types of writs: Habeas Corpus, Mandamus, Prohibition, Quo-Warranto, and Certiorari.',
        examples: ['Filing Habeas Corpus against illegal police detention', 'Mandamus issued to public authorities'],
        keyPoints: [
          'Basic Structure of the Constitution - cannot be curtailed by Amendment',
          'Applies ONLY for Fundamental Rights (unlike Article 226)',
          'Five writ types: Habeas Corpus, Mandamus, Certiorari, Prohibition, Quo-Warranto',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: ['c_art21'],
        relatedIds: ['c_art226', 'c_writs'],
        tags: ['Polity', 'Writs', 'Supreme Court'],
      },
      {
        id: 'c_art226',
        subjectId: 'sub_polity',
        topicId: 'top_judiciary',
        title: 'Article 226: High Court Writ Jurisdiction',
        summary: 'Empowers High Courts to issue writs for Fundamental Rights AND ordinary legal rights. Broader territorial and subject scope than Article 32.',
        explanation: 'While Article 32 is limited to Fundamental Rights, Article 226 allows High Courts to issue writs "for any other purpose" as well, making its scope wider than Article 32. However, moving High Court under 226 is a discretionary remedy, whereas Article 32 itself is a Fundamental Right.',
        examples: ['Challenging administrative order affecting property rights', 'Public Interest Litigation in High Court'],
        keyPoints: [
          'Wider jurisdiction than Article 32 (FRs + Legal Rights)',
          'Discretionary remedy, not a fundamental right itself',
          'High Court can refuse if alternative effective remedy exists',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: ['c_art32'],
        relatedIds: ['c_art32'],
        tags: ['Polity', 'High Court', 'Writs'],
      },
      {
        id: 'c_fiscal_fed',
        subjectId: 'sub_polity',
        topicId: 'top_federalism',
        title: 'Fiscal Federalism & Union-State Relations',
        summary: 'Division of tax powers, grants-in-aid, and financial resources between Union and States under Chapter 1 Part XII.',
        explanation: 'India exhibits asymmetric fiscal federalism. The Centre collects major buoyant taxes (Income Tax, Corporation Tax, Customs) while States handle high social expenditure (Health, Education, Agriculture). To balance this vertical and horizontal imbalance, Article 280 provides for Finance Commission.',
        examples: ['Divisibility pool of taxes (currently 41% share to States)', 'GST Revenue sharing mechanism'],
        keyPoints: [
          'Article 280: Finance Commission recommendations every 5 years',
          'Article 275 Statutory Grants vs Article 282 Discretionary Grants',
          'GST Council (Article 279A) as cooperative federalism pillar',
        ],
        difficulty: 'ADVANCED',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: ['c_mpc', 'c_gst_council'],
        tags: ['Polity', 'Economy', 'Federalism'],
      },
      {
        id: 'c_gst_council',
        subjectId: 'sub_polity',
        topicId: 'top_federalism',
        title: 'GST Council (Article 279A)',
        summary: 'Constitutional joint forum of Centre and States deciding GST rates, exemptions, and dispute mechanisms.',
        explanation: 'Constitutional body under Article 279A inserted by 101st Amendment. Union Finance Minister is Chairman. Vote weightage: Centre 1/3rd, States 2/3rd. Decisions require 3/4th majority, fostering cooperative federalism.',
        examples: ['Setting tax slabs (5%, 12%, 18%, 28%) for commodities'],
        keyPoints: [
          'Centre weight = 1/3rd, All States weight = 2/3rd',
          '75% majority required to pass resolutions',
          'SC in Mohit Minerals case held GST Council recommendations are advisory/persuasive',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: ['c_fiscal_fed'],
        relatedIds: ['c_fiscal_fed', 'c_fin_comm'],
        tags: ['Polity', 'Taxation', 'GST'],
      },
      {
        id: 'c_fin_comm',
        subjectId: 'sub_economy',
        topicId: 'top_fiscal',
        title: 'Finance Commission (Article 280)',
        summary: 'Quasi-judicial body constituted by President every 5 years to recommend tax distribution between Centre and States.',
        explanation: 'Article 280 mandates Finance Commission. Consists of Chairman + 4 members. Recommends vertical devolution (Centre to States) and horizontal devolution criteria (Population, Income Distance, Forest cover, Demographic performance).',
        examples: ['16th Finance Commission headed by Dr. Arvind Panagariya'],
        keyPoints: [
          'Constitutional body under Article 280',
          'Recommendations are advisory in nature',
          'Key criteria: Income distance (highest weight), Forest & ecology, Demography',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: ['c_fiscal_fed'],
        relatedIds: ['c_gst_council', 'c_fiscal_fed'],
        tags: ['Economy', 'Finance Commission', 'Devolution'],
      },
      {
        id: 'c_mpc',
        subjectId: 'sub_economy',
        topicId: 'top_monetary',
        title: 'Monetary Policy Committee (MPC)',
        summary: 'Statutory 6-member body under RBI Act 1934 responsible for setting policy repo rate to target inflation.',
        explanation: 'Formed following Urjit Patel Committee recommendations. Consists of 6 members: 3 from RBI (including Governor with casting vote) and 3 external experts appointed by Govt. Meets at least 4 times a year to maintain Flexible Inflation Targeting (4% +/- 2%).',
        examples: ['MPC keeping Repo rate unchanged at 6.5% to curb food inflation'],
        keyPoints: [
          'Statutory body under RBI Act 1934 (amended 2016)',
          '6 members (3 RBI + 3 Govt appointees)',
          'Target: Consumer Price Index (CPI) at 4% +/- 2%',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: ['c_inflation'],
        tags: ['Economy', 'RBI', 'Monetary Policy'],
      },
      {
        id: 'c_inflation',
        subjectId: 'sub_economy',
        topicId: 'top_monetary',
        title: 'Inflation Mechanics & CPI vs WPI',
        summary: 'Sustained rise in general price level. Difference between Consumer Price Index (retail) and Wholesale Price Index.',
        explanation: 'Inflation erodes purchasing power. CPI measures retail prices paid by consumers (released by NSO, MoSPI), while WPI measures bulk prices at wholesale level (released by Office of Economic Adviser, DPIIT). MPC uses CPI Combined for policy rates.',
        examples: ['Headline CPI inflation vs Core Inflation (excluding food and energy)'],
        keyPoints: [
          'CPI includes services; WPI DOES NOT include services',
          'CPI weightage: Food & Beverages ~45.8%',
          'Base year CPI = 2012, Base year WPI = 2011-12',
        ],
        difficulty: 'BEGINNER',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: ['c_mpc'],
        tags: ['Economy', 'Inflation', 'CPI', 'WPI'],
      },
      {
        id: 'c_harappan',
        subjectId: 'sub_history',
        topicId: 'top_ancient',
        title: 'Harappan Civilization (Indus Valley)',
        summary: 'Bronze Age urban civilization known for grid town planning, drainage systems, and maritime trade.',
        explanation: 'Flourished around 2500–1900 BCE. Major sites: Harappa (Ravi), Mohenjo-daro (Indus), Lothal (Dockyard in Gujarat), Dholavira (Water reservoir, UNESCO site), Kalibangan (Ploughed field). Known for steatite seals, bronze dancing girl, terracotta figurines.',
        examples: ['Lothal artificial dockyard for Mesopotamian trade'],
        keyPoints: [
          'Grid pattern layout with baked bricks',
          'No temples or monarchical palaces found',
          'Script is pictographic and undeciphered (boustrophedon)',
        ],
        difficulty: 'BEGINNER',
        importance: 'MEDIUM',
        prerequisiteIds: [],
        relatedIds: [],
        tags: ['History', 'Ancient', 'IVC'],
      },
      {
        id: 'c_non_coop',
        subjectId: 'sub_history',
        topicId: 'top_modern',
        title: 'Non-Cooperation Movement (1920-1922)',
        summary: 'First mass movement led by Mahatma Gandhi combining Rowlatt Satyagraha and Khilafat issue.',
        explanation: 'Launched in 1920 following Jallianwala Bagh massacre and Khilafat agitation. Involved surrender of titles, boycott of government schools, courts, and foreign cloth. Withdrawn in Feb 1922 following violent Chauri Chaura incident.',
        examples: ['Boycott of Prince of Wales visit in 1921', 'Establishment of Jamia Millia Islamia and Kashi Vidyapith'],
        keyPoints: [
          'Nagpur Session 1920 adopted Congress goal of Swaraj',
          'Surrender of titles (Gandhi returned Kaiser-i-Hind)',
          'Abruptly called off after Chauri Chaura violence',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: [],
        tags: ['History', 'Freedom Movement', 'Gandhi'],
      },
      {
        id: 'c_western_ghats',
        subjectId: 'sub_geography',
        topicId: 'top_env',
        title: 'Western Ghats Biodiversity & Ecology',
        summary: 'Global biodiversity hotspot running parallel to western coast. Key ecological committees: Gadgil vs Kasturirangan.',
        explanation: 'Continuous mountain chain older than Himalayas. UNESCO World Heritage site. Home to endemic species like Lion-tailed Macaque, Nilgiri Tahr. Madhav Gadgil Committee recommended 100% Ecologically Sensitive Area (ESA), while Kasturirangan Committee reduced ESA to 37%.',
        examples: ['Silent Valley National Park conservation movement'],
        keyPoints: [
          'Runs through 6 States (Gujarat to Tamil Nadu)',
          'Gadgil Committee (WGEEP) vs Kasturirangan Committee',
          'High endemic flora and fauna species',
        ],
        difficulty: 'INTERMEDIATE',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: [],
        tags: ['Geography', 'Environment', 'Western Ghats'],
      },
      {
        id: 'c_preamble',
        subjectId: 'sub_polity',
        topicId: 'top_const',
        title: 'Preamble to the Indian Constitution',
        summary: 'Key to the minds of the framers. Based on Nehru’s Objectives Resolution.',
        explanation: 'The Preamble serves as an introduction. Declares India to be a "SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC". Amended only ONCE by 42nd Amendment Act 1976 (added Socialist, Secular, Integrity). In Kesavananda Bharati case (1973), SC held Preamble IS part of Constitution.',
        examples: ['42nd Amendment adding Socialist, Secular, Integrity'],
        keyPoints: [
          'Based on Jawaharlal Nehru’s Objectives Resolution (1946)',
          'Part of Constitution (Kesavananda Bharati Case)',
          'Amended once in 1976',
        ],
        difficulty: 'BEGINNER',
        importance: 'HIGH',
        prerequisiteIds: [],
        relatedIds: ['c_art21'],
        tags: ['Polity', 'Preamble'],
      },
    ];
    concepts.forEach(c => this.concepts.set(c.id, c));

    // 5. Seed Relationships
    this.relationships = [
      { sourceId: 'c_art32', targetId: 'c_art226', relationType: 'contrast' },
      { sourceId: 'c_art21', targetId: 'c_art32', relationType: 'application' },
      { sourceId: 'c_fiscal_fed', targetId: 'c_fin_comm', relationType: 'parent_child' },
      { sourceId: 'c_fiscal_fed', targetId: 'c_gst_council', relationType: 'related' },
      { sourceId: 'c_fin_comm', targetId: 'c_gst_council', relationType: 'contrast' },
      { sourceId: 'c_mpc', targetId: 'c_inflation', relationType: 'application' },
    ];

    // 6. Seed Learner Mastery for Demo User
    const demoMastery: ConceptMastery[] = [
      {
        conceptId: 'c_art21',
        understanding: 92,
        retention: 85,
        application: 88,
        accuracy: 90,
        confidence: 85,
        overallMastery: 88,
        attemptsCount: 12,
        correctCount: 11,
        incorrectCount: 1,
        lastStudiedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        timeSpentSeconds: 1450,
      },
      {
        conceptId: 'c_art32',
        understanding: 78,
        retention: 65,
        application: 60,
        accuracy: 68,
        confidence: 90, // OVERCONFIDENT vs 68% accuracy!
        overallMastery: 68,
        attemptsCount: 10,
        correctCount: 7,
        incorrectCount: 3,
        lastStudiedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // REVISION OVERDUE!
        confusionPartners: ['c_art226'],
        timeSpentSeconds: 980,
      },
      {
        conceptId: 'c_art226',
        understanding: 72,
        retention: 58,
        application: 55,
        accuracy: 60,
        confidence: 82,
        overallMastery: 61,
        attemptsCount: 8,
        correctCount: 5,
        incorrectCount: 3,
        lastStudiedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // REVISION OVERDUE
        confusionPartners: ['c_art32'],
        timeSpentSeconds: 820,
      },
      {
        conceptId: 'c_fiscal_fed',
        understanding: 65,
        retention: 52,
        application: 45,
        accuracy: 50,
        confidence: 60,
        overallMastery: 52,
        attemptsCount: 6,
        correctCount: 3,
        incorrectCount: 3,
        lastStudiedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // HIGH PRIORITY REVISION
        confusionPartners: ['c_fin_comm', 'c_gst_council'],
        timeSpentSeconds: 1100,
      },
      {
        conceptId: 'c_fin_comm',
        understanding: 70,
        retention: 60,
        application: 58,
        accuracy: 62,
        confidence: 75,
        overallMastery: 62,
        attemptsCount: 5,
        correctCount: 3,
        incorrectCount: 2,
        lastStudiedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(),
        confusionPartners: ['c_gst_council'],
        timeSpentSeconds: 600,
      },
      {
        conceptId: 'c_gst_council',
        understanding: 68,
        retention: 55,
        application: 50,
        accuracy: 55,
        confidence: 70,
        overallMastery: 57,
        attemptsCount: 6,
        correctCount: 3,
        incorrectCount: 3,
        lastStudiedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        confusionPartners: ['c_fin_comm'],
        timeSpentSeconds: 710,
      },
      {
        conceptId: 'c_mpc',
        understanding: 88,
        retention: 82,
        application: 85,
        accuracy: 86,
        confidence: 85,
        overallMastery: 85,
        attemptsCount: 14,
        correctCount: 12,
        incorrectCount: 2,
        lastStudiedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        timeSpentSeconds: 1200,
      },
      {
        conceptId: 'c_inflation',
        understanding: 85,
        retention: 80,
        application: 82,
        accuracy: 84,
        confidence: 80,
        overallMastery: 83,
        attemptsCount: 10,
        correctCount: 8,
        incorrectCount: 2,
        lastStudiedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        lastReviewedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        nextReviewDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
        timeSpentSeconds: 900,
      },
    ];

    demoMastery.forEach(m => this.mastery.set(`usr_demo_${m.conceptId}`, m));

    // 7. Seed Learner Model for Demo User
    const demoLearnerModel: LearnerModel = {
      userId: 'usr_demo',
      overallScore: 71,
      totalStudyTimeMinutes: 1420,
      currentStreak: 6,
      highestStreak: 12,
      activeDaysCount: 18,
      confidenceBias: 'OVERCONFIDENT',
      mistakeBreakdown: {
        CONCEPT_CONFUSION: 6,
        RECALL_FAILURE: 4,
        CONCEPT_GAP: 3,
        CARELESS_ERROR: 2,
        MISINTERPRETATION: 1,
        TIME_PRESSURE: 1,
      },
      subjectMastery: {
        sub_polity: 68,
        sub_economy: 71,
        sub_history: 55,
        sub_geography: 62,
        sub_ca: 75,
      },
      masteredConceptsCount: 3,
      weakConceptsCount: 4,
      dueRevisionCount: 4,
      lastUpdated: new Date().toISOString(),
    };
    this.learnerModels.set('usr_demo', demoLearnerModel);

    // 8. Seed Questions (With PYQ provenance & verification flags)
    const questions: Question[] = [
      {
        id: 'q1',
        subjectId: 'sub_polity',
        topicId: 'top_judiciary',
        conceptId: 'c_art32',
        type: 'MCQ',
        question: 'Which of the following statements regarding Article 32 of the Indian Constitution is/are CORRECT?\n1. It is a fundamental right to move the Supreme Court directly.\n2. The Supreme Court can issue writs for enforcement of both fundamental rights and statutory rights.\n3. Article 32 cannot be suspended under any circumstances.',
        options: [
          { id: 'opt1', text: '1 only' },
          { id: 'opt2', text: '1 and 2 only' },
          { id: 'opt3', text: '1 and 3 only' },
          { id: 'opt4', text: '1, 2 and 3' },
        ],
        correctAnswer: 'opt1',
        explanation: 'Statement 1 is CORRECT: Article 32 itself is a Fundamental Right in Part III.\nStatement 2 is INCORRECT: SC writ jurisdiction under Art 32 is strictly limited to Fundamental Rights (High Court under Art 226 can issue for statutory/legal rights).\nStatement 3 is INCORRECT: Article 32 can be suspended during a National Emergency by Presidential order under Article 359 (except Arts 20 and 21).',
        difficulty: 'HARD',
        examTag: 'UPSC CSE 2023 PYQ',
        pyqYear: 2023,
        exam: 'UPSC CSE',
        paper: 'GS Paper I',
        questionNumber: 42,
        isPyq: true,
        source: 'Official UPSC CSE 2023 Prelims Question Paper',
        verifiedStatus: 'VERIFIED_PYQ',
        isPublished: true,
        status: 'PUBLISHED',
      },
      {
        id: 'q2',
        subjectId: 'sub_polity',
        topicId: 'top_judiciary',
        conceptId: 'c_art226',
        type: 'MCQ',
        question: 'With reference to High Court writ jurisdiction under Article 226, consider the following statements:\n1. It is broader in scope than the Supreme Court’s writ jurisdiction under Article 32.\n2. A citizen can claim writ remedy under Article 226 as a guaranteed fundamental right.',
        options: [
          { id: 'opt_a', text: '1 only' },
          { id: 'opt_b', text: '2 only' },
          { id: 'opt_c', text: 'Both 1 and 2' },
          { id: 'opt_d', text: 'Neither 1 nor 2' },
        ],
        correctAnswer: 'opt_a',
        explanation: 'Statement 1 is CORRECT: Article 226 covers Fundamental Rights AND any other legal purpose.\nStatement 2 is INCORRECT: The right to move High Court under Article 226 is a constitutional remedy, but NOT a Fundamental Right itself (Article 32 IS a Fundamental Right).',
        difficulty: 'MEDIUM',
        examTag: 'UPSC CSE 2021 PYQ',
        pyqYear: 2021,
        exam: 'UPSC CSE',
        paper: 'GS Paper I',
        questionNumber: 18,
        isPyq: true,
        source: 'Official UPSC CSE 2021 Prelims Question Paper',
        verifiedStatus: 'VERIFIED_PYQ',
        isPublished: true,
        status: 'PUBLISHED',
      },
      {
        id: 'q3',
        subjectId: 'sub_polity',
        topicId: 'top_federalism',
        conceptId: 'c_gst_council',
        type: 'MCQ',
        question: 'Consider the following statements regarding the GST Council:\n1. The Union Finance Minister is the Chairman of the Council.\n2. Every decision of the Council is taken by a majority of not less than two-thirds of weighted votes.\n3. The Centre has a weightage of one-third of the total votes cast.',
        options: [
          { id: '1', text: '1 and 3 only' },
          { id: '2', text: '1 and 2 only' },
          { id: '3', text: '2 and 3 only' },
          { id: '4', text: '1, 2 and 3' },
        ],
        correctAnswer: '1',
        explanation: 'Statement 1 is CORRECT: Union Finance Minister chairs the Council.\nStatement 2 is INCORRECT: Decisions require a majority of not less than THREE-FOURTHS (75%) of weighted votes, not 2/3rd.\nStatement 3 is CORRECT: Union Govt vote weight = 1/3rd, All State Govts combined weight = 2/3rd.',
        difficulty: 'HARD',
        examTag: 'UPSC CSE 2022',
        pyqYear: 2022,
        exam: 'UPSC CSE',
        paper: 'GS Paper I',
        questionNumber: 65,
        isPyq: true,
        source: 'Official UPSC CSE 2022 Prelims Question Paper',
        verifiedStatus: 'VERIFIED_PYQ',
        isPublished: true,
        status: 'PUBLISHED',
      },
      {
        id: 'q4',
        subjectId: 'sub_economy',
        topicId: 'top_fiscal',
        conceptId: 'c_fin_comm',
        type: 'MCQ',
        question: 'Which of the following is/are the criteria used by the 15th Finance Commission for horizontal tax devolution among States?\n1. Income Distance\n2. Forest and Ecology\n3. Demographic Performance\n4. Tax and Fiscal Efforts',
        options: [
          { id: 'a', text: '1 and 2 only' },
          { id: 'b', text: '1, 2 and 3 only' },
          { id: 'c', text: '2, 3 and 4 only' },
          { id: 'd', text: '1, 2, 3 and 4' },
        ],
        correctAnswer: 'd',
        explanation: 'All 4 criteria were included by the 15th Finance Commission:\n1. Income Distance (45%)\n2. Forest & Ecology (10%)\n3. Demographic Performance (12.5%)\n4. Tax & Fiscal Efforts (2.5%)\n5. Area (15%), Population 2011 (15%).',
        difficulty: 'MEDIUM',
        examTag: 'UPSC CSE 2020',
        pyqYear: 2020,
        isPublished: true,
      },
      {
        id: 'q5',
        subjectId: 'sub_economy',
        topicId: 'top_monetary',
        conceptId: 'c_mpc',
        type: 'MCQ',
        question: 'Which of the following bodies sets the Repo Rate in India under the Flexible Inflation Targeting framework?',
        options: [
          { id: '1', text: 'RBI Governor unilaterally' },
          { id: '2', text: 'Monetary Policy Committee (MPC)' },
          { id: '3', text: 'Financial Stability and Development Council (FSDC)' },
          { id: '4', text: 'Ministry of Finance' },
        ],
        correctAnswer: '2',
        explanation: 'The 6-member Monetary Policy Committee (MPC) constituted under section 45ZB of the amended RBI Act, 1934 determines the policy repo rate required to achieve the inflation target.',
        difficulty: 'EASY',
        examTag: 'BPSC Prelims 2023',
        pyqYear: 2023,
        isPublished: true,
      },
      {
        id: 'q6',
        subjectId: 'sub_history',
        topicId: 'top_ancient',
        conceptId: 'c_harappan',
        type: 'MCQ',
        question: 'Which of the following Indus Valley site is famous for having an artificial brick dockyard connected to the Sabarmati river basin?',
        options: [
          { id: 'l1', text: 'Kalibangan' },
          { id: 'l2', text: 'Lothal' },
          { id: 'l3', text: 'Dholavira' },
          { id: 'l4', text: 'Surkotada' },
        ],
        correctAnswer: 'l2',
        explanation: 'Lothal in Gujarat had a tidal dockyard, indicating active maritime trade with Mesopotamia and Persian Gulf.',
        difficulty: 'EASY',
        examTag: 'SSC CGL 2022',
        pyqYear: 2022,
        isPublished: true,
      },
      {
        id: 'q7',
        subjectId: 'sub_geography',
        topicId: 'top_env',
        conceptId: 'c_western_ghats',
        type: 'MCQ',
        question: 'The Madhav Gadgil Committee and Kasturirangan Committee, frequently seen in news, are associated with:',
        options: [
          { id: 'g1', text: 'Reforms in Higher Education' },
          { id: 'g2', text: 'Protection and zoning of Western Ghats Ecology' },
          { id: 'g3', text: 'Review of Armed Forces Special Powers Act' },
          { id: 'g4', text: 'Banking governance reforms' },
        ],
        correctAnswer: 'g2',
        explanation: 'Both WGEEP (Gadgil) and Kasturirangan panel were formed by Ministry of Environment to designate Ecologically Sensitive Areas (ESA) in Western Ghats.',
        difficulty: 'EASY',
        examTag: 'UPSC CSE 2016',
        pyqYear: 2016,
        isPublished: true,
      },
    ];
    questions.forEach(q => this.questions.set(q.id, q));

    // 9. Seed Mock Tests
    const mock1: MockTest = {
      id: 'mock_quick_1',
      title: 'Polity & Economy Adaptive Sprint',
      type: 'QUICK',
      subjectIds: ['sub_polity', 'sub_economy'],
      durationMinutes: 15,
      totalQuestions: 10,
      totalMarks: 20,
      negativeMarkingRate: 0.66,
      isPublished: true,
    };

    const mock2: MockTest = {
      id: 'mock_subj_polity',
      title: 'Indian Polity Sectional Mock Test',
      type: 'SUBJECT',
      subjectIds: ['sub_polity'],
      durationMinutes: 45,
      totalQuestions: 30,
      totalMarks: 60,
      negativeMarkingRate: 0.66,
      isPublished: true,
    };

    const mock3: MockTest = {
      id: 'mock_full_upsc',
      title: 'UPSC General Studies Paper-I Full Length Mock',
      type: 'FULL',
      subjectIds: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography', 'sub_ca'],
      durationMinutes: 120,
      totalQuestions: 100,
      totalMarks: 200,
      negativeMarkingRate: 0.66,
      isPublished: true,
    };
    [mock1, mock2, mock3].forEach(m => this.mockTests.set(m.id, m));

    // 10. Seed Current Affairs (Source-backed with full provenance)
    const ca1: CurrentAffairArticle = {
      id: 'ca_1',
      title: 'Supreme Court Clarifies Limits of Advisory Judgments & Article 226 Writ Powers',
      date: '2026-08-10',
      category: 'Polity & Governance',
      subtopic: 'Judicial Oversight & Writs',
      summary: 'A 5-judge Constitution Bench reaffirmed that High Court writ jurisdiction under Article 226 cannot be used to pass general policy advisories to state legislatures without concrete cause of action.',
      background: 'High Court issued directions to State govt on police reforms without specific petitioner injury.',
      keyFacts: [
        'Art 226 empowers High Courts for Fundamental Rights and other legal rights.',
        'High Court remedies are discretionary and require clear locus standi or genuine PIL grounds.',
        'Contrast with SC Article 32 which is itself a Fundamental Right.',
      ],
      prelimsRelevance: 'Writ jurisdiction differences between SC (Art 32) and High Court (Art 226).',
      mainsRelevance: 'Judicial activism vs Judicial overreach in state policymaking (GS Paper II).',
      relatedSubject: 'Indian Polity & Governance',
      relatedConceptIds: ['c_art32', 'c_art226'],
      keywords: ['Supreme Court', 'Article 226', 'Article 32', 'PIL', 'Judicial Review'],
      source: 'Press Information Bureau / Supreme Court Digest',
      sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1982341',
      sourceType: 'PRIMARY_GOVT',
      publishedAt: '2026-08-10T10:30:00Z',
      retrievedAt: '2026-08-11T04:00:00Z',
      isPublished: true,
    };

    const ca2: CurrentAffairArticle = {
      id: 'ca_2',
      title: '16th Finance Commission Initiates State Consultations on Devolution Criteria',
      date: '2026-08-08',
      category: 'Economy',
      subtopic: 'Fiscal Federalism',
      summary: 'Chairman Dr. Arvind Panagariya announced that the 16th FC will evaluate demographic performance vs income distance weights amidst coastal vs interior state debates.',
      background: 'Southern states requested higher weightage for demographic management (TFR) while northern states highlighted population pressure.',
      keyFacts: [
        'Article 280 governs Finance Commission constitution.',
        '15th FC allocated 41% vertical devolution to States.',
        'Horizontal criteria include Income Distance, Forest Cover, Demography, and Fiscal effort.',
      ],
      prelimsRelevance: 'Constitutional provisions of Article 280, vertical vs horizontal devolution.',
      mainsRelevance: 'Fiscal federalism friction between Union and States (GS Paper II & III).',
      relatedSubject: 'Indian Economy',
      relatedConceptIds: ['c_fiscal_fed', 'c_fin_comm', 'c_gst_council'],
      keywords: ['Finance Commission', 'Article 280', 'Horizontal Devolution', 'Income Distance', 'Fiscal Federalism'],
      source: 'Press Information Bureau (PIB Delhi)',
      sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=1985420',
      sourceType: 'PRIMARY_GOVT',
      publishedAt: '2026-08-08T14:15:00Z',
      retrievedAt: '2026-08-11T04:00:00Z',
      isPublished: true,
    };

    const ca3: CurrentAffairArticle = {
      id: 'ca_3',
      title: 'RBI Monetary Policy Committee Keeps Repo Rate at 6.50% with Focus on Inflation Alignment',
      date: '2026-08-06',
      category: 'Economy',
      subtopic: 'Monetary Policy',
      summary: 'The Monetary Policy Committee (MPC) unanimously decided to keep the policy repo rate unchanged at 6.50% to ensure inflation aligns with the target of 4% while supporting growth.',
      background: 'Food inflation volatility driven by unseasonal rainfall led MPC to maintain stance of withdrawal of accommodation.',
      keyFacts: [
        'MPC is a statutory body under Section 45ZB of RBI Act 1934.',
        'Consists of 6 members (3 from RBI, 3 appointed by Central Govt).',
        'Inflation target is 4% (+/- 2%) based on CPI.',
      ],
      prelimsRelevance: 'MPC composition, RBI Act 1934 provisions, Repo rate transmission.',
      mainsRelevance: 'Inflation management and monetary-fiscal policy coordination (GS Paper III).',
      relatedSubject: 'Indian Economy',
      relatedConceptIds: ['c_mpc', 'c_inflation'],
      keywords: ['RBI', 'MPC', 'Repo Rate', 'Inflation Targeting', 'Monetary Policy'],
      source: 'Reserve Bank of India Bulletin',
      sourceUrl: 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx?prid=58102',
      sourceType: 'OFFICIAL_PORTAL',
      publishedAt: '2026-08-06T09:00:00Z',
      retrievedAt: '2026-08-11T04:00:00Z',
      isPublished: true,
    };

    const ca4: CurrentAffairArticle = {
      id: 'ca_4',
      title: 'ISRO Announces Next Generation Launch Vehicle (NGLV) Architecture for Heavy Payload Capabilities',
      date: '2026-08-02',
      category: 'Science & Tech',
      subtopic: 'Space Science',
      summary: 'ISRO has finalized the design parameters for NGLV (Soorya), featuring semi-cryogenic propulsion designed to carry up to 20 tonnes to Low Earth Orbit (LEO).',
      background: 'Transitioning from LVM3 to modular re-usable rocket architectures to reduce launch cost per kg.',
      keyFacts: [
        'NGLV uses semi-cryogenic engine utilizing refined kerosene (Isrosene) and liquid oxygen.',
        'Modular design with reusable first stage.',
        'Enables Indian Space Station (Bharatiya Antariksha Station) construction by 2035.',
      ],
      prelimsRelevance: 'Semi-cryogenic vs Cryogenic engines, ISRO missions, LEO payload limits.',
      mainsRelevance: 'Indigenous technology development and space commercialization (GS Paper III).',
      relatedSubject: 'Science & Technology',
      relatedConceptIds: ['c_space_tech'],
      keywords: ['ISRO', 'NGLV', 'Semi-cryogenic', 'Bharatiya Antariksha Station', 'Space Tech'],
      source: 'Department of Space / ISRO Official Release',
      sourceUrl: 'https://isro.gov.in/press-release-nglv-architecture.html',
      sourceType: 'PRIMARY_GOVT',
      publishedAt: '2026-08-02T11:00:00Z',
      retrievedAt: '2026-08-11T04:00:00Z',
      isPublished: true,
    };

    [ca1, ca2, ca3, ca4].forEach(ca => this.currentAffairs.set(ca.id, ca));

    // 11. Seed Learning Resources
    const res1: LearningResource = {
      id: 'res_1',
      title: 'Constitutional Law Handbook: Fundamental Rights & Writs Summary',
      type: 'PDF',
      subjectId: 'sub_polity',
      conceptId: 'c_art32',
      url: 'https://example.com/polity_writs.pdf',
      summary: 'Comprehensive 12-page breakdown comparing SC Art 32 and HC Art 226 with landmark precedent case tables.',
      readTimeMinutes: 15,
      examTag: 'UPSC CSE / BPSC',
      isBookmarked: true,
    };

    const res2: LearningResource = {
      id: 'res_2',
      title: 'Monetary Policy Committee & RBI Liquidity Framework Notes',
      type: 'NOTE',
      subjectId: 'sub_economy',
      conceptId: 'c_mpc',
      url: 'https://example.com/mpc_notes',
      summary: 'Analytical primer on repo, reverse repo, MSF, SDF, and CPI inflation targeting equations.',
      readTimeMinutes: 10,
      examTag: 'UPSC CSE',
      isBookmarked: false,
    };
    [res1, res2].forEach(r => this.resources.set(r.id, r));

    // 12. Seed Goals
    const goal1: StudyGoal = {
      id: 'goal_1',
      userId: 'usr_demo',
      title: 'Crack UPSC Civil Services Prelims 2026',
      targetExam: 'UPSC CSE 2026',
      targetDate: '2026-05-24',
      dailyStudyMinutes: 120,
      subjects: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography'],
      status: 'ACTIVE',
      progressPercentage: 64,
    };
    this.goals.set(goal1.id, goal1);

    // 13. Seed Notifications
    this.notifications.set('usr_demo', [
      {
        id: 'n1',
        title: 'Revision Due Notice',
        message: '4 concepts (including Article 32 and Fiscal Federalism) are due for revision based on your retention decay curve.',
        type: 'REVISION',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionUrl: '/revision',
      },
      {
        id: 'n2',
        title: 'Overconfidence Warning Detected',
        message: 'IKSHOVIA detected that your confidence on Article 32 (90%) is higher than your accuracy (68%). Practice application questions to align assessment.',
        type: 'INSIGHT',
        timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        isRead: false,
        actionUrl: '/analytics',
      },
      {
        id: 'n3',
        title: 'Streak Multiplier Active! 🔥',
        message: 'You are on a 6-day study streak. Keep up the 120 min daily focus goal today.',
        type: 'STREAK',
        timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        isRead: true,
      },
    ]);
  }
}

export const db = new IKSHOVIADatabase();
