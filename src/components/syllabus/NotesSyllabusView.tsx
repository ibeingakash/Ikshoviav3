import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  Circle,
  HelpCircle,
  ArrowUpRight,
  Download,
  Eye,
  Layers,
  Award,
  Sparkles,
  Bot,
  Search,
  ShieldCheck,
  ChevronRight,
  Clock,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { useLearner } from '../../context/LearnerContext.js';
import { api } from '../../lib/api.js';
import { LearningResource } from '../../types/index.js';
import { ResourceReaderModal } from '../resources/ResourceReaderModal.js';

interface SyllabusTopicItem {
  id: string;
  topic: string;
  subtopics: string[];
  subject: string;
  pyqCount: number;
  notesCount: number;
  bookReference: string;
  weightage: string;
}

interface SyllabusStage {
  id: string;
  name: string;
  shortName: string;
  marks: string;
  duration: string;
  nature: string;
  description: string;
  topics: SyllabusTopicItem[];
}

const UPSC_STAGES: SyllabusStage[] = [
  {
    id: 'upsc-pre-gs1',
    name: 'Preliminary Examination: General Studies Paper I',
    shortName: 'Prelims GS-I',
    marks: '200 Marks (100 Questions)',
    duration: '2 Hours',
    nature: 'Merit Ranking (1/3rd Negative Marking)',
    description: 'Decisive qualifying paper for Mains admission covering core national and international General Studies.',
    topics: [
      {
        id: 'upsc-polity',
        topic: 'Indian Polity and Governance',
        subtopics: [
          'Constitution of India (Historical Underpinnings, Features, Amendments, Significant Provisions and Basic Structure)',
          'Preamble, Fundamental Rights (Art 12-35), Directive Principles (Art 36-51), Fundamental Duties',
          'Union Executive & Parliament: President, PM, Council of Ministers, Rajya Sabha & Lok Sabha powers, Parliamentary Committees',
          'Judiciary: Supreme Court, High Courts, Judicial Review, Judicial Activism, PIL, Basic Structure Doctrine',
          'Federal System, Centre-State Relations (Legislative, Administrative, Financial), Inter-State Council',
          'Panchayati Raj & Urban Local Bodies (73rd & 74th Amendments)',
          'Constitutional Bodies (Election Commission, CAG, UPSC, Finance Commission) & Non-Constitutional Bodies (NITI Aayog, NHRC, CIC)',
        ],
        subject: 'Polity',
        pyqCount: 38,
        notesCount: 5,
        bookReference: 'Indian Polity — M. Laxmikanth',
        weightage: '15 - 18 Questions annually',
      },
      {
        id: 'upsc-history',
        topic: 'History of India and Indian National Movement',
        subtopics: [
          'Ancient India: Indus Valley Civilisation, Vedic Age, Buddhism, Jainism, Mauryan Empire, Gupta Period',
          'Medieval India: Delhi Sultanate, Vijayanagara Empire, Mughal Empire, Bhakti and Sufi Movements',
          'Modern India: British Expansion, Revolt of 1857, Socio-Religious Reform Movements',
          'Indian National Movement: Moderate & Extremist Phases, Gandhian Era (Non-Cooperation, Civil Disobedience, Quit India)',
          'Tribal and Peasant Movements, Revolutionary Movements, Role of Women, Partition and Integration',
        ],
        subject: 'History',
        pyqCount: 42,
        notesCount: 4,
        bookReference: "India's Struggle for Independence — Bipan Chandra",
        weightage: '16 - 20 Questions annually',
      },
      {
        id: 'upsc-economy',
        topic: 'Economic and Social Development',
        subtopics: [
          'National Income Accounting, GDP, GNP, Real vs Nominal, Growth vs Development',
          'Poverty, Inclusion, Demographics, Social Sector Initiatives, Human Development Index',
          'Fiscal Policy: Union Budget, Revenue vs Capital, Deficits, GST & Tax Reforms',
          'Monetary Policy: RBI, Repo, Reverse Repo, CRR, SLR, Inflation Management (CPI, WPI)',
          'Banking Sector, NPA Resolution, IBC, Financial Inclusion, Capital & Money Markets',
          'External Sector: Balance of Payments, Foreign Trade Policy, Forex Reserves, IMF & World Bank',
        ],
        subject: 'Economy',
        pyqCount: 35,
        notesCount: 4,
        bookReference: 'Indian Economy — Ramesh Singh',
        weightage: '14 - 18 Questions annually',
      },
      {
        id: 'upsc-environment',
        topic: 'General Issues on Environmental Ecology, Biodiversity & Climate Change',
        subtopics: [
          'Ecosystem Dynamics: Food Chains, Food Webs, Ecological Pyramids, Biomes',
          'Biodiversity: Hotspots, Protected Areas (National Parks, Wildlife Sanctuaries, Biosphere Reserves, Ramsar Sites)',
          'Environmental Legislation: Wildlife Protection Act 1972, Environment Protection Act 1986, Forest Rights Act',
          'Global Climate Governance: UNFCCC, COP Summits, Paris Agreement, IPCC Reports, Green Hydrogen Mission',
          'Pollution & Waste Management, Renewable Energy Targets, Environmental Impact Assessment',
        ],
        subject: 'Environment',
        pyqCount: 32,
        notesCount: 4,
        bookReference: 'Environment — Shankar IAS / NCERT Ecology',
        weightage: '15 - 20 Questions annually',
      },
      {
        id: 'upsc-geography',
        topic: 'Indian and World Geography (Physical, Social, Economic)',
        subtopics: [
          'Geomorphology: Plate Tectonics, Earthquakes, Volcanism, Fluvial and Glacial Landforms',
          'Climatology: Atmospheric Circulation, Monsoons, Jet Streams, El Niño/La Niña, Tropical Cyclones',
          'Oceanography: Ocean Currents, Tides, Coral Reefs and Bleaching',
          'Indian Geography: Physiographic Divisions, Drainage Systems (Himalayan & Peninsular), Soil Types, Mineral Resources',
          'Agriculture & Cropping Patterns, Irrigation Systems, Industrial Locations',
        ],
        subject: 'Geography',
        pyqCount: 28,
        notesCount: 3,
        bookReference: 'Certificate Physical and Human Geography — G.C. Leong & NCERTs',
        weightage: '12 - 15 Questions annually',
      },
      {
        id: 'upsc-science',
        topic: 'General Science & Emerging Technologies',
        subtopics: [
          'Space Technology: ISRO Missions (Chandrayaan, Aditya-L1, Gaganyaan), Launch Vehicles (PSLV, GSLV, LVM3)',
          'Defence Technology: Missile Systems, Submarines, Air Defence Systems',
          'Information Technology: 5G, Artificial Intelligence, Blockchain, Quantum Computing, Semiconductor Mission',
          'Biotechnology & Health: CRISPR-Cas9, Gene Therapy, Vaccines, Public Health Programs',
        ],
        subject: 'Science & Technology',
        pyqCount: 24,
        notesCount: 3,
        bookReference: 'Science & Tech Compendiums / The Hindu S&T',
        weightage: '10 - 13 Questions annually',
      },
      {
        id: 'upsc-ca',
        topic: 'Current Events of National and International Importance',
        subtopics: [
          'Government Schemes & Welfare Programs, Bilateral and Multilateral Treaties (G20, Quad, BRICS, SCO)',
          'Supreme Court Landmark Judgments, National Awards, Reports and Global Indices',
        ],
        subject: 'Current Affairs',
        pyqCount: 30,
        notesCount: 3,
        bookReference: 'PIB Releases & Monthly Current Affairs Compendium',
        weightage: '20 - 25 Questions integrated across subjects',
      },
    ],
  },
  {
    id: 'upsc-pre-csat',
    name: 'Preliminary Examination: CSAT Paper II',
    shortName: 'CSAT (Paper II)',
    marks: '200 Marks (80 Questions)',
    duration: '2 Hours',
    nature: 'Qualifying (33% / 66 Marks Required)',
    description: 'Aptitude qualifying paper testing analytical reasoning, comprehension, and mathematical competencies.',
    topics: [
      {
        id: 'csat-comprehension',
        topic: 'Reading Comprehension',
        subtopics: [
          'Critical Reasoning passages, Assumptions, Inferences, Main themes, Implications',
          'Socio-economic, philosophical, environmental and scientific essays',
        ],
        subject: 'CSAT',
        pyqCount: 27,
        notesCount: 2,
        bookReference: 'CSAT Manual — Authentic Past Papers',
        weightage: '25 - 28 Questions',
      },
      {
        id: 'csat-math',
        topic: 'Basic Numeracy and Data Interpretation (Class X Level)',
        subtopics: [
          'Number Systems, Divisibility, Unit Digit, Remainders, LCM & HCF',
          'Percentages, Profit & Loss, Simple & Compound Interest',
          'Ratio & Proportion, Mixtures & Alligations, Time & Work, Speed Time & Distance',
          'Permutation & Combination, Probability, Geometry & Mensuration basics',
          'Data Interpretation: Charts, Graphs, Tables, Data Sufficiency',
        ],
        subject: 'CSAT',
        pyqCount: 35,
        notesCount: 3,
        bookReference: 'Quantitative Aptitude — RS Aggarwal / PYQ Solutions',
        weightage: '35 - 40 Questions',
      },
      {
        id: 'csat-reasoning',
        topic: 'General Mental Ability & Logical Reasoning',
        subtopics: [
          'Syllogisms, Blood Relations, Direction Sense, Coding-Decoding',
          'Seating Arrangement, Puzzles, Venn Diagrams, Series Completion',
          'Analytical decision making and problem solving scenarios',
        ],
        subject: 'CSAT',
        pyqCount: 20,
        notesCount: 2,
        bookReference: 'Verbal & Non-Verbal Reasoning',
        weightage: '15 - 18 Questions',
      },
    ],
  },
  {
    id: 'upsc-mains-gs1',
    name: 'Mains GS Paper I (Indian Heritage, Culture, History & Geography)',
    shortName: 'Mains GS-I',
    marks: '250 Marks',
    duration: '3 Hours',
    nature: 'Merit Ranking Essay/Descriptive Format',
    description: 'Deep descriptive syllabus encompassing art forms, modern history, world history, society and physical geography.',
    topics: [
      {
        id: 'mains-art-culture',
        topic: 'Indian Culture — Salient Aspects of Art Forms, Literature & Architecture',
        subtopics: [
          'Temple Architecture (Nagara, Dravida, Vesara), Cave Architecture (Ajanta, Ellora, Elephanta)',
          'Classical Dances & Music traditions, Folk traditions, Puppet forms',
          'Ancient & Medieval Literature (Vedic, Sangam, Persian, Bhakti poetry)',
        ],
        subject: 'History',
        pyqCount: 15,
        notesCount: 2,
        bookReference: 'Indian Art and Culture — Nitin Singhania',
        weightage: '35 - 50 Marks',
      },
      {
        id: 'mains-modern-history',
        topic: 'Modern Indian History from mid-18th Century until Present',
        subtopics: [
          'Significant events, personalities, issues of the Freedom Struggle and post-independence consolidation',
          'Reorganisation within the country, linguistic states, integration of princely states',
        ],
        subject: 'History',
        pyqCount: 20,
        notesCount: 3,
        bookReference: "India's Struggle for Independence / India After Gandhi",
        weightage: '40 - 60 Marks',
      },
      {
        id: 'mains-society',
        topic: 'Indian Society & Diversity',
        subtopics: [
          'Salient features of Indian Society, Role of Women and Women’s Organisations',
          'Poverty and developmental issues, Urbanisation (problems and remedies)',
          'Effects of Globalisation on Indian culture, Social Empowerment, Communalism, Regionalism, Secularism',
        ],
        subject: 'Society',
        pyqCount: 22,
        notesCount: 3,
        bookReference: 'NCERT Indian Society Class 12 & Social Issues compendiums',
        weightage: '60 - 75 Marks',
      },
      {
        id: 'mains-geography',
        topic: 'World Geography & Geophysical Phenomena',
        subtopics: [
          'Distribution of Key Natural Resources across the world (including South Asia and Indian sub-continent)',
          'Factors responsible for the location of primary, secondary, and tertiary sector industries',
          'Important Geophysical phenomena such as earthquakes, Tsunami, Volcanic activity, cyclone',
        ],
        subject: 'Geography',
        pyqCount: 25,
        notesCount: 3,
        bookReference: 'Physical Geography & Resource Economics',
        weightage: '75 - 90 Marks',
      },
    ],
  },
  {
    id: 'upsc-mains-gs2',
    name: 'Mains GS Paper II (Governance, Constitution, Polity, Social Justice & IR)',
    shortName: 'Mains GS-II',
    marks: '250 Marks',
    duration: '3 Hours',
    nature: 'Merit Ranking Essay/Descriptive Format',
    description: 'Constitutional functioning, separation of powers, welfare governance mechanisms, and international relations.',
    topics: [
      {
        id: 'mains-polity-gov',
        topic: 'Indian Constitution, Governance & Political System',
        subtopics: [
          'Comparison of the Indian Constitutional Scheme with that of other countries',
          'Functions and responsibilities of the Union and the States, issues and challenges pertaining to the federal structure',
          'Separation of powers between various organs, dispute redressal mechanisms and institutions',
          'Parliament and State legislatures: structure, functioning, conduct of business, powers & privileges',
        ],
        subject: 'Polity',
        pyqCount: 28,
        notesCount: 4,
        bookReference: 'Indian Polity — M. Laxmikanth & Constitution Commentary',
        weightage: '100 - 115 Marks',
      },
      {
        id: 'mains-social-justice',
        topic: 'Social Justice & Welfare Policies',
        subtopics: [
          'Welfare schemes for vulnerable sections of the population by the Centre and States and performance of these schemes',
          'Issues relating to development and management of Social Sector/Services relating to Health, Education, Human Resources',
          'Issues relating to poverty and hunger',
        ],
        subject: 'Polity',
        pyqCount: 18,
        notesCount: 3,
        bookReference: 'NITI Aayog Strategy Reports & Social Justice Compendiums',
        weightage: '50 - 60 Marks',
      },
      {
        id: 'mains-ir',
        topic: 'International Relations & Global Groupings',
        subtopics: [
          'India and its neighbourhood- relations, Bilateral, regional and global groupings and agreements involving India',
          'Effect of policies and politics of developed and developing countries on India’s interests, Indian diaspora',
          'Important International institutions, agencies and fora- their structure, mandate',
        ],
        subject: 'International Relations',
        pyqCount: 20,
        notesCount: 3,
        bookReference: "India's Foreign Policy — Strategic Affairs Compendiums",
        weightage: '50 - 60 Marks',
      },
    ],
  },
  {
    id: 'upsc-mains-gs3',
    name: 'Mains GS Paper III (Technology, Economic Dev, Biodiversity, Security & DM)',
    shortName: 'Mains GS-III',
    marks: '250 Marks',
    duration: '3 Hours',
    nature: 'Merit Ranking Essay/Descriptive Format',
    description: 'Indian economy, inclusive growth, budgeting, agriculture, S&T, environment, disaster management and internal security.',
    topics: [
      {
        id: 'mains-economy-growth',
        topic: 'Indian Economy & Issues Relating to Planning, Mobilisation of Resources',
        subtopics: [
          'Inclusive growth and issues arising from it, Government Budgeting',
          'Major crops-cropping patterns in various parts of the country, different types of irrigation and irrigation systems',
          'Issues related to direct and indirect farm subsidies and minimum support prices; Public Distribution System',
          'Food processing and related industries in India, Land reforms in India',
        ],
        subject: 'Economy',
        pyqCount: 30,
        notesCount: 4,
        bookReference: 'Indian Economy — Ramesh Singh & Economic Survey',
        weightage: '100 - 120 Marks',
      },
      {
        id: 'mains-science-tech',
        topic: 'Science & Technology Developments and Applications',
        subtopics: [
          'Indigenisation of technology and developing new technology',
          'Awareness in the fields of IT, Space, Computers, robotics, nano-technology, bio-technology and IPR issues',
        ],
        subject: 'Science & Technology',
        pyqCount: 16,
        notesCount: 3,
        bookReference: 'Science & Tech Developments & PIB',
        weightage: '35 - 45 Marks',
      },
      {
        id: 'mains-security-dm',
        topic: 'Internal Security & Disaster Management',
        subtopics: [
          'Linkages between development and spread of extremism',
          'Role of external state and non-state actors in creating challenges to internal security',
          'Challenges to internal security through communication networks, role of media and social networking sites, cyber security',
          'Disaster and disaster management (NDRF, NDMA guidelines, Sendai Framework)',
        ],
        subject: 'Environment',
        pyqCount: 22,
        notesCount: 3,
        bookReference: 'Internal Security Challenges — Ashok Kumar & NDMA Compendium',
        weightage: '65 - 75 Marks',
      },
    ],
  },
  {
    id: 'upsc-mains-gs4',
    name: 'Mains GS Paper IV (Ethics, Integrity and Aptitude)',
    shortName: 'Mains GS-IV',
    marks: '250 Marks',
    duration: '3 Hours',
    nature: 'Merit Ranking Essay/Descriptive Format',
    description: 'Human values, attitude, emotional intelligence, moral thinkers, civil service values and real-world administrative case studies.',
    topics: [
      {
        id: 'mains-ethics-theory',
        topic: 'Ethics and Human Interface & Foundational Values for Civil Service',
        subtopics: [
          'Essence, determinants and consequences of Ethics in-human actions; dimensions of ethics',
          'Human Values- lessons from the lives and teachings of great leaders, reformers and administrators',
          'Integrity, impartiality and non-partisanship, objectivity, dedication to public service, empathy, tolerance and compassion',
          'Emotional intelligence-concepts, and their utilities and application in administration and governance',
          'Contributions of moral thinkers and philosophers from India and world',
        ],
        subject: 'Polity',
        pyqCount: 25,
        notesCount: 3,
        bookReference: 'Lexicon for Ethics, Integrity & Aptitude',
        weightage: '125 Marks (Section A: Theory)',
      },
      {
        id: 'mains-case-studies',
        topic: 'Probity in Governance & Practical Administrative Case Studies',
        subtopics: [
          'Concept of public service; Philosophical basis of governance and probity',
          'Information sharing and transparency in government, Right to Information, Codes of Ethics, Citizen’s Charters',
          'Case Studies on issues related to integrity, corruption, public grievances, conflict of interest and crisis response',
        ],
        subject: 'Polity',
        pyqCount: 30,
        notesCount: 3,
        bookReference: 'Administrative Ethics Casebook',
        weightage: '125 Marks (Section B: 6 Case Studies)',
      },
    ],
  },
  {
    id: 'upsc-mains-essay',
    name: 'Mains Paper I: Essay',
    shortName: 'Essay Paper',
    marks: '250 Marks',
    duration: '3 Hours',
    nature: 'Merit Ranking (2 Essays: Section A & Section B)',
    description: 'Candidates write two essays (1000-1200 words each) on philosophical, socio-economic, environmental, or technological subjects.',
    topics: [
      {
        id: 'upsc-essay-writing',
        topic: 'Philosophical & Socio-Economic Essay Frameworks',
        subtopics: [
          'Section A: Philosophical and Abstract Quotations (Epistemology, Ethics, Human Existence)',
          'Section B: Socio-Economic, Environmental, Governance, Technology and Women Empowerment themes',
          'Structuring essays: Multi-dimensional exploration (PESTLE framework), balanced arguments, historical depth, policy solutions',
        ],
        subject: 'Essay',
        pyqCount: 32,
        notesCount: 3,
        bookReference: 'Essay Writing for Civil Services — Selected PYQ Collections',
        weightage: '250 Marks (125 Marks each)',
      },
    ],
  },
];

const BPSC_STAGES: SyllabusStage[] = [
  {
    id: 'bpsc-prelims',
    name: 'BPSC CCE Preliminary Examination (General Studies)',
    shortName: 'BPSC Prelims',
    marks: '150 Marks (150 Questions)',
    duration: '2 Hours',
    nature: 'Screening Test (1/3rd Negative Marking)',
    description: 'Comprehensive general studies screening with dedicated focus on Bihar history, geography, economy, and state affairs.',
    topics: [
      {
        id: 'bpsc-bihar-special',
        topic: 'Bihar Special General Knowledge & History',
        subtopics: [
          'Ancient Bihar: Magadha Empire, Bimbisara, Ajatashatru, Ashoka, Nalanda & Vikramshila Universities',
          'Medieval Bihar: Sher Shah Suri administration, Sasaram Tomb, Sufism in Bihar',
          'Modern Bihar & Freedom Struggle: Battle of Buxar, 1857 Revolt under Veer Kunwar Singh, Champaran Satyagraha 1917',
          'Role of Bihar in Non-Cooperation, Civil Disobedience, Quit India Movement 1942, Kisan Sabha Movement (Swami Sahajanand)',
          'Post-Independence Bihar: Creation of Jharkhand (2000), JP Movement 1974',
        ],
        subject: 'Bihar Special',
        pyqCount: 36,
        notesCount: 4,
        bookReference: 'Bihar Special General Knowledge — Dr. Manish Rannjan / KBC Nano',
        weightage: '25 - 30 Questions',
      },
      {
        id: 'bpsc-general-science',
        topic: 'General Science (Physics, Chemistry, Biology)',
        subtopics: [
          'Everyday science, principles of mechanics, optics, electricity, chemical reactions, periodic table',
          'Human anatomy, physiology, nutrition, diseases, genetics, biotechnology fundamentals',
        ],
        subject: 'Science & Technology',
        pyqCount: 30,
        notesCount: 3,
        bookReference: 'Lucent General Science & NCERTs (Class 9-10)',
        weightage: '30 Questions',
      },
      {
        id: 'bpsc-geography',
        topic: 'Geography of India & Physical Geography of Bihar',
        subtopics: [
          'Physiographic divisions of Bihar (North Plains, South Plains, Southern Plateau border)',
          'River systems of Bihar: Ganga and its tributaries (Ghaghara, Gandak, Bagmati, Kosi, Son, Punpun)',
          'Climate, soils of Bihar (Terai, Alluvial, Balsundari), forest cover (ISFR Report), agriculture, mineral distribution',
        ],
        subject: 'Geography',
        pyqCount: 22,
        notesCount: 3,
        bookReference: 'Geography of Bihar & India',
        weightage: '15 - 20 Questions',
      },
      {
        id: 'bpsc-polity-economy',
        topic: 'Indian Polity, Governance & Bihar Economy',
        subtopics: [
          'Indian Constitution, Panchayati Raj System in Bihar (50% reservation for women), State Executive & Legislative Assembly',
          'Bihar Economic Survey, State Budget, Bihar Industrial Investment Promotion Policy, Saat Nischay Part-1 & 2',
          'Agriculture Roadmap, Green Budget of Bihar, Gross State Domestic Product (GSDP) indicators',
        ],
        subject: 'Polity',
        pyqCount: 25,
        notesCount: 3,
        bookReference: 'Bihar Economic Survey & State Budget Compendium',
        weightage: '20 - 25 Questions',
      },
      {
        id: 'bpsc-ca',
        topic: 'Current Affairs (National, International & Bihar State)',
        subtopics: [
          'State government initiatives, awards, sports, GI tags of Bihar (Mithila Makhana, Shahi Litchi, Katarni Rice, Magahi Paan)',
          'National & international summits, rankings, and major socio-economic developments',
        ],
        subject: 'Current Affairs',
        pyqCount: 35,
        notesCount: 3,
        bookReference: 'Bihar State Monthly Current Affairs',
        weightage: '30 Questions',
      },
      {
        id: 'bpsc-math',
        topic: 'General Mental Ability & Basic Mathematics',
        subtopics: [
          'Class X level arithmetic, algebra, percentages, ratio, number series, coding, basic permutations',
        ],
        subject: 'CSAT',
        pyqCount: 10,
        notesCount: 1,
        bookReference: 'BPSC Past 10 Years Solved Mathematics',
        weightage: '10 Questions',
      },
    ],
  },
  {
    id: 'bpsc-mains-gs1',
    name: 'BPSC Mains General Studies Paper 1',
    shortName: 'Mains GS Paper 1',
    marks: '300 Marks',
    duration: '3 Hours',
    nature: 'Descriptive Examination (History, Current Events & Stats)',
    description: 'Modern history of India and Indian culture with special reference to Bihar, national/international events, and statistical analysis.',
    topics: [
      {
        id: 'bpsc-gs1-history',
        topic: 'Modern History of India & Indian Culture with Special Reference to Bihar',
        subtopics: [
          'Introduction and expansion of Western education (including technical education) in Bihar',
          'Role of Bihar in India’s freedom struggle (Santhal Uprising, Birsa Munda Movement, Champaran, Quit India 1942)',
          'Salient features of Mauryan Art, Pal Art, and Patna Qalam painting',
          'Basic contributions of Mahatma Gandhi, Jawaharlal Nehru, and Rabindranath Tagore',
        ],
        subject: 'History',
        pyqCount: 18,
        notesCount: 3,
        bookReference: 'Modern Bihar History & Cultural Traditions',
        weightage: '114 Marks (3 Questions out of 6)',
      },
      {
        id: 'bpsc-gs1-ca',
        topic: 'Current Events of National and International Importance',
        subtopics: [
          'Bilateral relations, global geopolitical conflicts, India’s foreign policy, summits, and multilateral treaties',
        ],
        subject: 'Current Affairs',
        pyqCount: 15,
        notesCount: 3,
        bookReference: 'PIB Compendiums & Diplomatic Affairs',
        weightage: '114 Marks (3 Questions out of 6)',
      },
      {
        id: 'bpsc-gs1-stats',
        topic: 'Statistical Analysis, Graphs and Diagrams',
        subtopics: [
          'Exercises to test the candidate’s ability to draw common sense conclusions from information presented in statistical, graphical or diagrammatical form',
          'Data interpretation: Bar diagrams, pie charts, line graphs, histograms, and mathematical verification',
        ],
        subject: 'CSAT',
        pyqCount: 20,
        notesCount: 2,
        bookReference: 'BPSC Statistical Analysis Practice Manual',
        weightage: '72 Marks (2 Questions out of 4)',
      },
    ],
  },
  {
    id: 'bpsc-mains-gs2',
    name: 'BPSC Mains General Studies Paper 2',
    shortName: 'Mains GS Paper 2',
    marks: '300 Marks',
    duration: '3 Hours',
    nature: 'Descriptive Examination (Polity, Economy, Geography, S&T)',
    description: 'Indian and Bihar Polity, Economy, Geography, and the role and impact of science and technology in development.',
    topics: [
      {
        id: 'bpsc-gs2-polity',
        topic: 'Indian and Bihar Polity',
        subtopics: [
          'Political system in India including Bihar: Constitution, fundamental rights, judicial activism, election commission',
          'Role of Governor, Chief Minister and State Council, Coalition politics in Bihar, Panchayati Raj decentralisation',
        ],
        subject: 'Polity',
        pyqCount: 20,
        notesCount: 3,
        bookReference: 'Indian Polity — M. Laxmikanth & Bihar Governance Notes',
        weightage: '114 Marks (3 Questions)',
      },
      {
        id: 'bpsc-gs2-economy-geo',
        topic: 'Indian Economy & Geography of India and Bihar',
        subtopics: [
          'Physical, economic and social geography of India and Bihar, planning and economic development in India',
          'Major problems of Bihar economy: poverty, unemployment, migration, floods and drought, industrial backwardness',
          'Role of Saat Nischay, Agriculture Roadmap, and renewable energy in state development',
        ],
        subject: 'Economy',
        pyqCount: 22,
        notesCount: 4,
        bookReference: 'Bihar Economic Survey & Indian Economy',
        weightage: '114 Marks (3 Questions)',
      },
      {
        id: 'bpsc-gs2-science-tech',
        topic: 'Role & Impact of Science and Technology in Development',
        subtopics: [
          'Application of science and technology in flood control, disaster management, agriculture, waste management, public health and communication in Bihar',
        ],
        subject: 'Science & Technology',
        pyqCount: 16,
        notesCount: 3,
        bookReference: 'Science & Tech for Applied Development',
        weightage: '72 Marks (2 Questions)',
      },
    ],
  },
  {
    id: 'bpsc-mains-essay',
    name: 'BPSC Mains Essay Paper',
    shortName: 'Mains Essay',
    marks: '300 Marks',
    duration: '3 Hours',
    nature: 'Descriptive Essay (Section 1, Section 2 & Bihar Specific Proverbs)',
    description: 'Candidates write 3 essays (100 marks each) covering national/international themes, socio-cultural philosophy, and Bihar dialect proverbs/folklore.',
    topics: [
      {
        id: 'bpsc-essay-section1-2',
        topic: 'Section 1 & 2: General, Philosophical & Socio-Economic Essays',
        subtopics: [
          'Section 1: Contemporary socio-economic, administrative, and technological topics',
          'Section 2: Philosophical, ethical, environmental and cultural themes',
        ],
        subject: 'Essay',
        pyqCount: 15,
        notesCount: 2,
        bookReference: 'Civil Services Model Essays',
        weightage: '200 Marks (100 Marks each)',
      },
      {
        id: 'bpsc-essay-section3',
        topic: 'Section 3: Bihar Specific Themes, Proverbs & Folklore',
        subtopics: [
          'Essays based on popular Bhojouri, Magahi, and Maithili proverbs, rural wisdom, and cultural idioms of Bihar',
          'Socio-historical analysis of Bihar’s agrarian structure and folk ethos',
        ],
        subject: 'Bihar Special',
        pyqCount: 12,
        notesCount: 3,
        bookReference: 'Bihar Culture & Proverbs Compendium',
        weightage: '100 Marks (1 Essay)',
      },
    ],
  },
];

export const NotesSyllabusView: React.FC = () => {
  const { setActiveSection } = useLearner();

  // Selected Exam: 'UPSC' or 'BPSC'
  const [selectedExam, setSelectedExam] = useState<'UPSC' | 'BPSC'>('UPSC');

  // Selected Stage
  const [selectedStageId, setSelectedStageId] = useState<string>('upsc-pre-gs1');

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Checklist of completed topics (stored in local storage)
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ikshovia_syllabus_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Official Syllabus Document modal state
  const [syllabusResource, setSyllabusResource] = useState<LearningResource | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  const [isReaderOpen, setIsReaderOpen] = useState<boolean>(false);

  // Sync selected stage when exam changes
  useEffect(() => {
    if (selectedExam === 'UPSC') {
      setSelectedStageId(UPSC_STAGES[0].id);
    } else {
      setSelectedStageId(BPSC_STAGES[0].id);
    }
  }, [selectedExam]);

  // Load official syllabus document from API
  useEffect(() => {
    const fetchSyllabusDoc = async () => {
      setLoadingDoc(true);
      try {
        const res = await api.getResources({ type: 'SYLLABUS', limit: 5 });
        if (res.resources && res.resources.length > 0) {
          setSyllabusResource(res.resources[0]);
        }
      } catch (err) {
        console.error('Failed to load official syllabus resource:', err);
      } finally {
        setLoadingDoc(false);
      }
    };
    fetchSyllabusDoc();
  }, []);

  const toggleTopicChecklist = (topicId: string) => {
    setCompletedTopicIds((prev) => {
      const next = { ...prev, [topicId]: !prev[topicId] };
      try {
        localStorage.setItem('ikshovia_syllabus_checklist', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save checklist state', e);
      }
      return next;
    });
  };

  const currentStages = selectedExam === 'UPSC' ? UPSC_STAGES : BPSC_STAGES;
  const activeStage = currentStages.find((s) => s.id === selectedStageId) || currentStages[0];

  const filteredTopics = activeStage.topics.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.topic.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.subtopics.some((st) => st.toLowerCase().includes(q))
    );
  });

  const totalTopicsCount = activeStage.topics.length;
  const completedTopicsCount = activeStage.topics.filter((t) => completedTopicIds[t.id]).length;
  const progressPct = Math.round((completedTopicsCount / Math.max(1, totalTopicsCount)) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/90 border border-emerald-200/80 flex items-center justify-center text-emerald-900 shadow-2xs">
                <FileText className="w-5 h-5 text-emerald-800" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif-editorial text-stone-900">
                  Notes & Syllabus
                </h1>
                <span className="text-[11px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                  Official Examination Curriculum & Syllabus Breakdown
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-600 mt-2 max-w-3xl leading-relaxed">
              Complete stage-wise official curriculum for UPSC Civil Services & BPSC CCE. Track your syllabus coverage, understand mark weightages, and directly jump to authentic books, past examination papers, and high-yield revision cards.
            </p>
          </div>

          {/* Official Notification Document Button */}
          {syllabusResource && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsReaderOpen(true)}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Read Official Syllabus Document</span>
              </button>
              <a
                href={`/api/resources/${syllabusResource.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors border border-stone-200"
                title="Download Official Notification PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Exam Selector Switch */}
        <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200/80 w-fit">
            <button
              onClick={() => setSelectedExam('UPSC')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedExam === 'UPSC'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              UPSC Civil Services (CSE)
            </button>
            <button
              onClick={() => setSelectedExam('BPSC')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedExam === 'BPSC'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              BPSC Combined Competitive (CCE)
            </button>
          </div>

          {/* Search box within syllabus */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics, articles, themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 2. Stages Horizontal Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {currentStages.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          const stageCompleted = stage.topics.filter((t) => completedTopicIds[t.id]).length;
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStageId(stage.id)}
              className={`px-4 py-3 rounded-2xl border transition-all text-left shrink-0 cursor-pointer min-w-[200px] ${
                isSelected
                  ? 'bg-white border-emerald-500/80 ring-2 ring-emerald-500/10 shadow-xs'
                  : 'bg-white border-stone-200/90 hover:border-stone-300 text-stone-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isSelected ? 'text-emerald-800' : 'text-stone-400'
                  }`}
                >
                  {stage.marks}
                </span>
                <span className="text-[10px] font-mono text-stone-400">
                  {stageCompleted}/{stage.topics.length} Done
                </span>
              </div>
              <h3
                className={`text-xs font-bold font-serif-editorial ${
                  isSelected ? 'text-stone-900' : 'text-stone-700'
                }`}
              >
                {stage.shortName}
              </h3>
            </button>
          );
        })}
      </div>

      {/* 3. Stage Overview Banner with Completion Progress */}
      <div className="bg-stone-50/90 rounded-2xl border border-stone-200/80 p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                {activeStage.nature}
              </span>
              <span className="text-xs font-mono text-stone-500">
                Duration: {activeStage.duration} • Marks: {activeStage.marks}
              </span>
            </div>
            <h2 className="text-base font-bold font-serif-editorial text-stone-900 mt-1.5">
              {activeStage.name}
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">{activeStage.description}</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-stone-200 shrink-0 min-w-[200px] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-500 font-medium">Stage Progress</span>
              <span className="font-bold text-emerald-800">{progressPct}%</span>
            </div>
            <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-stone-400 text-right">
              {completedTopicsCount} of {totalTopicsCount} syllabus units covered
            </p>
          </div>
        </div>
      </div>

      {/* 4. Syllabus Topic Cards */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-stone-300 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">No matching syllabus topics</h3>
            <p className="text-xs text-stone-500">Try clearing your search query.</p>
          </div>
        ) : (
          filteredTopics.map((item) => {
            const isCompleted = Boolean(completedTopicIds[item.id]);

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all duration-150 p-5 space-y-4 shadow-2xs ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-stone-200/90 hover:border-emerald-300'
                }`}
              >
                {/* Header Row: Subject, Checklist Toggle, Weightage */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTopicChecklist(item.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-700 transition-colors cursor-pointer shrink-0"
                      title={isCompleted ? 'Mark as In Progress' : 'Mark as Completed'}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-5 h-5 text-stone-300 hover:text-stone-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-semibold">
                          {item.weightage}
                        </span>
                      </div>
                      <h3
                        className={`text-base font-bold font-serif-editorial ${
                          isCompleted ? 'text-stone-700 line-through' : 'text-stone-900'
                        }`}
                      >
                        {item.topic}
                      </h3>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-stone-400 shrink-0 hidden sm:inline-block">
                    Standard Ref: {item.bookReference}
                  </span>
                </div>

                {/* Detailed Subtopic Bullet List */}
                <div className="pl-8">
                  <ul className="space-y-1.5 text-xs text-stone-600 leading-relaxed font-sans">
                    {item.subtopics.map((st, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cross-Learning Hub Links (Section 9 of Spec) */}
                <div className="pt-3 border-t border-stone-100 pl-8 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Link 1: Study in Books Library */}
                    <button
                      onClick={() => setActiveSection('resources')}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100/80 text-stone-700 hover:text-amber-950 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Open Book in Resource Library"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>Study in Books ({item.bookReference.split('—')[0].trim()})</span>
                      <ArrowUpRight className="w-3 h-3 text-stone-400" />
                    </button>

                    {/* Link 2: Practice Related PYQs */}
                    <button
                      onClick={() => setActiveSection('pyq-practice')}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-amber-100/80 text-stone-700 hover:text-amber-950 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Practice Authentic Previous Year Questions"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      <span>{item.pyqCount} Related Official PYQs</span>
                      <ArrowUpRight className="w-3 h-3 text-stone-400" />
                    </button>

                    {/* Link 3: Revise High-Yield Cards */}
                    <button
                      onClick={() => setActiveSection('short-notes')}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-emerald-100/80 text-stone-700 hover:text-emerald-950 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Open Structured Revision Cards"
                    >
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{item.notesCount} Revision Compendiums</span>
                      <ArrowUpRight className="w-3 h-3 text-stone-400" />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleTopicChecklist(item.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {isCompleted ? 'Completed' : 'Mark as Covered'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Official Syllabus PDF Document In-App Reader Modal */}
      {syllabusResource && isReaderOpen && (
        <ResourceReaderModal
          resource={syllabusResource}
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
        />
      )}
    </div>
  );
};
