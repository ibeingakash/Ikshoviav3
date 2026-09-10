import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from './pool.js';
import { generateMultiPagePdf, PdfPageContent } from '../services/pdfGenerator.js';

interface SeedItem {
  id: string;
  title: string;
  author: string;
  description: string;
  subject: string;
  subject_id: string;
  topic: string;
  exam: string;
  resource_type: string;
  visibility: string;
  status: string;
  read_time_minutes: number;
  tags: string[];
  pages: PdfPageContent[];
}

export const CANONICAL_SEED_RESOURCES: SeedItem[] = [
  {
    id: 'res_polity_laxmikanth',
    title: 'Indian Polity & Constitutional Framework',
    author: 'M. Laxmikanth',
    description:
      'Standard civil services foundation text analyzing the Preamble, Fundamental Rights (Articles 12-35), Directive Principles of State Policy (Articles 36-51), Fundamental Duties, and the landmark Basic Structure Doctrine.',
    subject: 'Indian Polity',
    subject_id: 'sub_polity',
    topic: 'Fundamental Rights & Constitutional Governance',
    exam: 'UPSC CSE',
    resource_type: 'BOOK',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    read_time_minutes: 120,
    tags: ['Prelims Core', 'Mains GS-II', 'Constitution', 'Fundamental Rights'],
    pages: [
      {
        pageNumber: 1,
        title: 'Historical Background of the Indian Constitution',
        chapter: 'Chapter 1: Historical Evolution',
        content: [
          'The Indian Constitution has deep roots in the British colonial administrative architecture. The Regulating Act of 1773 was the first step taken by the British Government to control and regulate the affairs of the East India Company in India.',
          'Key landmark legislations include the Charter Act of 1833 which centralized legislation under the Governor-General of India (Lord William Bentinck), and the Government of India Act 1858 which transferred power directly to the British Crown following the 1857 Sepoy Mutiny.',
          'The Government of India Act 1935 laid the structural foundation of federalism, introducing provincial autonomy, bicameralism in six provinces, three legislative lists (Federal, Provincial, Concurrent), and the Federal Court.',
        ],
      },
      {
        pageNumber: 6,
        title: 'Preamble & Sovereign Philosophy',
        chapter: 'Chapter 2: Preamble',
        content: [
          'The Preamble to the Indian Constitution is based on the Objective Resolution introduced by Pandit Jawaharlal Nehru on December 13, 1946, and adopted unanimously on January 22, 1947.',
          'It declares India to be a SOVEREIGN, SOCIALIST, SECULAR, DEMOCRATIC REPUBLIC and secures to all citizens JUSTICE (social, economic, and political), LIBERTY of thought, expression, belief, faith and worship, EQUALITY of status and opportunity, and FRATERNITY.',
          'In Kesavananda Bharati v. State of Kerala (1973), the Supreme Court held that the Preamble is an integral part of the Constitution and can be amended under Article 368 without altering the Basic Structure. The 42nd Amendment Act (1976) added the words Socialist, Secular, and Integrity.',
        ],
      },
      {
        pageNumber: 14,
        title: 'Fundamental Rights: Articles 14 to 18 (Right to Equality)',
        chapter: 'Chapter 3: Fundamental Rights',
        content: [
          'Part III of the Constitution (Articles 12 to 35) is termed the Magna Carta of India. Fundamental Rights are justifiable, guaranteed against state actions, and defended directly by the Supreme Court under Article 32.',
          'Article 14 guarantees Equality before the Law (British concept, negative in connotation) and Equal Protection of the Laws (American concept, positive connotation). Reasonable classification is permitted, but class legislation is prohibited.',
          'Article 15 prohibits discrimination on grounds only of religion, race, caste, sex, or place of birth. Article 16 guarantees equality of opportunity in public employment. Article 17 abolishes untouchability, and Article 18 abolishes titles except military and academic distinctions.',
        ],
      },
      {
        pageNumber: 21,
        title: 'Right to Freedom: Articles 19 to 22 & Article 21 Expansion',
        chapter: 'Chapter 3: Fundamental Rights',
        content: [
          'Article 19(1) guarantees six democratic freedoms: speech and expression, assembly peacefully without arms, association/unions/cooperative societies, free movement, residence anywhere, and practice of any profession. These are subject to reasonable restrictions under Article 19(2)-(6).',
          'Article 20 protects against ex-post facto criminal laws, double jeopardy (no prosecution twice for same offense), and self-incrimination.',
          'Article 21 declares: No person shall be deprived of his life or personal liberty except according to procedure established by law. In Maneka Gandhi v. Union of India (1978), the Supreme Court interpreted this to mean Due Process of Law, ruling that the procedure must be just, fair, and reasonable. In K.S. Puttaswamy (2017), the Right to Privacy was declared an intrinsic part of Article 21.',
        ],
      },
      {
        pageNumber: 28,
        title: 'Constitutional Remedies & Writs (Article 32)',
        chapter: 'Chapter 4: Right to Constitutional Remedies',
        content: [
          'Dr. B.R. Ambedkar famously called Article 32 the very heart and soul of the Constitution. It confers the right to move the Supreme Court by appropriate proceedings for the enforcement of Fundamental Rights.',
          'The five prerogative writs are: 1. Habeas Corpus (To have the body of - against illegal detention); 2. Mandamus (We command - compelling a public official to perform statutory duties); 3. Prohibition (Issued by higher court to lower court preventing jurisdictional excess); 4. Certiorari (To be certified - quashing orders of inferior courts/tribunals); 5. Quo-Warranto (By what authority - challenging illegal usurpation of public office).',
          'Article 226 gives High Courts wider writ jurisdiction, extending to fundamental rights as well as ordinary legal rights.',
        ],
      },
      {
        pageNumber: 35,
        title: 'Directive Principles of State Policy (Articles 36 to 51)',
        chapter: 'Chapter 5: DPSP & Welfare State',
        content: [
          'Borrowed from the Irish Constitution, DPSPs are non-justiciable directives guiding governance towards socio-economic democracy and a welfare state.',
          'Classified into: 1. Socialistic Principles (Art 38 welfare promotion, Art 39 equitable distribution of resources, Art 39A equal justice and free legal aid); 2. Gandhian Principles (Art 40 Village Panchayats, Art 43 cottage industries, Art 46 SC/ST educational interests, Art 47 prohibition of intoxicating drinks); 3. Liberal-Intellectual Principles (Art 44 Uniform Civil Code, Art 45 early childhood care, Art 48 agriculture/animal husbandry, Art 48A environment protection, Art 50 separation of judiciary from executive, Art 51 international peace).',
          'In Minerva Mills (1980), the Supreme Court held that the Indian Constitution is founded on the bedrock of the balance between Part III (Fundamental Rights) and Part IV (DPSPs).',
        ],
      },
      {
        pageNumber: 42,
        title: 'Basic Structure Doctrine & Amendment Power (Article 368)',
        chapter: 'Chapter 6: Constitutional Amendment',
        content: [
          'Article 368 in Part XX empowers Parliament to amend the Constitution by special majority (2/3 present & voting + majority of total membership) or special majority with ratification by half of the states.',
          'In Shankari Prasad (1951) and Sajjan Singh (1965), Parliament’s amending power was held unlimited. In Golak Nath (1967), the Court reversed this, declaring Fundamental Rights could not be abridged.',
          'The landmark 13-judge bench in Kesavananda Bharati (1973) formulated the Basic Structure Doctrine: Parliament can amend any part of the Constitution including Fundamental Rights, provided the basic structure (Supremacy of Constitution, Republican & Democratic nature, Secularism, Federalism, Judicial Review) remains intact.',
        ],
      },
    ],
  },
  {
    id: 'res_modern_history_chandra',
    title: 'Modern Indian History & Freedom Struggle',
    author: 'Bipin Chandra',
    description:
      'Comprehensive analytical review of the British colonial exploitation, socio-religious renaissance, the Revolt of 1857, early political nationalism, Moderate and Extremist phases, and Gandhian mass satyagrahas.',
    subject: 'Modern History',
    subject_id: 'sub_history',
    topic: 'Indian National Movement (1857-1947)',
    exam: 'ALL',
    resource_type: 'BOOK',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    read_time_minutes: 130,
    tags: ['Prelims Core', 'Mains GS-I', 'Modern India', 'National Movement'],
    pages: [
      {
        pageNumber: 1,
        title: 'British Conquest & Colonial Exploitation Mechanisms',
        chapter: 'Chapter 1: Colonial Expansion',
        content: [
          'The Battle of Plassey (1757) and Battle of Buxar (1764) established British territorial sovereignty over Bengal, Bihar, and Orissa with the grant of Diwani rights by Mughal Emperor Shah Alam II.',
          'Colonial agrarian systems extracted heavy surplus: The Permanent Settlement of Bengal (1793, Lord Cornwallis), Ryotwari System in Madras and Bombay (Thomas Munro), and Mahalwari System in North-Western provinces (Holt Mackenzie).',
          'Dadabhai Naoroji in Poverty and Un-British Rule in India formulated the Drain of Wealth theory, demonstrating how Indian revenue was siphoned through Home Charges, capital interest, and unrequited exports.',
        ],
      },
      {
        pageNumber: 12,
        title: 'The Great Revolt of 1857: Nature, Causes & Impact',
        chapter: 'Chapter 2: The 1857 Uprising',
        content: [
          'The 1857 revolt erupted on May 10, 1857, in Meerut after the hanging of Mangal Pandey at Barrackpore over the greased cartridge controversy (Enfield Rifle).',
          'Deep causes included political annexations under Dalhousie’s Doctrine of Lapse (Satara, Jhansi, Nagpur, Sambalpur) and annexation of Awadh (1856) on grounds of misgovernance.',
          'Major centers & leaders: Delhi (Bahadur Shah Zafar, General Bakht Khan), Kanpur (Nana Saheb, Tatya Tope), Lucknow (Begum Hazrat Mahal), Jhansi (Rani Laxmibai), and Jagdishpur/Bihar (Babu Veer Kunwar Singh). Queen Victoria’s Proclamation of 1858 ended Company rule.',
        ],
      },
      {
        pageNumber: 24,
        title: 'Foundation of Congress (1885) & The Moderate Phase',
        chapter: 'Chapter 3: Early Nationalism',
        content: [
          'The Indian National Congress was founded in December 1885 at Gokuldas Tejpal Sanskrit College in Bombay, convened by retired civil servant Allan Octavian Hume. Womesh Chandra Bonnerjee was the first President.',
          'The Moderates (1885-1905) included Dadabhai Naoroji, Gopal Krishna Gokhale, Pherozeshah Mehta, and Dinshaw Wacha. They employed constitutional agitation through 3 Ps (Prayer, Petition, Protest), demanding civil rights, expansion of legislative councils, and simultaneous ICS exams in India.',
          'The Indian Councils Act 1892 was an early achievement, introducing indirect elections and discussions on the annual budget.',
        ],
      },
      {
        pageNumber: 36,
        title: 'Swadeshi Movement (1905) & Surat Split (1907)',
        chapter: 'Chapter 4: The Extremist Surge',
        content: [
          'Lord Curzon announced the Partition of Bengal in July 1905, taking effect on October 16, 1905, observed as a day of national mourning (Raksha Bandhan Day).',
          'The Swadeshi and Boycott Movement pioneered boycott of foreign textiles, establishment of national educational institutions (Bengal National College under Aurobindo Ghosh), and indigenous industries (P.C. Ray’s Bengal Chemicals).',
          'Tensions between Moderates and Extremists (Lal-Bal-Pal: Lala Lajpat Rai, Bal Gangadhar Tilak, Bipin Chandra Pal) over extending the movement nationwide culminated in the Surat Split of 1907 at the Congress session presided by Rash Behari Ghosh.',
        ],
      },
      {
        pageNumber: 48,
        title: 'Gandhian Mass Era: Non-Cooperation, Civil Disobedience & Quit India',
        chapter: 'Chapter 5: Gandhian Mass Movements',
        content: [
          'Mahatma Gandhi returned to India on January 9, 1915. His early satyagrahas in Champaran (1917, indigo Tinkathia system), Ahmedabad Mill Strike (1918, first hunger strike), and Kheda (1918, tax remission) established his grassroots leadership.',
          'The Non-Cooperation Movement (1920-1922) launched in response to the Rowlatt Act and Jallianwala Bagh Massacre (April 13, 1919) unified the Khilafat and nationalist causes until called off after the Chauri Chaura incident (Feb 5, 1922).',
          'The Civil Disobedience Movement began with the historic Dandi Salt March (March 12 - April 6, 1930). Finally, on August 8, 1942, at Gowalia Tank, Bombay, Gandhi issued the clarion call Do or Die in the Quit India Movement.',
        ],
      },
    ],
  },
  {
    id: 'res_economy_ramesh_singh',
    title: 'Indian Economy: Macroeconomic Principles & Fiscal Policy',
    author: 'Ramesh Singh',
    description:
      'Foundational economic concepts explaining GDP accounting, inflation metrics (CPI vs WPI), monetary policy transmission, fiscal deficit management, FRBM targets, and banking sector reforms.',
    subject: 'Economy',
    subject_id: 'sub_economy',
    topic: 'Fiscal Policy, Monetary Framework & Economic Survey',
    exam: 'ALL',
    resource_type: 'BOOK',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    read_time_minutes: 110,
    tags: ['Prelims Core', 'Mains GS-III', 'Macroeconomics', 'Fiscal Policy'],
    pages: [
      {
        pageNumber: 1,
        title: 'National Income Accounting: GDP, GVA, and Deflator',
        chapter: 'Chapter 1: National Income',
        content: [
          'Gross Domestic Product (GDP) is the total monetary value of all finished goods and services produced within the domestic boundaries of a nation in a given financial year.',
          'Gross Value Added (GVA) measures sector-specific output: GVA at Basic Prices = GVA at Factor Cost + Production Taxes - Production Subsidies. GDP at Market Prices = GVA at Basic Prices + Product Taxes - Product Subsidies.',
          'Real GDP accounts for inflation using a fixed base year (currently 2011-12 in India), while Nominal GDP reflects current prevailing market prices. The GDP Deflator (Nominal GDP / Real GDP * 100) measures comprehensive economy-wide inflation.',
        ],
      },
      {
        pageNumber: 12,
        title: 'Inflation Indices: Consumer Price Index (CPI) vs Wholesale Price Index (WPI)',
        chapter: 'Chapter 2: Inflation Metrics',
        content: [
          'Inflation is the persistent and general rise in price levels over time, eroding purchasing power. Demand-Pull inflation arises when aggregate demand exceeds supply, whereas Cost-Push inflation stems from supply shocks in inputs like crude oil.',
          'CPI measures price changes at the retail level from the consumer perspective, compiled monthly by NSO (MoSPI) with base year 2012. Food & beverages carry highest weight (~45.86%). The RBI Monetary Policy Framework targets Headline CPI at 4% with a tolerance band of +/- 2%.',
          'WPI measures wholesale trade transactions, compiled by the Office of Economic Adviser (DPIIT) with base year 2011-12. WPI covers only manufactured goods (64.2%), primary articles, and fuel, completely excluding services.',
        ],
      },
      {
        pageNumber: 24,
        title: 'Monetary Policy Framework & RBI Policy Tools',
        chapter: 'Chapter 3: Central Banking',
        content: [
          'Under the amended RBI Act 1934, the six-member Monetary Policy Committee (MPC) meets bi-monthly to fix the benchmark policy Repo Rate.',
          'Quantitative tools: Repo Rate (rate at which RBI lends short-term liquidity against government securities), Reverse Repo Rate, Standing Deposit Facility (SDF - collateral-free absorption of liquidity), Cash Reserve Ratio (CRR - percentage of NDTL parked as cash with RBI), and Statutory Liquidity Ratio (SLR - percentage held in liquid assets like gold/G-Secs).',
          'Qualitative tools include margin requirements, credit rationing, moral suasion, and direct action to steer credit to Priority Sector Lending (PSL - 40% of ANBC for domestic scheduled commercial banks).',
        ],
      },
      {
        pageNumber: 36,
        title: 'Fiscal Deficit, FRBM Act & Banking NPA Resolution',
        chapter: 'Chapter 4: Public Finance & Banking',
        content: [
          'Fiscal Deficit represents the total borrowing requirements of the government: Total Expenditure - Total Receipts (excluding borrowings). Primary Deficit equals Fiscal Deficit minus Interest Payments.',
          'The Fiscal Responsibility and Budget Management (FRBM) Act 2003 aims for fiscal discipline, targeting a debt-to-GDP ratio of 60% (40% Centre, 20% States) as recommended by the N.K. Singh Committee.',
          'Non-Performing Assets (NPAs) are loans overdue for more than 90 days. Key resolution frameworks include the Insolvency and Bankruptcy Code (IBC 2016) through the National Company Law Tribunal (NCLT) and the establishment of the National Asset Reconstruction Company Limited (NARCL / Bad Bank).',
        ],
      },
    ],
  },
  {
    id: 'res_environment_shankar',
    title: 'Environment & Ecology Core Foundation',
    author: 'Shankar IAS Academy',
    description:
      'Structured synopsis covering ecosystems, ecological pyramids, biodiversity hotspots, Wildlife Protection Act schedules, Project Tiger, Ramsar Wetlands, and global UNFCCC climate conventions.',
    subject: 'Environment & Ecology',
    subject_id: 'sub_environment',
    topic: 'Ecosystems, Protected Areas & Climate Treaties',
    exam: 'UPSC CSE',
    resource_type: 'BOOK',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    read_time_minutes: 90,
    tags: ['Prelims Core', 'Mains GS-III', 'Biodiversity', 'Climate Change'],
    pages: [
      {
        pageNumber: 1,
        title: 'Ecosystem Dynamics & Ecological Pyramids',
        chapter: 'Chapter 1: Ecology Principles',
        content: [
          'An ecosystem is a functional unit comprising biotic organisms interacting with their abiotic physical environment. Energy flows unidirectionally following Lindeman’s 10% Law across trophic levels (Producers -> Primary Consumers -> Secondary -> Tertiary).',
          'Ecological Pyramids: Pyramid of Energy is ALWAYS upright because energy is lost as metabolic heat at every step. Pyramid of Biomass is upright in terrestrial ecosystems but inverted in aquatic ecosystems (standing crop of phytoplankton is smaller than zooplankton). Pyramid of Numbers can be inverted in tree ecosystems supporting numerous parasites.',
          'Ecotone is a transition zone between two distinct biomes (e.g., mangrove between marine and terrestrial), exhibiting high species richness known as the Edge Effect.',
        ],
      },
      {
        pageNumber: 15,
        title: 'Biodiversity Conservation & Protected Area Network',
        chapter: 'Chapter 2: Conservation Networks',
        content: [
          'In-situ conservation protects species in natural habitats: National Parks (highest protection, no grazing allowed, created under Wildlife Protection Act 1972), Wildlife Sanctuaries (limited rights permitted), and Biosphere Reserves (UNESCO MAB program, with Core, Buffer, and Transition zones).',
          'Ex-situ conservation preserves endangered germplasm outside natural habitats: Botanical Gardens, Zoological Parks, Seed Banks, and Cryopreservation facilities.',
          'India hosts 4 global Biodiversity Hotspots (Norman Myers criteria: at least 1500 endemic vascular plant species and lost 70% primary habitat): Western Ghats, Eastern Himalaya, Indo-Burma, and Sundaland (Nicobar Islands).',
        ],
      },
      {
        pageNumber: 30,
        title: 'Climate Change Conventions: UNFCCC, Paris Agreement & Panchamrit',
        chapter: 'Chapter 3: Climate Diplomacy',
        content: [
          'The 1992 Rio Earth Summit birthed the three Rio Conventions: UNFCCC (Climate), CBD (Biodiversity), and UNCCD (Desertification).',
          'The Paris Agreement (COP21, 2015) established the legally binding goal to limit global warming well below 2°C, preferably to 1.5°C above pre-industrial levels, through Nationally Determined Contributions (NDCs) updated every 5 years.',
          'At COP26 Glasgow (2021), India pledged Panchamrit: 1. 500 GW non-fossil energy capacity by 2030; 2. 50% energy requirements from renewables by 2030; 3. Reduce total projected carbon emissions by 1 billion tonnes by 2030; 4. Reduce carbon intensity by 45% by 2030; 5. Achieve Net Zero emissions by 2070.',
        ],
      },
    ],
  },
  {
    id: 'res_bpsc_bihar_special',
    title: 'BPSC General Studies Special: Bihar History, Art & Geography',
    author: 'Dr. Manish Rannjan',
    description:
      'Essential guide for 71st BPSC CCE aspirants detailing Ancient Magadha, Nalanda & Vikramshila Mahaviharas, Babu Veer Kunwar Singh in 1857, Champaran Satyagraha (1917), and Bihar plain physical geography.',
    subject: 'Bihar Special',
    subject_id: 'sub_bihar',
    topic: 'History, Freedom Struggle & Geography of Bihar',
    exam: 'BPSC',
    resource_type: 'BOOK',
    visibility: 'BPSC',
    status: 'PUBLISHED',
    read_time_minutes: 80,
    tags: ['BPSC 71st', 'Bihar History', 'Champaran', 'Veer Kunwar Singh'],
    pages: [
      {
        pageNumber: 1,
        title: 'Ancient Bihar: Magadha Empire & Buddhist Renaissance',
        chapter: 'Chapter 1: Ancient Bihar',
        content: [
          'Ancient Bihar was the cradle of great spiritual and political revolutions. Magadha rose as the pre-eminent Mahajanapada under the Haryanka dynasty (Bimbisara founded Rajgir/Girivraja, Ajatashatru built Pataliputra fort and convened the First Buddhist Council at Rajgir in 483 BC).',
          'Under the Mauryas, Chandragupta Maurya and Emperor Ashoka established Pan-Indian administration with capital at Pataliputra. Ashoka’s edicts (Lauriya Nandangarh, Rampurva, Sasaram) reveal Dhamma administration.',
          'Nalanda Mahavihara was founded by Gupta ruler Kumaragupta I, attracting Xuanzang (Hiuen Tsang) and I-Tsing, before being pillaged by Bakhtiyar Khilji in 1193 AD.',
        ],
      },
      {
        pageNumber: 14,
        title: 'Bihar in the 1857 Revolt & Freedom Struggle',
        chapter: 'Chapter 2: Bihar Freedom Movement',
        content: [
          'The 1857 uprising in Bihar was heralded by the Patna rebellion led by bookseller Pir Ali Khan on July 3, 1857, who was executed by Commissioner William Tayler.',
          'Babu Veer Kunwar Singh, the 80-year-old Zamindar of Jagdishpur (Arrah), led a heroic guerrilla campaign across Bihar and Eastern UP (Azamgarh), defeating British forces under Captain Le Grand before his martyrdom in April 1858.',
          'Champaran Satyagraha (1917) was Gandhiji’s first civil disobedience experiment in India, launched on the persistent invitation of Raj Kumar Shukla against European planters enforcing the Tinkathia system (compulsory indigo planting on 3/20th of land). Associated leaders included Dr. Rajendra Prasad, J.B. Kripalani, and Anugrah Narayan Sinha.',
        ],
      },
      {
        pageNumber: 26,
        title: 'Physical Geography & Drainage of Bihar',
        chapter: 'Chapter 3: Bihar Geography',
        content: [
          'Bihar covers 94,163 sq km, located in the middle Ganga plain. It is physiographically divided into: 1. Shiwalik foothills (Someshwar range in West Champaran); 2. Bihar Plain (divided by the Ganges into North Bihar Plain and South Bihar Plain); 3. Southern Plateau margin (Kaimur plateau and Chotanagpur fringe).',
          'The Ganges flows west to east for ~445 km through 12 districts in Bihar. Left-bank Himalayan tributaries (Ghaghara, Gandak, Burhi Gandak, Bagmati, Kamla-Balan, Kosi - Sorrow of Bihar) cause chronic annual inundations.',
          'Right-bank peninsular tributaries include the Karmanasa, Son (originates at Amarkantak, irrigates Rohtas canal system), Punpun, and Falgu (sacred river at Gaya).',
        ],
      },
    ],
  },
  {
    id: 'res_upsc_official_syllabus',
    title: 'Official UPSC Civil Services Examination Syllabus & Compendium',
    author: 'Union Public Service Commission',
    description:
      'Official examination compendium outlining the multi-stage architecture of Preliminary Examination (GS Paper I & CSAT) and Mains Examination (Essay, GS-I to GS-IV, Optional Subjects) with marking rubrics.',
    subject: 'General Studies',
    subject_id: 'sub_full_length',
    topic: 'Examination Architecture, Cutoff Trends & Syllabus Analysis',
    exam: 'UPSC CSE',
    resource_type: 'SYLLABUS',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    read_time_minutes: 60,
    tags: ['UPSC Scheme', 'Syllabus', 'Prelims Blueprint', 'Mains Blueprint'],
    pages: [
      {
        pageNumber: 1,
        title: 'Preliminary Examination Architecture (Stage 1)',
        chapter: 'Section 1: Prelims Structure',
        content: [
          'The Preliminary Examination consists of two objective type (multiple-choice) papers carrying 400 marks total: Paper I (General Studies, 200 marks, 100 questions) and Paper II (CSAT, 200 marks, 80 questions).',
          'Paper I determines the Prelims cutoff for Mains qualification. Paper II is qualifying in nature, requiring a mandatory minimum score of 33% (66 marks). Each incorrect answer incurs negative marking of one-third (0.333) of the marks assigned to that question.',
          'Core subjects: Current events of national and international importance, History of India and Indian National Movement, Indian and World Geography, Indian Polity and Governance, Economic and Social Development, General issues on Environmental Ecology, and General Science.',
        ],
      },
      {
        pageNumber: 10,
        title: 'Mains Written Examination Scheme (Stage 2 - 1750 Marks)',
        chapter: 'Section 2: Mains Structure',
        content: [
          'The Mains Written Examination assesses in-depth analytical intellect through nine subjective papers. Papers A (Indian Language) and B (English) are qualifying (25% qualifying threshold) and not counted in merit ranking.',
          'Seven merit papers (250 marks each = 1750 marks total): Paper I (Essay), Paper II (GS-I: Heritage & Culture, History & Geography of World and Society), Paper III (GS-II: Governance, Constitution, Polity, Social Justice & International Relations), Paper IV (GS-III: Technology, Economic Development, Bio-diversity, Environment, Security & Disaster Management), Paper V (GS-IV: Ethics, Integrity & Aptitude), Paper VI & VII (Optional Subject Papers 1 & 2).',
          'The Personality Test (Interview) carries 275 marks, bringing the grand aggregate to 2025 marks for the final merit list and All-India service allocation (IAS, IFS, IPS, Central Services Group A).',
        ],
      },
      {
        pageNumber: 18,
        title: 'General Studies Paper IV (Ethics, Integrity & Aptitude) Framework',
        chapter: 'Section 3: Ethics & Case Studies',
        content: [
          'GS Paper IV evaluates candidates’ integrity, moral philosophy, approach to issues relating to probity in public life, and conflict-resolution skills in public governance.',
          'Section A covers foundational concepts: Human values, lessons from ethical philosophers (Socrates, Plato, Kant’s Deontology, Mill’s Utilitarianism, Gandhi’s Seven Social Sins), emotional intelligence, and Nolan Committee principles of public life (Selflessness, Integrity, Objectivity, Accountability, Openness, Honesty, Leadership).',
          'Section B consists of practical situational case studies testing administrative decision-making under ethical dilemmas, whistleblower dilemmas, pressure from political masters, and emergency crisis management.',
        ],
      },
    ],
  },
];

/**
 * Executes idempotent seeding of canonical reference resources,
 * generating PDF binary buffers on disk and indexing RAG chunks in PostgreSQL.
 */
export async function seedCanonicalResources(): Promise<void> {
  try {
    console.log('[SeedResources] Initializing/Verifying canonical IKSHOVIA Learner Reference Library resources...');

    const pdfOutputDir = path.resolve(process.cwd(), 'public/resources');
    if (!fs.existsSync(pdfOutputDir)) {
      fs.mkdirSync(pdfOutputDir, { recursive: true });
    }

    // Ensure canonical data source exists for RAG data pipeline
    await pool.query(
      `INSERT INTO public.data_sources (id, name, slug, base_url, source_type, is_active, created_at, updated_at)
       VALUES ('src_ikshovia_canonical', 'IKSHOVIA Learner Reference Library', 'ikshovia-learner-library', 'https://ikshovia.internal', 'CANONICAL', true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`
    );

    for (const item of CANONICAL_SEED_RESOURCES) {
      // 1. Generate valid multi-page PDF buffer
      const pdfBuffer = generateMultiPagePdf(item.title, item.author, item.pages);
      const filePath = path.join(pdfOutputDir, `${item.id}.pdf`);
      fs.writeFileSync(filePath, pdfBuffer);

      // 2. Insert into public.resources
      const dbType =
        item.resource_type === 'NOTES' || item.resource_type === 'NOTE'
          ? 'NOTE'
          : ['BOOK', 'PDF', 'ARTICLE', 'VIDEO', 'PYQ'].includes(item.resource_type)
          ? item.resource_type
          : 'PDF';

      await pool.query(
        `INSERT INTO public.resources (
          id, title, author, description, resource_type, type, subject, subject_id,
          topic, exam, exam_tag, file_name, file_size, mime_type, page_count,
          status, visibility, url, summary, read_time_minutes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          author = EXCLUDED.author,
          description = EXCLUDED.description,
          resource_type = EXCLUDED.resource_type,
          type = EXCLUDED.type,
          subject = EXCLUDED.subject,
          topic = EXCLUDED.topic,
          exam = EXCLUDED.exam,
          exam_tag = EXCLUDED.exam_tag,
          file_name = EXCLUDED.file_name,
          file_size = EXCLUDED.file_size,
          page_count = EXCLUDED.page_count,
          status = EXCLUDED.status,
          visibility = EXCLUDED.visibility,
          updated_at = NOW()`,
        [
          item.id,
          item.title,
          item.author,
          item.description,
          item.resource_type,
          dbType,
          item.subject,
          item.subject_id,
          item.topic,
          item.exam,
          item.exam,
          `${item.id}.pdf`,
          pdfBuffer.length,
          'application/pdf',
          item.pages.length,
          item.status,
          item.visibility,
          `/api/resources/${item.id}/stream`,
          item.description,
          item.read_time_minutes,
        ]
      );

      // 2.1 Ensure data_resources record exists for RAG document linkage
      await pool.query(
        `INSERT INTO public.data_resources (
          id, source_id, title, url, resource_type, description, published_at, retrieved_at, content_hash, status, created_at, updated_at
        ) VALUES ($1, 'src_ikshovia_canonical', $2, $3, 'PDF', $4, NOW(), NOW(), $5, 'COMPLETED', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, updated_at = NOW()`,
        [
          item.id,
          item.title,
          `/api/resources/${item.id}/stream`,
          item.description,
          crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
        ]
      );

      // 3. Insert into public.data_documents
      const docId = `doc_${item.id}`;
      const allText = item.pages.map((p) => `${p.title}\n${p.content.join('\n')}`).join('\n\n');
      await pool.query(
        `INSERT INTO public.data_documents (
          id, resource_id, raw_text, clean_text, mime_type, file_size_bytes, page_count,
          language, meta_info, extraction_status, extraction_method, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'application/pdf', $5, $6, 'en', $7, 'COMPLETED', 'DIRECT', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          clean_text = EXCLUDED.clean_text,
          page_count = EXCLUDED.page_count,
          meta_info = EXCLUDED.meta_info,
          updated_at = NOW()`,
        [
          docId,
          item.id,
          allText,
          allText,
          pdfBuffer.length,
          item.pages.length,
          JSON.stringify({
            resourceId: item.id,
            title: item.title,
            author: item.author,
            subject: item.subject,
            topic: item.topic,
            exam: item.exam,
          }),
        ]
      );

      // 4. Insert RAG page chunks into public.data_chunks
      let chunkIdx = 0;
      for (const page of item.pages) {
        const pageText = `${page.title}\n\n${page.content.join('\n\n')}`;
        const chunkId = `chk_${item.id}_p${page.pageNumber}`;
        const chunkHash = crypto.createHash('sha256').update(pageText).digest('hex');

        await pool.query(
          `INSERT INTO public.data_chunks (
            id, document_id, chunk_index, content, token_count,
            character_count, heading, section, chunk_hash, metadata_json, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, heading = EXCLUDED.heading`,
          [
            chunkId,
            docId,
            chunkIdx++,
            pageText,
            Math.ceil(pageText.length / 4),
            pageText.length,
            page.title,
            `Page ${page.pageNumber}`,
            chunkHash,
            JSON.stringify({
              resourceId: item.id,
              resourceTitle: item.title,
              author: item.author,
              subject: item.subject,
              pageNumber: page.pageNumber,
              totalPageCount: item.pages.length,
            }),
          ]
        );
      }

      console.log(`[SeedResources] Successfully seeded & indexed '${item.title}' (${item.pages.length} pages, ${pdfBuffer.length} bytes)`);
    }

    console.log('[SeedResources] Canonical Library Seeding Complete.');
  } catch (err) {
    console.error('[SeedResources] Failed to seed canonical resources:', err);
  }
}
