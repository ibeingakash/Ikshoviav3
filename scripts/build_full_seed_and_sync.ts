import fs from 'fs';
import path from 'path';
import pool from '../server/db/pool.js';
import { OFFICIAL_CURRENT_AFFAIRS } from '../server/db/seedCurrentAffairs.js';

// Let's define the comprehensive dataset for 2026-08-05 through 2026-08-12
const additionalArticles: any[] = [
  // =========================================================================
  // 2026-08-12 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_12_01',
    date: '2026-08-12',
    title: 'Ministry of Agriculture Approves National Digital Agriculture Mission with AgriStack & Unified Farmer ID',
    summary: 'The Union Cabinet clears the ₹2,817 crore Digital Agriculture Mission to deploy digital public infrastructure including AgriStack, Krishi Decision Support System (Krishi-DSS), and soil profile mapping across 14 crore farmers.',
    content: `The Union Cabinet chaired by the Prime Minister has approved the comprehensive Digital Agriculture Mission with an outlay of ₹2,817 crore to build open digital public infrastructure for Indian farming.

Core Components:
1. AgriStack: Creating a federated Farmer Registry with a unique Aadhaar-authenticated Farmer ID, geo-referenced digital crop surveys, and digitized land records.
2. Krishi-DSS (Decision Support System): Integrating ISRO RISAT and Landsat satellite imagery, Indian Meteorological Department (IMD) weather stations, and drone soil moisture sensors for automated crop insurance settlements under PMFBY.
3. Soil Profile Mapping: Creating high-resolution 1:10,000 scale digital soil fertility maps for customized nano-fertilizer recommendations.`,
    category: 'Economy & Agriculture',
    source: 'Press Information Bureau (PIB) - Ministry of Agriculture',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081201',
    sourceProvenance: {
      sourceId: 'src_pib_agri',
      sourceName: 'Ministry of Agriculture & Farmers Welfare',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['AgriStack', 'Digital Agriculture', 'Krishi-DSS', 'PMFBY', 'Agriculture Tech', 'GS-3'],
    prelimsPointers: [
      'AgriStack is a federated digital public infrastructure jointly developed by the Ministry of Agriculture and state revenue departments.',
      'Pradhan Mantri Fasal Bima Yojana (PMFBY) was launched in 2016, providing comprehensive crop insurance against non-preventable natural risks.',
      'Krishi-DSS serves as a centralized geospatial decision support platform for crop acreage and yield estimation.'
    ],
    mainsQuestions: [
      'Examine the potential of Digital Public Infrastructure (DPI) in transforming Indian agriculture. What privacy and tenancy concerns must be resolved in AgriStack? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_digital_agriculture_2026',
    topicClusterTitle: 'Digital Agriculture, AgriStack & Farm Sector Technology',
    publishedAt: '2026-08-12T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_12_02',
    date: '2026-08-12',
    title: 'Bihar State Cabinet Notifies Climate-Resilient Agriculture Programme Phase-II Across All 38 Districts',
    summary: 'The Bihar Department of Agriculture rolls out ₹320 crore for C-RAP Phase-II, expanding zero-tillage wheat sowing, direct seeded rice (DSR), and custom hiring centers for climate-smart farm machinery.',
    content: `The Bihar Cabinet has approved the expansion of the Climate-Resilient Agriculture Programme (C-RAP) across all 38 districts to insulate farm yields against delayed monsoons and heatwave shocks.

Program Interventions:
- Direct Seeded Rice (DSR) & Zero Tillage: Saves 25-30% irrigation water and reduces diesel pumping costs by eliminating puddled transplanting and residue burning.
- Contingent Crop Planning: Subsidized distribution of short-duration pulse and oilseed varieties (Moong, Urad, Mustard) for flood-receded diara and chaura lands.
- Custom Hiring Centres (CHCs): 1,500 new village-level CHCs established through PACS (Primary Agricultural Credit Societies) with 80% subsidy for Happy Seeders, laser levellers, and drone sprayers.`,
    category: 'Bihar Special',
    source: 'Department of Agriculture - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/krishi',
    sourceProvenance: {
      sourceId: 'src_bihar_agri',
      sourceName: 'Bihar Agriculture Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'C-RAP', 'Climate Smart Agriculture', 'Zero Tillage', 'PACS', 'BPSC_GS2'],
    prelimsPointers: [
      'Bihar fourth Agriculture Road Map (2023-2028) has a total financial outlay of ₹1.62 lakh crore.',
      'Direct Seeded Rice (DSR) technique reduces methane emissions from paddy fields compared to traditional flooded transplanting.',
      'Bihar Agricultural University (BAU) is situated at Sabour in Bhagalpur district.'
    ],
    mainsQuestions: [
      'Assess the vulnerability of Bihar’s agriculture to climate change. How do initiatives under the 4th Agriculture Road Map enhance agrarian climate resilience? (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-12T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_12_03',
    date: '2026-08-12',
    title: 'The Hindu Editorial: AgriStack and Farmer Data Sovereignty — Balancing Digital Efficiency with Privacy Safeguards',
    summary: 'An editorial analysis examining the legal, tenancy, and algorithmic challenges in rolling out nationwide digital farmer registries, and the necessity of statutory consent architectures.',
    content: `The digitization of agricultural data through the AgriStack initiative represents a watershed moment in rural governance. By creating a unified digital identity linked to land parcels, the government aims to eliminate leakages in fertilizer subsidies and crop insurance.

Editorial Deliberations:
- The Exclusion Risk: In states with outdated cadastral records and disputed sharecropping tenancy, rigid algorithmic verification could disenfranchise millions of actual tenant cultivators who lack title deeds.
- Commercialization of Land Data: Strict firewalls must prevent predatory land-grabbing and aggressive algorithmic marketing by private input and credit corporations.
- Recommended Safeguards: Statutory integration with the Digital Personal Data Protection Act 2023, independent grievance ombudsmen at the panchayat level, and mandatory offline fallback options.`,
    category: 'Economy & Agriculture',
    source: 'The Hindu - Lead Editorial',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['AgriStack', 'Data Privacy', 'DPDP Act', 'Tenant Farmers', 'Agrarian Reforms', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Land and land tenure is Entry 18 of the State List in the Seventh Schedule of the Constitution.',
      'The Digital Personal Data Protection (DPDP) Act, 2023 provides for processing of digital personal data for lawful purposes with consent.',
      'Model Agricultural Land Leasing Act was drafted by NITI Aayog under T. Haque committee to legalise land leasing.'
    ],
    mainsQuestions: [
      'Digital solutions in agriculture cannot succeed without addressing underlying land tenure insecurities. Critically examine with reference to AgriStack. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_digital_agriculture_2026',
    topicClusterTitle: 'Digital Agriculture, AgriStack & Farm Sector Technology',
    publishedAt: '2026-08-12T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_12_04',
    date: '2026-08-12',
    title: 'Supreme Court Rules on Inter-State Extradition and Inherent High Court Powers Under Section 482 CrPC / BNSS',
    summary: 'A bench of the Supreme Court lays down binding principles regarding transit anticipatory bail, reiterating that personal liberty under Article 21 cannot be extinguished by jurisdictional boundaries across states.',
    content: `The Supreme Court of India has settled key procedural ambiguities regarding the power of High Courts to grant transit anticipatory bail to accused persons facing arrest by police forces of other states.

Judicial Holdings:
1. Constitutional Protection: Section 482 of the CrPC (now Section 528 of BNSS) empowers High Courts to prevent abuse of process and protect the personal liberty of citizens under Article 21.
2. Transit Bail Scope: High Courts and Sessions Courts possess the jurisdiction to grant limited transit anticipatory bail to allow the accused reasonable time to approach the competent jurisdictional court in the investigating state.
3. Anti-Harassment Safeguards: Inter-state police teams must strictly adhere to Section 41A CrPC (Section 35 BNSS) notice procedures and intimate local police authorities before effecting arrests.`,
    category: 'Polity & Governance',
    source: 'Supreme Court of India Official Judgments Archive',
    sourceUrl: 'https://main.sci.gov.in/judgments',
    sourceProvenance: {
      sourceId: 'src_sci_official',
      sourceName: 'Supreme Court of India',
      sourceType: 'GOVERNMENT',
      adapter: 'sci'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Article 21', 'Transit Bail', 'BNSS', 'Supreme Court', 'Criminal Jurisprudence', 'GS-2'],
    prelimsPointers: [
      'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 repealed and replaced the Code of Criminal Procedure, 1973.',
      'Anticipatory bail is governed by Section 438 of CrPC / Section 482 of BNSS, allowing a person to seek bail in anticipation of arrest.',
      'In Arnesh Kumar v. State of Bihar (2014), the Supreme Court mandated that arrest is not mandatory for offenses punishable with imprisonment up to 7 years.'
    ],
    mainsQuestions: [
      'Discuss the significance of transit anticipatory bail in safeguarding personal liberty against arbitrary inter-state police action. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-12T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_12_05',
    date: '2026-08-12',
    title: 'RBI Issues Master Directions on Algorithmic Underwriting and Digital Lending Governance',
    summary: 'The Reserve Bank of India mandates strict transparency, explainability, and bias audits for AI and machine learning underwriting models used by Regulated Entities (REs) and Lending Service Providers (LSPs).',
    content: `The Reserve Bank of India has issued comprehensive Master Directions on Digital Lending and Algorithmic Decision-Making to protect borrowers against predatory fintech practices.

Regulatory Mandates:
- Explainability & Auditability: Regulated banks and NBFCs must ensure that credit denial algorithms provide clear, actionable reasons to rejected loan applicants.
- Ban on Dark Patterns & Synthetic Fees: Direct prohibition on automatic opt-in insurance deductions and hidden loan processing surcharges in mobile lending apps.
- Data Minimization: Prohibits fintech apps from accessing smartphone contacts, media files, and biometric storage for debt collection harassment.`,
    category: 'Economy & Energy',
    source: 'Reserve Bank of India (RBI)',
    sourceUrl: 'https://www.rbi.org.in/',
    sourceProvenance: {
      sourceId: 'src_rbi',
      sourceName: 'Reserve Bank of India',
      sourceType: 'GOVERNMENT',
      adapter: 'rbi'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['RBI', 'Fintech', 'Digital Lending', 'Algorithmic Bias', 'Consumer Protection', 'GS-3'],
    prelimsPointers: [
      'RBI’s Digital Lending Guidelines were first formulated based on the recommendations of the Working Group on Digital Lending chaired by Jayant Kumar Dash.',
      'Regulated Entities (REs) include Commercial Banks, NBFCs, and Urban Cooperative Banks.',
      'Key Fact Statement (KFS) is legally mandatory and must disclose the Annual Percentage Rate (APR) in a standardized format.'
    ],
    mainsQuestions: [
      'How does algorithmic lending expand financial inclusion while creating new systemic risks in consumer protection? Examine RBI’s regulatory response. (250 words, 15 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_macro_economy_2026',
    topicClusterTitle: 'Macroeconomic Stability & Monetary Governance',
    publishedAt: '2026-08-12T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_12_06',
    date: '2026-08-12',
    title: 'Bihar Environment Department Confirms Kanwar Lake (Kabartal) Wetland Rejuvenation Plan',
    summary: 'The Bihar Government and MoEFCC approve a ₹65 crore integrated wetland rejuvenation plan for Kabartal, Bihar’s only Ramsar wetland site located in Begusarai district, targeting weed eradication and migratory bird protection.',
    content: `The Bihar Department of Environment, Forest and Climate Change has finalized a comprehensive conservation plan for Kabartal Wetland (Kanwar Jheel) in Begusarai district.

Ecological Interventions:
- Inflow Restoration: Re-establishing historical feeder channels connecting the Burhi Gandak river to restore perennial freshwater flushing during monsoon months.
- Invasive Species Removal: Mechanical harvesting of excessive water hyacinth (Eichhornia crassipes) that choked 60% of open water spread.
- Ecotourism & Community Watch: Establishing bird hides, watchtowers, and eco-development committees (EDCs) among local fisherfolk to curb poaching of migratory winter waterfowl.`,
    category: 'Bihar Special',
    source: 'Department of Environment, Forest & Climate Change - Government of Bihar',
    sourceUrl: 'https://forest.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_forest',
      sourceName: 'Bihar Environment & Forest Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Kabartal', 'Kanwar Lake', 'Begusarai', 'Ramsar Wetland', 'Ecology', 'BPSC_GS1'],
    prelimsPointers: [
      'Kabartal (Kanwar Lake) in Begusarai district was designated as Bihar’s first Ramsar site in November 2020 (Ramsar Site No. 2436).',
      'It is a freshwater oxbow lake formed by the meandering of the Burhi Gandak river.',
      'It lies along the Central Asian Flyway (CAF), hosting over 100 species of migratory birds including the critically endangered Baer’s Pochard.'
    ],
    mainsQuestions: [
      'Examine the ecological significance and conservation challenges of wetlands in Bihar with special reference to Kabartal. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_ecology_2026',
    topicClusterTitle: 'Bihar Environmental Conservation & Biodiversity',
    publishedAt: '2026-08-12T10:30:00.000Z'
  },
  {
    id: 'ca_2026_08_12_07',
    date: '2026-08-12',
    title: 'Indian Express Explained: The Physics and Strategic Impact of Hypersonic Glide Vehicles & Scramjet Propulsion',
    summary: 'An analytical explainer on hypersonic aerodynamics, Mach 5+ atmospheric re-entry glide trajectories, and DRDO’s Hypersonic Technology Demonstrator Vehicle (HSTDV) propulsion milestones.',
    content: `Hypersonic weapons systems represent the cutting edge of missile technology, challenging conventional anti-ballistic missile (ABM) defense architectures with their unpredictable maneuverability and extreme velocity.

Technical Dimensions:
1. Speed & Altitude Regime: Hypersonic vehicles travel faster than Mach 5 (over 6,100 km/h) in the upper atmosphere (between 20–100 km altitude).
2. Dual Architectures:
   - Hypersonic Glide Vehicles (HGVs): Boosted to sub-orbital space by a rocket and released to glide and maneuver at hypersonic speeds towards the target.
   - Hypersonic Cruise Missiles (HCMs): Powered continuously by air-breathing scramjet (supersonic combustion ramjet) engines throughout atmospheric flight.
3. Defense Implications: Existing radar tracking systems optimized for predictable parabolic ballistic trajectories struggle to maintain fire-control locks on hypersonic weaving profiles.`,
    category: 'Science & Technology',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Hypersonic Missiles', 'HSTDV', 'Scramjet', 'DRDO', 'Defense Tech', 'GS-3'],
    prelimsPointers: [
      'Scramjet operates by maintaining supersonic airflow within the combustion chamber without using rotating compressors.',
      'DRDO successfully conducted the flight demonstration of the Hypersonic Technology Demonstrator Vehicle (HSTDV) using an indigenous scramjet engine.',
      'Mach 1 represents the speed of sound (approx. 343 m/s in air at sea level).'
    ],
    mainsQuestions: [
      'How do hypersonic weapons systems alter strategic stability and nuclear deterrence in Asia? Discuss India’s indigenous hypersonic technology roadmap. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_defense_indigenisation_2026',
    topicClusterTitle: 'Defense Indigenization, Strategic Autonomy & Military Technology',
    publishedAt: '2026-08-12T06:00:00.000Z'
  }
];

console.log(`Loaded ${additionalArticles.length} articles for 2026-08-12.`);
