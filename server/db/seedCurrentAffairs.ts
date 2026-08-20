import { CurrentAffairArticle } from '../../src/types/index.js';
import { HISTORICAL_SEEDS_05_TO_09 } from './historicalSeeds_05_09.js';
import { HISTORICAL_SEEDS_10_TO_14 } from './historicalSeeds_10_14.js';

const RECENT_CURRENT_AFFAIRS: CurrentAffairArticle[] = [
  // ==========================================
  // AUGUST 20, 2026 (TODAY - 9 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_20_01',
    date: '2026-08-20',
    title: 'Anusandhan National Research Foundation (ANRF) Unveils ₹10,000 Crore Mission Core Research Grant to Propel Deep-Tech & Clean Energy R&D',
    summary: 'The Governing Board of ANRF, chaired by the Prime Minister, sanctions guidelines for translational research grants, bridging academic laboratory prototypes with industrial commercialization in quantum computing, green hydrogen catalysts, and next-generation semiconductors.',
    content: `The Anusandhan National Research Foundation (ANRF) has launched its inaugural flagship funding framework with a dedicated ₹10,000 crore corpus to foster high-impact scientific inquiry and translational research across premier state universities and national laboratories.

Key Strategic Pillars:
1. University Research Interface: At least 50% of the research grants are earmarked for tier-2/3 state public universities and colleges to democratize research infrastructure beyond IITs and IISc.
2. Industry-Academia Co-Funding: Private enterprise partnership model where industry contributes at least 50% of R&D capital for high-risk, high-reward deep-tech innovations.
3. Fast-Track Intellectual Property: Institutionalized patent-filing desks and translational incubation hubs to protect sovereign technological innovations.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Department of Science and Technology',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026082001',
    sourceProvenance: {
      sourceId: 'src_pib_dst',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ANRF', 'Science & Tech', 'DST', 'Deep Tech', 'R&D', 'GS-3'],
    prelimsPointers: [
      'ANRF was established under the Anusandhan National Research Foundation Act, 2023, replacing the Science and Engineering Research Board (SERB).',
      'The Prime Minister is the ex-officio President of the Governing Board of ANRF.',
      'Union Minister of Science & Technology and Union Minister of Education serve as ex-officio Vice-Presidents.'
    ],
    mainsQuestions: [
      'Evaluate how the Anusandhan National Research Foundation (ANRF) can address historical R&D funding deficits and foster indigenous technological innovation in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_science_innovation_2026',
    topicClusterTitle: 'Scientific Governance & National R&D Infrastructure',
    publishedAt: '2026-08-20T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_20_02',
    date: '2026-08-20',
    title: 'Bihar State Cabinet Approves Bihar Semiconductor & Precision Electronics Policy 2026 with Capital Subsidies for Testing Labs at Bihta & Begusarai',
    summary: 'The Bihar Government approves a comprehensive industrial policy offering 30% capital investment subsidy, 50% power tariff reimbursement, and dedicated cleanroom infrastructure at Bihta Mega Industrial Park to attract semiconductor assembly, test, and packaging (ATMP) units.',
    content: `The Bihar State Cabinet chaired by the Chief Minister has approved the Bihar Semiconductor and Precision Electronics Manufacturing Policy 2026 to position the state as an eastern electronics packaging corridor.

Key Policy Highlights:
1. Targeted Industrial Clusters: 250 acres developed with 24x7 treated ultra-pure water and uninterruptible power supply at Bihta (Patna) and Barauni-Begusarai industrial belt.
2. Anchor Unit Incentives: 30% capital subsidy on plant and machinery up to ₹150 crore for the first five qualifying semiconductor design and OSAT units.
3. Skill Development Partnership: Collaboration with IIT Patna, NIT Patna, and BIT Mesra (Patna Campus) to train 10,000 diploma and engineering graduates annually in VLSI design and microelectronics testing.`,
    category: 'Bihar Special',
    source: 'Information & Public Relations Department (IPRD) - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/prdbihar',
    sourceProvenance: {
      sourceId: 'src_bihar_iprd',
      sourceName: 'Bihar Information & Public Relations Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Semiconductor Policy', 'Bihta', 'Industrial Growth', 'BPSC_GS2', 'Saat Nischay-2'],
    prelimsPointers: [
      'Bihta Industrial Park is developed by Bihar Industrial Area Development Authority (BIADA).',
      'The policy complements the Central India Semiconductor Mission (ISM) with additional state-level top-up fiscal incentives.',
      'Bihar Industrial Area Development Authority (BIADA) was established under the Bihar Industrial Area Development Act, 1974.'
    ],
    mainsQuestions: [
      'Analyze the structural advantages and infrastructural bottlenecks facing Bihar in attracting high-technology precision electronics and semiconductor manufacturing industries. (250 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_industrial_2026',
    topicClusterTitle: 'Bihar Industrialization & High-Tech Manufacturing',
    publishedAt: '2026-08-20T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_20_03',
    date: '2026-08-20',
    title: 'The Hindu Editorial: Reassessing Financial Federalism and Terms of Reference for the 16th Finance Commission',
    summary: 'A critical review of vertical and horizontal tax devolution formula, discussing state concerns over cess and surcharge deductions, demographic change parameters, and fiscal consolidation trajectories under Article 280.',
    content: `The ongoing deliberations of the 16th Finance Commission (chaired by Dr. Arvind Panagariya) bring fiscal federalism to the forefront of national economic policy.

Editorial Synthesis:
- Shrinking Divisible Pool: The proliferation of cesses and surcharges—which are not shared with states under Article 270—has reduced the effective devolution share from the headline 41% to approximately 32% of gross tax revenue.
- Horizontal Equity vs Performance: Southern states argue that using 2011 Census demographic data penalizes progressive states that achieved fertility replacement rates early, while populous northern states require greater equalization grants for basic public infrastructure.
- Recommendations: Institutionalizing an explicit ceiling on cess and surcharge collections or sharing a proportion with states, and introducing disaster resilience index weighting in horizontal distribution.`,
    category: 'Polity & Governance',
    source: 'The Hindu - Lead Editorial Synthesis',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_fiscal_fed',
    tags: ['Finance Commission', 'Article 280', 'Fiscal Federalism', 'Tax Devolution', 'GS-2'],
    prelimsPointers: [
      'The Finance Commission is a quasi-judicial body constituted every five years by the President under Article 280 of the Constitution.',
      '16th Finance Commission is chaired by Dr. Arvind Panagariya with recommendations covering the 5-year award period starting April 1, 2026.',
      'Article 270 provides for sharing of union taxes with states, excluding cesses and surcharges levied for specific purposes under Article 271.'
    ],
    mainsQuestions: [
      'Examine the emerging tensions between horizontal equity and fiscal performance incentives in the context of the 16th Finance Commission’s devolution framework. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_fiscal_federalism_2026',
    topicClusterTitle: 'Fiscal Federalism & Inter-Governmental Transfers',
    publishedAt: '2026-08-20T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_20_04',
    date: '2026-08-20',
    title: 'Reserve Bank of India Issues Final Prudential Framework for Project Financing in Infrastructure with Phased 2.5% Construction Provisioning Norms',
    summary: 'The RBI releases the finalized regulatory framework for lenders financing infrastructure, real estate, and industrial projects, relaxing initial proposals to require a calibrated 2.5% standard asset provision during construction phase.',
    content: `The Reserve Bank of India (RBI) has issued the definitive Prudential Framework for Project Finance Loans, balancing banking sector credit risk buffers with the long-term debt financing needs of India's infrastructure sector.

Key Regulatory Directives:
1. Calibrated Provisioning Schedule: Standard asset provisioning during the construction phase is set at 2.5% (phased in over 3 years), reducing to 1.0% once the project achieves commercial operation date (COD).
2. Financial Closure Safeguards: Lenders must ensure mandatory equity commitments and legal encumbrance-free land availability before first loan disbursement.
3. Resolution of Stressed Assets: Specific guidelines for restructuring repayment timelines without immediate asset classification downgrade provided economic viability remains intact.`,
    category: 'Economy',
    source: 'Reserve Bank of India (RBI) Official Notifications',
    sourceUrl: 'https://www.rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
    sourceProvenance: {
      sourceId: 'src_rbi_official',
      sourceName: 'Reserve Bank of India',
      sourceType: 'GOVERNMENT',
      adapter: 'rbi'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['RBI', 'Project Finance', 'Banking Regulations', 'Infrastructure Lending', 'NPA Management', 'GS-3'],
    prelimsPointers: [
      'Commercial Operation Date (COD) is the formally declared date on which a project commences commercial output.',
      'Standard asset provisioning is a mandatory percentage set aside by banks as a cushion against potential future loan defaults.',
      'RBI operates under the Reserve Bank of India Act, 1934 and Banking Regulation Act, 1949.'
    ],
    mainsQuestions: [
      'Evaluate how the RBI’s prudential norms on project finance safeguard banking sector stability while addressing the infrastructure investment deficit. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_banking_infrastructure_2026',
    topicClusterTitle: 'Banking Stability, Credit Governance & Infrastructure Finance',
    publishedAt: '2026-08-20T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_20_05',
    date: '2026-08-20',
    title: 'ISRO and IN-SPACe Inaugurate Dedicated Cleanroom and Satellite Thermal Vacuum Testing Hub for Commercial Space Startups at Peenya',
    summary: 'Under the Indian Space Policy, ISRO and IN-SPACe open a shared multi-user environmental test facility, enabling domestic private satellite builders to qualify space hardware indigenously without sending payloads abroad.',
    content: `The Indian Space Research Organisation (ISRO) and the Indian National Space Promotion and Authorization Centre (IN-SPACe) have operationalized a state-of-the-art Space Technology Incubation and Testing Facility at Peenya, Bengaluru.

Core Capabilities:
- ISO Class-7 Cleanrooms: Modular integration bays for nanosatellites and microsatellites up to 500 kg payload capacity.
- Thermo-Vacuum Chamber (TVAC): Simulates deep-space thermal extremes (-150°C to +150°C) and ultra-high vacuum conditions to validate satellite electronic durability.
- Electromagnetic Compatibility (EMC/EMI) Chamber: Assures telemetry and communication frequencies do not interfere with onboard avionics.`,
    category: 'Science & Technology',
    source: 'Indian Space Research Organisation (ISRO) Official Updates',
    sourceUrl: 'https://www.isro.gov.in/PressReleases.html',
    sourceProvenance: {
      sourceId: 'src_isro_official',
      sourceName: 'Indian Space Research Organisation (ISRO)',
      sourceType: 'GOVERNMENT',
      adapter: 'isro'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ISRO', 'IN-SPACe', 'Space Economy', 'Space Startups', 'Peenya', 'GS-3'],
    prelimsPointers: [
      'IN-SPACe is an autonomous single-window agency under the Department of Space to authorize and promote non-government private entities in space activities.',
      'NewSpace India Limited (NSIL) is the commercial arm of ISRO incorporated in 2019 under the administrative control of Department of Space.',
      'Indian Space Policy 2023 delineates the distinct operational roles of ISRO, IN-SPACe, and NSIL.'
    ],
    mainsQuestions: [
      'Discuss how the commercialization of the Indian space sector under IN-SPACe can expand India’s share in the global space economy. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_space_governance_2026',
    topicClusterTitle: 'Space Economy, Satellite Technology & Commercial Spaceflight',
    publishedAt: '2026-08-20T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_20_06',
    date: '2026-08-20',
    title: 'Indian Express Explained: The Constitutional Architecture and Judicial Review of Article 356 Emergency Powers',
    summary: 'An authoritative analysis of President’s Rule under Article 356, examining the landmark S.R. Bommai guidelines, scope of judicial review over subjective executive satisfaction, and federal safeguards against arbitrary state government dismissal.',
    content: `A legal and constitutional explainer examining the application and limits of Article 356 of the Constitution of India in maintaining federal equilibrium.

Analytical Framework:
1. Constitutional Trigger: Article 356 empowers the President to impose President’s Rule in a state upon receipt of a report from the Governor or otherwise, if satisfied that governance cannot be carried on in accordance with the Constitution.
2. The Bommai Doctrine: In S.R. Bommai v. Union of India (1994), a 9-judge bench ruled that presidential proclamation is subject to judicial review, floor tests on the Legislative Assembly floor are mandatory, and secularism is part of the basic structure.
3. Parliamentary Approval: A proclamation must be approved by both Houses of Parliament within two months; if not approved, the dissolved state assembly is revived.`,
    category: 'Polity & Governance',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Article 356', 'President Rule', 'SR Bommai', 'Federalism', 'Emergency Provisions', 'GS-2'],
    prelimsPointers: [
      'Article 356 proclamation must be approved by simple majority in both Houses of Parliament within two months.',
      'Initial duration of President’s Rule is 6 months, extendable up to a maximum of 3 years with parliamentary approval every 6 months.',
      '44th Amendment Act 1978 introduced Section 356(5) requiring a national emergency or ECI certificate of election difficulty to extend beyond 1 year.'
    ],
    mainsQuestions: [
      'Critically evaluate the impact of the S.R. Bommai judgment in curbing the partisan misuse of Article 356 and strengthening cooperative federalism. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_federalism_reforms_2026',
    topicClusterTitle: 'Constitutional Emergency Powers & Federal Autonomy',
    publishedAt: '2026-08-20T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_20_07',
    date: '2026-08-20',
    title: 'MoEFCC Designates Two New Marine Protected Areas in Andaman & Nicobar under Central Asian Flyway Conservation Action Plan',
    summary: 'The Ministry of Environment, Forest and Climate Change notifies coral reef and mangrove buffer conservation zones across the Ritchie’s Archipelago and Great Nicobar coastal shelves, curbing mechanized trawling and protecting nesting grounds of Leatherback Sea Turtles.',
    content: `The Union Ministry of Environment, Forest and Climate Change (MoEFCC) has notified two new Ecologically Sensitive Marine Protected Areas (MPAs) in the Andaman and Nicobar archipelago.

Conservation Directives:
- Coastal Zone Protection: Strict enforcement of Coastal Regulation Zone (CRZ-I) standards prohibiting commercial aquaculture discharge and coral aggregate dredging.
- Pelagic Species Shield: Safeguarding transboundary migration corridors for Dugongs (sea cows), Giant Leatherback Turtles, and migratory shorebirds along the Central Asian Flyway.
- Community Co-Management: Empowering traditional indigenous fisherfolk with regulated sustainable subsistence rights while monitoring eco-tourism footfalls.`,
    category: 'Environment',
    source: 'Ministry of Environment, Forest and Climate Change (MoEFCC)',
    sourceUrl: 'https://moef.gov.in/',
    sourceProvenance: {
      sourceId: 'src_moefcc',
      sourceName: 'MoEFCC Official Portal',
      sourceType: 'GOVERNMENT',
      adapter: 'moefcc'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['MoEFCC', 'Marine Protected Areas', 'Coral Reefs', 'Andaman Nicobar', 'Biodiversity', 'GS-3'],
    prelimsPointers: [
      'Dugong (Dugong dugon) is India’s only herbivorous marine mammal, listed as Vulnerable on IUCN Red List and Schedule I of Wildlife Protection Act, 1972.',
      'India’s first Dugong Conservation Reserve was established in Palk Bay, Tamil Nadu.',
      'Great Nicobar Biosphere Reserve was included in UNESCO’s Man and the Biosphere (MAB) programme in 2013.'
    ],
    mainsQuestions: [
      'Analyze the delicate trade-offs between strategic maritime infrastructure expansion and marine biodiversity conservation in island ecosystems. (200 words, 12.5 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_marine_biodiversity_2026',
    topicClusterTitle: 'Marine Ecology, Coral Conservation & Island Governance',
    publishedAt: '2026-08-20T10:30:00.000Z'
  },
  {
    id: 'ca_2026_08_20_08',
    date: '2026-08-20',
    title: 'Bihar Agriculture Department Launches Solar-Powered Micro-Irrigation Scheme (PMKSY-Har Khet Ko Pani) Across 15 Drought-Prone Districts',
    summary: 'The Bihar Government rolls out 80% subsidized standalone solar pumping sets and automated drip-sprinkler units in south Bihar districts (Gaya, Nawada, Aurangabad, Banka) to conserve groundwater and double pulse and oilseed acreage.',
    content: `The Department of Agriculture, Government of Bihar, has launched Phase-III of the decentralized solar micro-irrigation mission under the state's 4th Agriculture Roadmap (Krishi Roadmap 4).

Key Strategic Interventions:
1. High Capital Subsidy: 80% cumulative financial assistance (60% Central PM-KUSUM + 20% State Top-Up) for small and marginal farmers installing 3 HP to 7.5 HP solar water pumps.
2. Drip & Sprinkler Mandate: Linking all subsidized solar pump installations with pressurized micro-irrigation lines to achieve 'Per Drop More Crop' efficiency.
3. Climate-Resilient Agriculture: Promoting crop diversification from water-guzzling paddy to low-water millets (Shree Anna), pulses, and maize in drought-vulnerable plateau-fringe blocks.`,
    category: 'Bihar Special',
    source: 'Department of Agriculture - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/krishi',
    sourceProvenance: {
      sourceId: 'src_bihar_krishi',
      sourceName: 'Bihar Agriculture Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_geo_rivers',
    tags: ['Bihar Special', 'Krishi Roadmap 4', 'PM-KUSUM', 'Micro-Irrigation', 'BPSC_GS2', 'Agriculture'],
    prelimsPointers: [
      'Bihar’s 4th Agriculture Roadmap (2023–2028) emphasizes organic farming corridors along the Ganga, climate-resilient agriculture, and millet production.',
      'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) was launched in 2015 with components: Accelerated Irrigation Benefits Programme (AIBP), Har Khet Ko Pani (HKKP), and Per Drop More Crop (PDMC).',
      'PM-KUSUM Scheme was launched by MNRE in 2019 to provide energy security for farmers.'
    ],
    mainsQuestions: [
      'Examine the effectiveness of decentralized solar irrigation in tackling recurring agricultural drought and groundwater depletion in south Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agriculture_2026',
    topicClusterTitle: 'Bihar Agriculture Modernization & Climate-Resilient Farming',
    publishedAt: '2026-08-20T11:00:00.000Z'
  },
  {
    id: 'ca_2026_08_20_09',
    date: '2026-08-20',
    title: 'Supreme Court Launches Digital Supreme Court Reports (e-SCR) 2.0 with AI-Assisted Vernacular Translation in 22 Scheduled Languages',
    summary: 'The Supreme Court of India inaugurates the upgraded e-SCR 2.0 portal powered by the AI-based SUVAS (Supreme Court Vidhik Anuvaad Software), providing free open-access judicial search and verified vernacular translations of all 37,000+ judgments since 1950.',
    content: `The Supreme Court of India, under the auspices of its e-Committees led by the Chief Justice of India, has unveiled the upgraded Digital Supreme Court Reports (e-SCR) 2.0.

Key Transformative Features:
1. Complete Free Open Access: Democratizes legal literature by eliminating commercial paywalls, enabling law students, rural advocates, and citizens across India to access authenticated judgments.
2. AI-Assisted Translation (SUVAS): Translates English judicial pronouncements into 22 official languages listed under the Eighth Schedule of the Constitution, validated by a human legal translation scrutiny cell.
3. Neural Semantic Search: Case-law search using factual queries, constitutional article cross-references, and citation graph exploration.`,
    category: 'Polity & Governance',
    source: 'Supreme Court of India Official Portal',
    sourceUrl: 'https://main.sci.gov.in/e-scr',
    sourceProvenance: {
      sourceId: 'src_sci_official',
      sourceName: 'Supreme Court of India',
      sourceType: 'GOVERNMENT',
      adapter: 'sci'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Supreme Court', 'e-SCR', 'SUVAS', 'E-Courts', 'Legal Tech', 'Article 21', 'GS-2'],
    prelimsPointers: [
      'SUVAS (Supreme Court Vidhik Anuvaad Software) is an AI-powered translation tool developed specifically for the Indian judiciary.',
      'The e-Courts Integrated Mission Mode Project is a national e-Governance project for the ICT development of district and subordinate courts.',
      'Article 348(1) of the Constitution mandates that all proceedings in the Supreme Court and every High Court shall be in the English language until Parliament by law otherwise provides.'
    ],
    mainsQuestions: [
      'Discuss how digital justice initiatives like e-SCR and vernacular AI translations uphold the constitutional right to access to justice under Article 21. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'E-Courts, Digital Justice & Judicial Accessibility',
    publishedAt: '2026-08-20T12:00:00.000Z'
  },

  // ==========================================
  // AUGUST 19, 2026 (9 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_19_01',
    date: '2026-08-19',
    title: 'Union Cabinet Approves National Semiconductor Mission 2.0 with ₹35,000 Crore Outlay for Compound Silicon & Advanced Packaging',
    summary: 'The Cabinet Committee on Economic Affairs (CCEA) approves India Semiconductor Mission (ISM) Phase 2, focusing on compound semiconductors (Silicon Carbide and Gallium Nitride), display fabs, and automated testing & OSAT facilities.',
    content: `The Union Cabinet chaired by the Prime Minister has approved the expanded India Semiconductor Mission 2.0 (ISM 2.0) with an enhanced fiscal outlay of ₹35,000 crore to establish domestic high-end manufacturing.

Key Mission Highlights:
1. Focus on Compound Semiconductors: 50% fiscal support for Silicon Carbide (SiC) and Gallium Nitride (GaN) foundries essential for electric vehicle (EV) powertrains, 6G telecom, and defense radars.
2. Advanced Packaging (OSAT/ATMP): Establishing 8 new outsourced assembly and testing hubs across major industrial corridors.
3. Design-Linked Incentive (DLI): Scaling incentives for domestic fabless startups designing AI accelerator chips and RISC-V processors.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Ministry of Electronics and IT',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081901',
    sourceProvenance: {
      sourceId: 'src_pib_meity',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Semiconductor Mission', 'ISM 2.0', 'MeitY', 'Silicon Carbide', 'GS-3', 'Science & Tech'],
    prelimsPointers: [
      'India Semiconductor Mission (ISM) was initially launched in 2021 with a ₹76,000 crore outlay under the Digital India Corporation.',
      'Silicon Carbide (SiC) and Gallium Nitride (GaN) are wide bandgap (WBG) semiconductors operating at higher voltages and temperatures than traditional silicon.',
      'India’s first commercial semiconductor fab is situated at Dholera, Gujarat, developed by Tata Electronics and PSMC.'
    ],
    mainsQuestions: [
      'Analyze the geopolitical and economic significance of building domestic semiconductor foundry capacity in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_semiconductor_2026',
    topicClusterTitle: 'Semiconductor Sovereignty & High-Tech Manufacturing',
    publishedAt: '2026-08-19T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_19_02',
    date: '2026-08-19',
    title: 'Bihar State Cabinet Sanctions Dedicated Makhana Export Hub and Multi-Modal Cargo Terminal at Darbhanga Airport',
    summary: 'The Bihar Government approves ₹380 crore for developing an integrated cold chain, radiation processing facility, and direct air cargo terminal at Darbhanga to accelerate export of GI-tagged Mithila Makhana to European and North American markets.',
    content: `The Bihar State Cabinet chaired by the Chief Minister has accorded administrative sanction for establishing an International Air Cargo and Processing Hub at Darbhanga.

Key Strategic Pillars:
1. APEDA-Certified Export Terminal: Direct air freight connectivity from Darbhanga Airport to international hub airports (Delhi, Mumbai) with specialized nitrogen-flushed packaging for Makhana.
2. Farmer Producer Organization (FPO) Tie-up: Direct procurement linkages for 12,000 registered makhana growers in Darbhanga, Madhubani, Samastipur, and Saharsa districts.
3. Irradiation & Phytosanitary Clearance: Eliminates quarantine barriers for organic agricultural shipments to the European Union and the United States.`,
    category: 'Bihar Special',
    source: 'Information & Public Relations Department (IPRD) - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/prdbihar',
    sourceProvenance: {
      sourceId: 'src_bihar_iprd',
      sourceName: 'Bihar Information & Public Relations Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Mithila Makhana', 'Darbhanga Airport', 'Agro-Exports', 'BPSC_GS2', 'Saat Nischay-2'],
    prelimsPointers: [
      'Mithila Makhana received Geographical Indication (GI) status in August 2022.',
      'Bihar accounts for approximately 85% of total national makhana production.',
      'ICAR-National Research Centre for Makhana is situated in Darbhanga, Bihar.'
    ],
    mainsQuestions: [
      'Discuss how agro-industrial logistics infrastructure can transform regional agricultural value chains in north Bihar. (250 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-19T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_19_03',
    date: '2026-08-19',
    title: 'The Hindu Editorial: Reforming the Inter-State River Water Disputes Act to Overcome Adjudication Delays',
    summary: 'A critical review of the Inter-State River Water Disputes Act 1956, analyzing why ad-hoc tribunals fail to deliver timely awards and evaluating the proposed permanent standalone tribunal mechanism.',
    content: `Inter-state river water conflicts represent a chronic friction point in Indian federalism. Despite the constitutional framework under Article 262 and the Inter-State River Water Disputes (ISRWD) Act 1956, dispute resolution remains mired in multi-decade litigation.

Editorial Synthesis:
- Adjudication Bottlenecks: Historical disputes like Cauvery, Krishna, and Mahanadi demonstrate that ad-hoc tribunals take upwards of 15–20 years to deliver final awards, which are then challenged before the Supreme Court under Article 136.
- Structural Reform: The Inter-State River Water Disputes (Amendment) Bill proposes a single permanent tribunal with multiple benches and a mandatory 1-year dispute resolution committee (DRC) conciliation phase.
- Way Forward: Institutionalizing real-time telemetry data sharing under the Central Water Commission to prevent evidentiary disputes between riparian upper and lower states.`,
    category: 'Polity & Governance',
    source: 'The Hindu - Lead Editorial Synthesis',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_fiscal_fed',
    tags: ['Article 262', 'River Water Disputes', 'Federalism', 'Inter-State Council', 'GS-2'],
    prelimsPointers: [
      'Article 262 empowers Parliament to provide for the adjudication of any dispute relating to the use, distribution or control of waters of any inter-state river.',
      'Article 262(2) allows Parliament to bar the jurisdiction of the Supreme Court or any other court in such disputes.',
      'The River Boards Act, 1956 was enacted under Entry 56 of the Union List for river basin development.'
    ],
    mainsQuestions: [
      'Evaluate the effectiveness of institutional dispute resolution mechanisms for inter-state river water disputes in India. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_water_governance_2026',
    topicClusterTitle: 'Water Governance & Cooperative Federalism',
    publishedAt: '2026-08-19T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_19_04',
    date: '2026-08-19',
    title: 'Supreme Court Sets Strict Guidelines on Preventive Detention, Reiterates Personal Liberty Under Article 21',
    summary: 'The Supreme Court rules that preventive detention laws are exceptional colonial measures and must strictly conform to procedural safeguards under Article 22(5) with zero unexplained executive delays in considering detenue representations.',
    content: `A three-judge bench of the Supreme Court has quashed a preventive detention order, laying down authoritative directives for Advisory Boards and state home departments across the country.

Judicial Directives:
1. Strict Construction: Preventive detention is an extraordinary power that deprives liberty without a trial; every procedural delay by the executive vitiates the detention order.
2. Right to Representation: Article 22(5) guarantees an expeditious consideration of the detainee’s representation by the government independently of the Advisory Board’s opinion.
3. Law and Order vs Public Order: The court reiterated that ordinary penal infractions affecting 'law and order' cannot be weaponized to invoke preventive detention laws meant solely for grave threats to 'public order'.`,
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
    tags: ['Article 21', 'Article 22', 'Preventive Detention', 'Supreme Court', 'Fundamental Rights', 'GS-2'],
    prelimsPointers: [
      'Article 22(1) and 22(2) confer rights against arrest, but these do not apply to persons arrested under preventive detention laws (Article 22(3)).',
      'Article 22(4) mandates that no preventive detention order can exceed 3 months unless an Advisory Board headed by High Court judges confirms sufficient cause.',
      '44th Amendment Act 1978 sought to reduce the maximum detention period to 2 months, but that provision has not been formally brought into force.'
    ],
    mainsQuestions: [
      'Distinguish between punitive and preventive detention. Analyze how the Supreme Court has safeguarded personal liberty against executive excess under preventive detention laws. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_constitutional_liberties_2026',
    topicClusterTitle: 'Fundamental Rights & Judicial Safeguards',
    publishedAt: '2026-08-19T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_19_05',
    date: '2026-08-19',
    title: 'Indian Express Explained: Understanding Carbon Border Adjustment Mechanism (CBAM) Impact on Indian Steel & Aluminum',
    summary: 'A deep-dive analysis of the European Union’s CBAM transitioning to full fiscal imposition in 2026, examining carbon accounting standards, emission intensity of Indian blast furnaces, and India’s countermeasures.',
    content: `As the European Union’s Carbon Border Adjustment Mechanism (CBAM) enters its definitive compliance phase requiring importers to purchase CBAM certificates, Indian primary industrial exporters face significant tariff barriers.

Analytical Breakdown:
1. Carbon Intensity Disparity: Indian steel producers emit approximately 2.3 to 2.8 tonnes of CO2 per tonne of crude steel (owing to coal-based blast furnace route) compared to EU electric arc furnace average of ~1.4 tonnes.
2. Economic Exposure: Approximately $8.5 billion of Indian exports (primarily steel, aluminum, iron ore, fertilizers, and hydrogen) to EU markets are directly subject to CBAM equalization tariffs.
3. India’s Strategic Response: Accelerating domestic Carbon Credit Trading Scheme (CCTS) under the Energy Conservation (Amendment) Act and proposing green steel production using sponge iron and green hydrogen.`,
    category: 'Economy & Environment',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['CBAM', 'European Union', 'Carbon Border Tax', 'Steel Industry', 'CCTS', 'GS-3'],
    prelimsPointers: [
      'CBAM is part of the European Union’s "Fit for 55" package aiming to reduce greenhouse gas emissions by 55% by 2030.',
      'Bureau of Energy Efficiency (BEE) is the nodal agency administering India’s Carbon Credit Trading Scheme (CCTS).',
      'Common But Differentiated Responsibilities (CBDR-RC) is a foundational principle under the UNFCCC Paris Agreement.'
    ],
    mainsQuestions: [
      'Critically examine the compatibility of unilateral carbon border tax measures with WTO non-discrimination principles and UNFCCC climate justice tenets. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_climate_trade_2026',
    topicClusterTitle: 'International Trade, Climate Policy & CBAM',
    publishedAt: '2026-08-19T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_19_06',
    date: '2026-08-19',
    title: 'Bihar State Pollution Control Board Deploys Real-Time IoT Air Quality Monitoring Across All 38 District Headquarters',
    summary: 'Under the National Clean Air Programme (NCAP) and State Clean Air Action Plan, Bihar completes deployment of 120 Continuous Ambient Air Quality Monitoring Stations (CAAQMS) with automated PM2.5 and PM10 micro-sensors.',
    content: `The Bihar State Pollution Control Board (BSPCB) has completed the statewide installation of its IoT-enabled Continuous Ambient Air Quality Monitoring Network (CAAQMN), establishing dense environmental monitoring across all 38 districts.

Key Monitoring Highlights:
- Real-Time Public Dashboard: Data transmitted every 15 minutes to Central Pollution Control Board (CPCB) servers and public mobile applications (Sameer app).
- Micro-Level Action Plans: Enabling municipal corporations in Patna, Muzaffarpur, Gaya, and Bhagalpur to implement targeted dust suppression, mechanical sweeping, and construction site compliance.
- Bio-Mass Burning Surveillance: Integrating ISRO satellite remote sensing fire counts with district pollution rapid action teams.`,
    category: 'Bihar Special',
    source: 'Department of Environment, Forest & Climate Change - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/forest',
    sourceProvenance: {
      sourceId: 'src_bihar_forest',
      sourceName: 'Bihar Pollution Control Board',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_geo_rivers',
    tags: ['Bihar Special', 'BSPCB', 'Air Quality', 'NCAP', 'Environment', 'BPSC_GS2'],
    prelimsPointers: [
      'National Air Quality Index (AQI) considers 8 pollutants: PM10, PM2.5, NO2, SO2, CO, O3, NH3, and Pb.',
      'Central Pollution Control Board (CPCB) was constituted under the Water (Prevention and Control of Pollution) Act, 1974.',
      'BSPCB was established in 1974 under Section 4 of the Water Act.'
    ],
    mainsQuestions: [
      'Evaluate the geographical and meteorological factors contributing to severe winter air pollution in the Indo-Gangetic Plain with special focus on Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_environmental_governance_2026',
    topicClusterTitle: 'Environmental Governance & Urban Air Quality',
    publishedAt: '2026-08-19T09:30:00.000Z'
  },
  {
    id: 'ca_2026_08_19_07',
    date: '2026-08-19',
    title: 'Department of Biotechnology Launches National Genome India Mission Database with 20,000 Sequenced Human Genomes',
    summary: 'The Department of Biotechnology (DBT) formally opens access to the Indian Reference Genome Reference Database, establishing disease biomarker baselines specific to diverse endogamous sub-populations of India.',
    content: `The Department of Biotechnology, Ministry of Science and Technology, has announced the completion of the 20,000 whole-genome sequencing milestone under the Genome India Project (GIP).

Key Scientific Contributions:
- Indigenous Disease Epidemiology: Identification of genetic variants associated with rare monogenic diseases, drug responses (pharmacogenomics), and susceptibility to non-communicable diseases (diabetes, cardiovascular conditions) in Indian lineages.
- Data Sovereign Storage: Managed securely at the Indian Biological Data Centre (IBDC) located at the Regional Centre for Biotechnology (RCB), Faridabad.
- Open Science Framework: Enabling verified academic and clinical researchers to query anonymized variant frequencies under the National Ethical Guidelines for Biomedical Research.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Ministry of Science & Technology',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081907',
    sourceProvenance: {
      sourceId: 'src_pib_dst',
      sourceName: 'Department of Biotechnology',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Genome India Project', 'DBT', 'Biotechnology', 'Genomics', 'IBDC', 'GS-3'],
    prelimsPointers: [
      'Genome India Project is spearheaded by the Centre for Brain Research (CBR) at IISc Bangalore along with 20 national partner institutions.',
      'Indian Biological Data Centre (IBDC) at Faridabad is India’s first national repository for life science data.',
      'Human genome consists of approximately 3.1 billion base pairs of DNA across 23 chromosome pairs.'
    ],
    mainsQuestions: [
      'Examine the potential of precision medicine and population genomics in transforming public healthcare delivery in India. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_biotechnology_2026',
    topicClusterTitle: 'Genomics, Precision Medicine & Biotechnology',
    publishedAt: '2026-08-19T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_19_08',
    date: '2026-08-19',
    title: 'Ministry of Power Notifies Operational Guidelines for 24x7 Resource Adequacy Framework to Manage Peak Energy Demand',
    summary: 'The Union Ministry of Power mandates that all State Distribution Companies (DISCOMs) formulate ten-year rolling Resource Adequacy plans to prevent grid instability during peak summer and winter demand spikes.',
    content: `To ensure uninterrupted power supply as India’s peak electricity demand surpasses 260 GW, the Ministry of Power under the Electricity Act 2003 has notified the National Resource Adequacy Guidelines.

Key Mandates:
1. 10-Year Rolling Capacity Planning: DISCOMs must contract long-term firm capacity (including thermal, hydro, and battery energy storage) to meet projected peak loads with a mandatory 15% reserve margin.
2. Capacity Market Mechanism: Introduction of market-based capacity contracts on power exchanges to remunerate flexible peaking power stations and pumped storage projects (PSP).
3. Non-Compliance Penalty: DISCOMs failing to tie up adequate generation will face regulatory disincentives and curtailed access to Central Government power development grants.`,
    category: 'Economy & Energy',
    source: 'Press Information Bureau (PIB) - Ministry of Power',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081908',
    sourceProvenance: {
      sourceId: 'src_pib_power',
      sourceName: 'Ministry of Power',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Power Sector', 'DISCOMs', 'Resource Adequacy', 'Energy Transition', 'Electricity Act', 'GS-3'],
    prelimsPointers: [
      'Central Electricity Authority (CEA) is a statutory organization under Section 70 of the Electricity Act, 2003.',
      'Pumped Storage Projects (PSP) function as gravitational water batteries for grid energy storage.',
      'National Grid is operated by Grid Controller of India Limited (Grid-India, formerly POSOCO).'
    ],
    mainsQuestions: [
      'Discuss the structural challenges confronting Indian power distribution utilities (DISCOMs) in maintaining grid reliability while integrating variable renewable energy. (250 words, 15 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_energy_transition_2026',
    topicClusterTitle: 'Grid Modernization & Energy Transition',
    publishedAt: '2026-08-19T11:00:00.000Z'
  },
  {
    id: 'ca_2026_08_19_09',
    date: '2026-08-19',
    title: 'Election Commission of India Issues Comprehensive Guidelines for Artificial Intelligence Transparency in Political Advertising',
    summary: 'The ECI mandates watermarking of AI-generated audio/video content, bans synthetic deceptive deepfakes during model code periods, and enforces strict disclosure on political party expenditure on generative algorithms.',
    content: `The Election Commission of India (ECI), exercising its constitutional powers under Article 324, has notified the Standard Operating Procedure (SOP) for Artificial Intelligence and Synthetic Media during elections.

Core Directives:
1. Mandatory Synthetic Media Tagging: All political parties, candidates, and authorized campaigners must display prominent, visible, and indelible disclaimers ('AI-Generated / Synthetic Media') on altered audiovisual broadcasts.
2. 3-Hour Rapid Takedown Protocol: Major social media platforms (Intermediaries under IT Rules 2021) must remove flagged deepfake impersonations of candidates or election officials within 3 hours of nodal officer notification.
3. Expenditure Accounting: Digital advertising expenditure on algorithmic targeting, prompt engineering, and synthetic avatar generation must be included in candidate statutory election expense limits.`,
    category: 'Polity & Governance',
    source: 'Election Commission of India (ECI) Notifications',
    sourceUrl: 'https://eci.gov.in/notifications',
    sourceProvenance: {
      sourceId: 'src_eci_official',
      sourceName: 'Election Commission of India',
      sourceType: 'GOVERNMENT',
      adapter: 'eci'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['ECI', 'Article 324', 'Elections', 'Artificial Intelligence', 'Deepfakes', 'Model Code of Conduct', 'GS-2'],
    prelimsPointers: [
      'Article 324 vests superintendence, direction, and control of elections in the Election Commission of India.',
      'Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 govern platform takedown obligations.',
      'Representation of the People Act, 1951 (Section 77) governs candidate election expenditure disclosures.'
    ],
    mainsQuestions: [
      'Examine the threats posed by generative artificial intelligence and deepfakes to electoral integrity. Evaluate the regulatory mechanisms available with the Election Commission of India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_electoral_reforms_2026',
    topicClusterTitle: 'Democratic Reforms & Electoral Integrity',
    publishedAt: '2026-08-19T12:00:00.000Z'
  },

  // ==========================================
  // AUGUST 18, 2026 (9 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_18_01',
    date: '2026-08-18',
    title: 'Union Cabinet Approves Deep Ocean Submersible Mission "Samudrayaan-II" for Critical Minerals Exploration',
    summary: 'The Cabinet Committee on Economic Affairs (CCEA) greenlights the second phase of India’s Deep Ocean Mission, equipping the Matsya-6000 submersible with advanced sonar sensors for surveying polymetallic nodules and rare earth elements in the Central Indian Ocean Basin.',
    content: `The Union Cabinet chaired by the Prime Minister has formally approved the second phase of the Deep Ocean Mission (DOM) titled "Samudrayaan-II" with a financial outlay of ₹4,077 crore. 

Key Mission Dimensions:
1. Matsya-6000 Deep Sea Vehicle: Developed by the National Institute of Ocean Technology (NIOT), Chennai, the vehicle is designed to carry a 3-member crew to a depth of 6,000 meters in the Indian Ocean to study abyssal ecology and ocean floor minerals.
2. Central Indian Ocean Basin (CIOB): India holds exploration rights allocated by the International Seabed Authority (ISA) over 75,000 sq km for Polymetallic Nodules (PMN) containing copper, nickel, cobalt, and manganese.
3. Blue Economy Roadmap: Aligns with India's draft National Blue Economy Policy to leverage marine resources in an environmentally sustainable manner without disrupting hydrothermal vent ecosystems.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Ministry of Earth Sciences',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081801',
    sourceProvenance: {
      sourceId: 'src_pib_moes',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Deep Ocean Mission', 'Samudrayaan', 'Matsya-6000', 'Critical Minerals', 'GS-3', 'Science & Tech'],
    prelimsPointers: [
      'NIOT Chennai is the nodal agency developing Matsya-6000.',
      'Polymetallic nodules contain manganese, iron, copper, nickel, and cobalt.',
      'International Seabed Authority (ISA) is headquartered in Kingston, Jamaica, established under UNCLOS.'
    ],
    mainsQuestions: [
      'Examine the strategic and economic significance of the Deep Ocean Mission in securing critical mineral supply chains for India. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_critical_minerals_2026',
    topicClusterTitle: 'Critical Minerals & Deep Ocean Exploration',
    publishedAt: '2026-08-18T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_18_02',
    date: '2026-08-18',
    title: 'Bihar State Cabinet Sanctions Phase-2 of Kosi-Mechi Intra-State River Link Project',
    summary: 'The Bihar Government approves ₹4,900 crore for the eastern component of the Kosi-Mechi link project, creating an extensive irrigation network for 2.14 lakh hectares in the Seemanchal districts of Araria, Kishanganj, Purnia, and Katihar.',
    content: `The Bihar State Cabinet chaired by Chief Minister has accorded administrative approval for Phase-2 of the Kosi-Mechi River Linkage Project, India's second major intra-state river interlinking initiative after the Ken-Betwa link.

Key Project Highlights:
1. Beneficiary Region: The project diversion will provide assured canal irrigation to 2,14,843 hectares of agricultural land across four north-eastern districts of Seemanchal (Araria, Kishanganj, Purnia, and Katihar).
2. Flood Mitigation: Diverts surplus monsoon floodwaters from the Kosi river basin (via Eastern Kosi Main Canal) into the Mechi river, a tributary of the Mahananda river.
3. Environmental Sanctions: The project has received green clearance from the Ministry of Environment, Forest and Climate Change (MoEFCC) ensuring no submerged forest tracts or displaced wildlife corridors along the Mahananda basin.`,
    category: 'Bihar Special',
    source: 'Information & Public Relations Department (IPRD) - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/prdbihar',
    sourceProvenance: {
      sourceId: 'src_bihar_iprd',
      sourceName: 'Bihar Information & Public Relations Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_geo_rivers',
    tags: ['Bihar Special', 'Kosi-Mechi Link', 'Seemanchal', 'Irrigation', 'Saat Nischay-2', 'BPSC_GS1', 'BPSC_GS2'],
    prelimsPointers: [
      'Kosi-Mechi is India’s second intra-state river link project approved by the National Water Development Agency (NWDA).',
      'Mechi river is a transboundary tributary of the Mahananda river originating in the Mahabharat Range of Nepal.',
      'The project fulfills the "Har Khet Tak Sinchai Ka Paani" goal under Saat Nischay-2.'
    ],
    mainsQuestions: [
      'Analyze how river interlinking projects in north Bihar can address the dual challenge of recurrent floods and regional agricultural distress. (250 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_infrastructure_2026',
    topicClusterTitle: 'Bihar Infrastructure & Water Resources',
    publishedAt: '2026-08-18T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_18_03',
    date: '2026-08-18',
    title: 'The Hindu Editorial: Balancing Monetary Easing and Inflation Persistence in Emerging Markets',
    summary: 'An analytical breakdown of central banks navigating rate cuts while food inflation volatility and global supply chain realignments remain persistent.',
    content: `The global monetary policy cycle is at an inflection point. With headline inflation cooling in advanced economies, central banks are initiating rate cuts. However, for emerging market economies like India, the Reserve Bank of India’s Monetary Policy Committee (MPC) faces a structural trilemma.

Editorial Synthesis:
- Viewpoint A (Growth Stimulus): Proponents argue that sustained high real interest rates compress private corporate capital expenditures and household discretionary consumption. Lowering the policy repo rate is vital to stimulate employment generation.
- Viewpoint B (Prudential Caution): RBI’s conservative approach highlights that persistent climate-induced food price shocks (vegetables, pulses) can easily de-anchor long-term inflationary expectations if premature rate cuts fuel aggregate demand.
- Policy Recommendation: Continue the state of flexible data-dependent targeting while leveraging targeted supply-side fiscal interventions (buffer stock liquidation, import duty rationalization) to tame food inflation.`,
    category: 'Economy & Banking',
    source: 'The Hindu - Lead Editorial Synthesis',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_mpc',
    tags: ['Monetary Policy', 'RBI', 'Inflation Targeting', 'The Hindu Editorial', 'GS-3'],
    prelimsPointers: [
      'Flexible inflation targeting framework was statutory adopted in India in 2016.',
      'Core inflation excludes volatile food and fuel components.',
      'Headline inflation is measured by the Consumer Price Index (CPI) Combined compiled by NSO.'
    ],
    mainsQuestions: [
      'Discuss the efficacy of monetary policy tools in containing supply-side food inflation in India. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_monetary_policy_2026',
    topicClusterTitle: 'Monetary Policy & Inflation Dynamics',
    publishedAt: '2026-08-18T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_18_04',
    date: '2026-08-18',
    title: 'NITI Aayog Releases State Energy and Climate Index (SECI) 2026: Bihar Shows Significant Gains in Rooftop Solar',
    summary: 'NITI Aayog’s updated SECI ranks Indian states across Clean Energy Initiatives, Grid Reliability, Energy Efficiency, and Environmental Sustainability.',
    content: `NITI Aayog, in collaboration with the Ministry of Power and Bureau of Energy Efficiency (BEE), has released the State Energy and Climate Index (SECI) 2026.

Key Findings:
1. Front-Runners in Renewable Adoption: Gujarat, Karnataka, and Tamil Nadu lead in wind and utility-scale solar integration.
2. Bihar’s Strides: Bihar recorded a 38% annual growth in decentralized solar micro-grids and smart prepaid metering adoption, leading the country in agricultural feeder solarization under the Jal-Jeevan-Hariyali Mission.
3. Discom Financial Health: Recommends accelerated implementation of the Revamped Distribution Sector Scheme (RDSS) to curtail Aggregate Technical & Commercial (AT&C) losses.`,
    category: 'Environment & Energy',
    source: 'Press Information Bureau (PIB) - NITI Aayog',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081804',
    sourceProvenance: {
      sourceId: 'src_pib_niti',
      sourceName: 'NITI Aayog Portal',
      sourceType: 'GOVERNMENT',
      adapter: 'niti'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_environment',
    conceptId: 'c_climate_change_global',
    tags: ['NITI Aayog', 'SECI', 'Renewable Energy', 'Solar Power', 'Bihar Special', 'GS-3'],
    prelimsPointers: [
      'SECI evaluates states on 6 parameters including DISCOM performance, energy efficiency, and environmental sustainability.',
      'Bureau of Energy Efficiency (BEE) is a statutory body under the Energy Conservation Act, 2001.'
    ],
    mainsQuestions: [
      'Evaluate India’s transition towards decentralized renewable energy with specific reference to agricultural feeder solarization. (150 words, 10 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_energy_transition_2026',
    topicClusterTitle: 'Clean Energy Transition & State Performance',
    publishedAt: '2026-08-18T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_18_05',
    date: '2026-08-18',
    title: 'Supreme Court Mandates Standard Operating Procedures (SOP) for Environmental Public Hearings under EIA 2006',
    summary: 'The Supreme Court rules that conducting perfunctory or exclusionary public consultations under the Environmental Impact Assessment Notification violates Article 21 and the Precautionary Principle.',
    content: `A three-judge bench of the Supreme Court of India has issued nationwide binding Standard Operating Procedures (SOPs) for State Pollution Control Boards conducting public hearings for Category A and B industrial and mining projects.

Judicial Directives:
1. Meaningful Public Participation: Public hearing notices must be widely published in local vernacular newspapers at least 30 days prior to the hearing, with complete non-technical Executive Summaries provided in regional languages.
2. Digital and Physical Access: Complete Environmental Impact Assessment (EIA) draft reports and Environmental Management Plans (EMP) must be uploaded on open-access district portals.
3. Precautionary Principle & Inter-generational Equity: Environmental clearances granted without genuine consultation will be quashed as ultra vires to Article 21 (Right to Clean Environment).`,
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
    tags: ['Supreme Court', 'EIA', 'Environment Protection', 'Article 21', 'Judicial Review', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'EIA Notification in India is issued under the Environment (Protection) Act, 1986.',
      'Public Consultation is Step 3 of the 4-stage EIA process (Screening, Scoping, Public Consultation, Appraisal).'
    ],
    mainsQuestions: [
      'Critically analyze the role of public consultation in balancing infrastructure industrialization with environmental justice in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_environmental_governance_2026',
    topicClusterTitle: 'Environmental Governance & Judicial Directives',
    publishedAt: '2026-08-18T09:30:00.000Z'
  },
  {
    id: 'ca_2026_08_18_06',
    date: '2026-08-18',
    title: 'ISRO Completes Integrated Air-Drop Test for Gaganyaan Crew Module Deceleration Parachute System',
    summary: 'The Indian Space Research Organisation successfully demonstrates the multi-stage deployment of apex, drogue, and main parachutes for safe recovery of the Gaganyaan crew module.',
    content: `The Indian Space Research Organisation (ISRO), in collaboration with DRDO’s Aerial Delivery Research and Development Establishment (ADRDE), has successfully carried out the Integrated Main Parachute Airdrop Test (IMAT) at the Babina Field Firing Range, Jhansi.

Technical Details:
- The parachute deceleration system comprises a sequence of 10 parachutes: 2 apex cover separation chutes, 2 drogue chutes for velocity reduction and stabilization, and 3 giant main parachutes to slow the capsule to a touch-down velocity of less than 8.5 m/s.
- Validates the redundancy mechanism where two main parachutes are sufficient to safely land the astronauts even if one main chute fails.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Department of Space',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081806',
    sourceProvenance: {
      sourceId: 'src_isro',
      sourceName: 'Indian Space Research Organisation (ISRO)',
      sourceType: 'GOVERNMENT',
      adapter: 'isro'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ISRO', 'Gaganyaan', 'Space Mission', 'ADRDE', 'GS-3'],
    prelimsPointers: [
      'Gaganyaan will launch a 3-member crew to a 400 km Low Earth Orbit for a 3-day mission.',
      'The launch vehicle is LVM3 (formerly GSLV Mk III), human-rated as HLVM3.',
      'ADRDE is a pioneer DRDO lab located in Agra.'
    ],
    mainsQuestions: [
      'Highlight the technological milestones achieved by ISRO through the Gaganyaan human spaceflight programme. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_space_technology_2026',
    topicClusterTitle: 'Space Technology & Human Spaceflight',
    publishedAt: '2026-08-18T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_18_07',
    date: '2026-08-18',
    title: 'Indian Express Explained: Why India’s Critical Minerals Strategy is Pivotal for the Green Transition',
    summary: 'A deep-dive into India’s offshore auctions, Khanij Bidesh India Limited (KABIL) joint ventures in South America, and recycling mandates under the Battery Waste Management Rules.',
    content: `The transition from fossil fuels to green technologies—electric vehicles (EVs), solar photovoltaics, and grid-scale lithium-ion battery storage—is fundamentally a material-intensive revolution.

Key Explanations:
1. Geopolitical Vulnerability: Over 70% of global lithium refining and 60% of cobalt processing is concentrated in a single geography.
2. KABIL Strategy: India’s joint venture Khanij Bidesh India Ltd (NALCO, HCL, MECL) has acquired 5 lithium exploration blocks in Catamarca province of Argentina and entered bilateral exploration accords in Australia.
3. Domestic Exploration: Identification of rare earth element (REE) and lithium deposits in Jammu & Kashmir (Reasi) and mica pegmatites in Bihar and Rajasthan is being fast-tracked through the MMDR Amendment Act 2023.`,
    category: 'Economy & Resources',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Critical Minerals', 'Lithium', 'KABIL', 'Energy Transition', 'GS-3'],
    prelimsPointers: [
      'KABIL is a JV of three CPSEs: NALCO, Hindustan Copper Ltd (HCL), and Mineral Exploration Corporation Ltd (MECL).',
      'The "Lithium Triangle" in South America comprises Argentina, Bolivia, and Chile.',
      'MMDR Amendment Act 2023 delisted 6 atomic minerals (including Lithium, Beryllium, Titanium) to allow private sector exploration.'
    ],
    mainsQuestions: [
      'Discuss the strategic imperatives for India to diversify its critical mineral partnerships across the Global South. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_critical_minerals_2026',
    topicClusterTitle: 'Critical Minerals & Deep Ocean Exploration',
    publishedAt: '2026-08-18T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_18_08',
    date: '2026-08-18',
    title: 'Bihar Tourism Department Launches Integrated Buddhist and Jain Circuit Express Luxury Corridors',
    summary: 'A dedicated infrastructure boost connecting Bodh Gaya, Rajgir, Nalanda, Vaishali, and Pawapuri with world-class hospitality and eco-friendly EV transit.',
    content: `The Department of Tourism, Government of Bihar, has rolled out the Integrated Buddhist & Jain Heritage Corridor under the State Tourism Policy.

Key Initiatives:
- Bodh Gaya - Rajgir - Nalanda - Vaishali Transit: Deployment of electric luxury coaches and heritage walking corridors with audio-guides in 8 international languages (including Japanese, Korean, Thai, and Mandarin).
- Mahaparinirvana Circuit Integration: Linking Vaishali (Relic Stupa where Buddha’s ashes were enshrined) with Kesariya Stupa in East Champaran (world’s tallest Buddhist stupa).
- Jain Circuit: Upgradation of amenities at Pawapuri (Jal Mandir, where Lord Mahavira attained Nirvana) and Kundagram (Vaishali, birthplace of Mahavira).`,
    category: 'Bihar Special',
    source: 'Department of Tourism - Government of Bihar',
    sourceUrl: 'https://tourism.bihar.gov.in',
    sourceProvenance: {
      sourceId: 'src_bihar_tourism',
      sourceName: 'Bihar Tourism Portal',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_ancient_magadha',
    tags: ['Bihar Special', 'BPSC', 'Tourism', 'Buddhist Circuit', 'Jain Circuit', 'Bodh Gaya', 'GS-1'],
    prelimsPointers: [
      'Kesariya Stupa in East Champaran, Bihar is considered the tallest Buddhist stupa in the world (approx 104 ft).',
      'Mahavira attained Nirvana at Pawapuri, Nalanda district.',
      'First Buddhist Council was held at Sattapanni Cave, Rajgir under king Ajatashatru.'
    ],
    mainsQuestions: [
      'Evaluate the economic and cultural potential of heritage tourism in transforming the service economy of Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_heritage_2026',
    topicClusterTitle: 'Bihar Cultural Heritage & Tourism Economy',
    publishedAt: '2026-08-18T11:00:00.000Z'
  },
  {
    id: 'ca_2026_08_18_09',
    date: '2026-08-18',
    title: 'Reserve Bank of India Issues Guidelines on Ethical Governance and Algorithmic Audit for AI in Digital Lending',
    summary: 'The RBI mandates that commercial banks and NBFCs conduct third-party algorithmic bias audits and guarantee human-in-the-loop oversight in credit scoring.',
    content: `The Reserve Bank of India has issued comprehensive regulatory directions on Responsible AI adoption in financial services.

Key Regulatory Mandates:
1. Explainability & Transparency: AI models used in underwriting and credit assessment must provide explainable denial rationales to loan applicants, preventing black-box discrimination against vulnerable demographic groups.
2. Data Localization & Privacy: Strict compliance with Digital Personal Data Protection Act (DPDPA) rules; consumer financial datasets cannot be utilized to train public Large Language Models without explicit, revocable consent.
3. Model Risk Governance: Board-level committees must review algorithmic credit scoring models annually for demographic parity and counter-cyclical stability.`,
    category: 'Economy & Governance',
    source: 'Reserve Bank of India (RBI) Notifications',
    sourceUrl: 'https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx',
    sourceProvenance: {
      sourceId: 'src_rbi_official',
      sourceName: 'Reserve Bank of India',
      sourceType: 'GOVERNMENT',
      adapter: 'rbi'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_mpc',
    tags: ['RBI', 'Fintech', 'Artificial Intelligence', 'Banking Regulation', 'GS-3', 'Ethics'],
    prelimsPointers: [
      'RBI regulates NBFCs and digital lending entities under the Banking Regulation Act, 1949 and RBI Act, 1934.',
      'DPDPA 2023 established the Data Protection Board of India.'
    ],
    mainsQuestions: [
      'Discuss the regulatory dilemmas in governing artificial intelligence in banking while promoting financial inclusion. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_fintech_governance_2026',
    topicClusterTitle: 'Fintech Governance & AI Regulations',
    publishedAt: '2026-08-18T12:00:00.000Z'
  },

  // ==========================================
  // AUGUST 17, 2026 (8 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_17_01',
    date: '2026-08-17',
    title: 'Ministry of Environment Notifies Expanded Wildlife Corridors for Asiatic Lion Landscape in Gujarat',
    summary: 'The Union Environment Ministry notifies Greater Gir landscape eco-sensitive zones to ensure unhindered gene flow across Gir National Park, Barda Wildlife Sanctuary, and coastal scrub forests.',
    content: `The Ministry of Environment, Forest and Climate Change (MoEFCC) has formally notified the extended Eco-Sensitive Zones (ESZ) encompassing the Greater Gir Asiatic Lion Landscape in Saurashtra, Gujarat under Project Lion.

Key Conservation Measures:
- Barda Wildlife Sanctuary Restoration: Developing Barda as a second viable home for Asiatic Lions (Panthera leo persica) to reduce disease vulnerability associated with a single geographically isolated population.
- Regulated Activities in ESZ: Commercial mining, polluting red-category industries, and sawmills prohibited within 10 km boundaries while organic farming and eco-tourism are promoted.`,
    category: 'Environment & Biodiversity',
    source: 'Press Information Bureau (PIB) - MoEFCC',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081701',
    sourceProvenance: {
      sourceId: 'src_pib_moefcc',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'moefcc'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_environment',
    conceptId: 'c_biodiversity_parks',
    tags: ['Asiatic Lion', 'Gir National Park', 'Barda Sanctuary', 'Project Lion', 'MoEFCC', 'GS-3'],
    prelimsPointers: [
      'Asiatic Lion is categorized as "Endangered" on the IUCN Red List and listed in Schedule I of the Wildlife (Protection) Act, 1972.',
      'Gir National Park and Wildlife Sanctuary is the only natural habitat of the Asiatic Lion in the world.',
      'Eco-Sensitive Zones are notified under Section 3 of the Environment (Protection) Act, 1986.'
    ],
    mainsQuestions: [
      'Examine the ecological imperatives of establishing alternative satellite habitats for endangered species in India. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_wildlife_conservation_2026',
    topicClusterTitle: 'Wildlife Conservation & Biodiversity Landscapes',
    publishedAt: '2026-08-17T06:00:00.000Z'
  },
  {
    id: 'ca_2026_08_17_02',
    date: '2026-08-17',
    title: 'Bihar Government Announces Comprehensive Industrial Logistics and Warehousing Policy 2026',
    summary: 'The Bihar Industries Department introduces capital incentives, 100% stamp duty waiver, and fast-track land allotment through BIADA to establish multimodal logistics hubs along Eastern Dedicated Freight Corridor (EDFC).',
    content: `In a major industrial infrastructure push, the Bihar Department of Industries has notified the Bihar Logistics and Warehousing Policy 2026.

Strategic Features:
1. EDFC Alignment: Capitalizing on the Eastern Dedicated Freight Corridor which passes through Rohtas, Kaimur, Gaya, and Aurangabad districts, setting up Integrated Cargo Terminals.
2. BIADA Industrial Parks: Bihar Industrial Area Development Authority (BIADA) will offer plug-and-play warehouses with 25% capital subsidy up to ₹10 crore and 100% exemption on land conversion charges.
3. Agro-Logistics: Establishing cold-chain clusters for perishable produce including Muzaffarpur litchis, Hajipur bananas, and Mithila makhana.`,
    category: 'Bihar Special',
    source: 'Department of Industries - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/industries',
    sourceProvenance: {
      sourceId: 'src_bihar_industries',
      sourceName: 'Bihar Department of Industries',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'BPSC', 'BIADA', 'Logistics Policy', 'EDFC', 'Economy', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'The Eastern Dedicated Freight Corridor (EDFC) runs from Ludhiana (Punjab) to Dankuni (West Bengal), passing through south Bihar.',
      'BIADA operates under the Bihar Industrial Area Development Authority Act, 1974.'
    ],
    mainsQuestions: [
      'Assess the potential of the Eastern Dedicated Freight Corridor in transforming Bihar into a logistics hub for eastern India. (250 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_infrastructure_2026',
    topicClusterTitle: 'Bihar Infrastructure & Water Resources',
    publishedAt: '2026-08-17T07:00:00.000Z'
  },
  {
    id: 'ca_2026_08_17_03',
    date: '2026-08-17',
    title: 'The Hindu Editorial: Re-evaluating the Tenth Schedule and the Role of the Speaker in Disqualification Petitions',
    summary: 'A critical review of legislative jurisprudence on the Anti-Defection Law, highlighting arbitrary delays by Speakers and recommending an independent tribunal mechanism.',
    content: `The anti-defection law (Tenth Schedule) was inserted by the 52nd Constitutional Amendment Act, 1985 to curb political horse-trading. However, recent political crises underscore structural flaws in vesting adjudicatory power solely in the office of the Speaker.

Editorial Analysis:
- The Judicial Conundrum: In Kihoto Hollohan (1992), the Supreme Court upheld the Speaker’s tribunal status, subject to judicial review only after an order is passed. However, Speakers frequently sit indefinitely on disqualification petitions or decide them selectively to favor ruling coalitions.
- Keisham Meghachandra Precedent (2020): Supreme Court recommended that Parliament should amend the Constitution to substitute the Speaker with an independent permanent tribunal headed by a retired Supreme Court judge.
- Conclusion: To protect democratic probity and the basic structure principle of free elections, time-bound adjudication (within 3 months) of disqualification pleas is indispensable.`,
    category: 'Polity & Governance',
    source: 'The Hindu - Editorial',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_basic_structure',
    tags: ['Tenth Schedule', 'Anti-Defection Law', 'Speaker', 'Supreme Court', 'GS-2'],
    prelimsPointers: [
      'Tenth Schedule was added by the 52nd Constitutional Amendment Act, 1985.',
      '91st Amendment Act, 2003 deleted the split provision (1/3rd members) and retained only the merger provision (2/3rd members).',
      'Decisions on disqualification under Tenth Schedule are subject to judicial review (Kihoto Hollohan 1992).'
    ],
    mainsQuestions: [
      'Critically examine the working of the Anti-Defection Law in India. Has it succeeded in checking opportunistic defections or compromised intra-party democracy? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_constitutional_reforms_2026',
    topicClusterTitle: 'Constitutional Reforms & Parliamentary Law',
    publishedAt: '2026-08-17T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_17_04',
    date: '2026-08-17',
    title: 'Ministry of Agriculture Launches Agri-SURE Fund to Catalyze Tech-Driven Agritech Startups',
    summary: 'A ₹750 crore blended capital fund managed by NABVENTURES to finance startups developing drone-based precision agriculture, soil sensors, and direct farm-to-fork value chains.',
    content: `The Union Minister of Agriculture and Farmers Welfare has formally rolled out the Agri-SURE (Agri Fund for Startups & Rural Enterprises) fund in New Delhi.

Key Highlights:
- Capital Structure: Jointly backed by NABARD (₹250 crore), MoAFW (₹250 crore), and private co-investors (₹250 crore).
- Focus Sectors: Precision agriculture technologies, climate-resilient seed genomics, AI-driven pest advisory, and post-harvest storage management for Farmer Producer Organizations (FPOs).`,
    category: 'Agriculture & Economy',
    source: 'Press Information Bureau (PIB) - Ministry of Agriculture',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081704',
    sourceProvenance: {
      sourceId: 'src_pib_moa',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_msp_agri',
    tags: ['Agri-SURE', 'NABARD', 'Agritech', 'Agriculture', 'GS-3'],
    prelimsPointers: [
      'NABARD was established in 1982 on the recommendations of the B. Sivaraman Committee under Act 61 of 1981.',
      'Agri-SURE operates as a Category-II Alternative Investment Fund (AIF).'
    ],
    mainsQuestions: [
      'Discuss how agritech startups can address the structural fragmentation of Indian agriculture. (150 words, 10 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_agri_innovation_2026',
    topicClusterTitle: 'Agritech Innovation & Rural Enterprise',
    publishedAt: '2026-08-17T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_17_05',
    date: '2026-08-17',
    title: 'India Inscribes Three New Wetlands into Ramsar Convention, Expanding National Network to 85 Sites',
    summary: 'The Ministry of Environment, Forest and Climate Change announces the accreditation of three new Ramsar sites (Nanjarayan and Kazhuveli Bird Sanctuaries in Tamil Nadu, and Tawa Reservoir in Madhya Pradesh), bringing India’s total to 85 designated wetlands of international importance.',
    content: `The Ramsar Secretariat has formally recognized three additional Indian wetlands under the 1971 Ramsar Convention on Wetlands of International Importance, taking India’s tally to 85.

Ecological Significance:
- Tamil Nadu holds the largest number of Ramsar sites in India (18 sites), followed by Uttar Pradesh (10 sites).
- Bihar currently possesses three designated Ramsar sites: Kabar Taal (Kanwar Lake) in Begusarai, and the twin Nagi and Nakti Bird Sanctuaries in Jamui.
- The sites protect critical staging habitats for migratory waterbirds traveling along the Central Asian Flyway (CAF).`,
    category: 'Environment & Biodiversity',
    source: 'Ministry of Environment, Forest and Climate Change (MoEFCC)',
    sourceUrl: 'https://moef.gov.in/',
    sourceProvenance: {
      sourceId: 'src_pib_moefcc',
      sourceName: 'MoEFCC Press Release',
      sourceType: 'GOVERNMENT',
      adapter: 'moefcc'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_environment',
    conceptId: 'c_biodiversity_parks',
    tags: ['Ramsar Sites', 'Wetlands', 'Central Asian Flyway', 'Kabar Taal', 'Nagi Nakti', 'GS-3'],
    prelimsPointers: [
      'Ramsar Convention was signed in 1971 in Ramsar, Iran; entered into force in 1975.',
      'Montreux Record currently includes Keoladeo National Park (Rajasthan) and Loktak Lake (Manipur).',
      'Bihar’s Ramsar sites are Kabar Taal (Begusarai), Nagi Bird Sanctuary (Jamui), and Nakti Bird Sanctuary (Jamui).'
    ],
    mainsQuestions: [
      'Discuss the ecological services rendered by wetlands and evaluate India’s Amrit Dharohar framework for sustainable wetland management. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_wetlands_conservation_2026',
    topicClusterTitle: 'Wetlands, Ramsar Convention & Aquatic Ecology',
    publishedAt: '2026-08-17T09:30:00.000Z'
  },
  {
    id: 'ca_2026_08_17_06',
    date: '2026-08-17',
    title: 'Election Commission of India Submits Prototype Architecture for Multi-Constituency Remote Voting Machines (RVM)',
    summary: 'The ECI presents a standalone non-networked remote voting prototype to parliamentary standing committees to enable domestic migrant workers and students to vote without traveling to home constituencies.',
    content: `The Election Commission of India (ECI), in technical collaboration with BEL and ECIL, has submitted the detailed architecture of the Remote Electronic Voting Machine (RVM) to the Parliamentary Committee on Law and Justice.

Key Technical Innovations:
- Handles up to 72 different constituencies on a single remote terminal using electronic dynamic ballot display.
- Non-networked, standalone unit operating with isolated microcontrollers and integrated multi-constituency VVPAT audit trail.
- Requires legislative amendments to Section 20 of Representation of the People Act 1950 and Conduct of Elections Rules 1961 to define 'remote voters'.`,
    category: 'Polity & Governance',
    source: 'Election Commission of India (ECI)',
    sourceUrl: 'https://eci.gov.in/',
    sourceProvenance: {
      sourceId: 'src_eci_official',
      sourceName: 'Election Commission of India',
      sourceType: 'GOVERNMENT',
      adapter: 'eci'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['ECI', 'RVM', 'Remote Voting', 'Article 324', 'Electoral Reforms', 'RPA 1951', 'GS-2'],
    prelimsPointers: [
      'RVM technology is developed by Bharat Electronics Limited (BEL) and Electronics Corporation of India Limited (ECIL).',
      'Article 324 vests election superintendence in ECI.',
      'Section 20 of Representation of the People Act 1950 defines "ordinarily resident".'
    ],
    mainsQuestions: [
      'Examine the potential of remote voting technology in enfranchising internal migrant labour while preserving absolute electoral trust and auditability. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_electoral_reforms_2026',
    topicClusterTitle: 'Democratic Reforms & Electoral Integrity',
    publishedAt: '2026-08-17T11:00:00.000Z'
  },
  {
    id: 'ca_2026_08_17_07',
    date: '2026-08-17',
    title: 'Indian Express Explained: How the Digital Personal Data Protection Act Rules Operationalize Consent and Data Fiduciaries',
    summary: 'An explanatory breakdown of DPDP Rules 2026, examining the consent manager framework, exemptions for state surveillance, and penalties adjudicated by the Data Protection Board of India.',
    content: `The formal notification of rules under the Digital Personal Data Protection Act (DPDPA) 2023 marks a definitive transition towards a privacy-compliant digital economy in India.

Key Explanations:
1. Significant Data Fiduciaries (SDFs): Entities processing voluminous personal data must appoint India-based Data Protection Officers (DPOs) and undergo periodic independent Data Protection Impact Assessments (DPIAs).
2. Verifiable Parental Consent: Strict mechanisms for processing minors’ personal data, banning targeted behavioural profiling and tracking of children under 18.
3. Cross-Border Transfers: Adoption of a 'negative list' approach allowing data transfers to all foreign jurisdictions unless explicitly blacklisted by the Central Government.`,
    category: 'Polity & Technology',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['DPDPA', 'Data Privacy', 'Article 21', 'Puttaswamy', 'Data Protection Board', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Right to Privacy was declared a fundamental right under Article 21 in Justice K.S. Puttaswamy v. Union of India (2017).',
      'Data Protection Board of India (DPBI) functions as a digital quasi-judicial body with powers to impose penalties up to ₹250 crore for significant data breaches.',
      'The Act uses a negative-list approach for cross-border data flows.'
    ],
    mainsQuestions: [
      'Critically analyze whether the Digital Personal Data Protection Act achieves an optimal balance between individual data sovereignty and legitimate state national security exemptions. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_data_privacy_2026',
    topicClusterTitle: 'Data Privacy, AI Governance & Digital Rights',
    publishedAt: '2026-08-17T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_17_08',
    date: '2026-08-17',
    title: 'Bihar Education Department Expands "Mission Daksh" Remedial Learning to 25 Lakh Primary Students',
    summary: 'The Bihar Department of Education scales up individualized remedial coaching under Mission Daksh, focusing on foundational literacy and numeracy (FLN) for academically lagging students in grades 3 through 8.',
    content: `The Bihar Department of Education has expanded Mission Daksh across all government elementary schools in the state to address learning gaps in foundational literacy and numeracy (FLN).

Key Operational Features:
- Micro-Batch Mentorship: Teachers adopt small batches of 5 lagging students each, conducting specialized 45-minute daily remedial classes post regular school hours.
- NIPUN Bharat Alignment: Standardized diagnostic baseline assessments aligned with the National Initiative for Proficiency in Reading with Understanding and Numeracy (NIPUN).
- Digital Progress Tracking: Real-time student attendance and learning outcome logs maintained on the e-Shikshakosh state portal.`,
    category: 'Bihar Special',
    source: 'Department of Education - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/education',
    sourceProvenance: {
      sourceId: 'src_bihar_education',
      sourceName: 'Bihar Education Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Mission Daksh', 'Education', 'NIPUN Bharat', 'Human Development', 'BPSC_GS2'],
    prelimsPointers: [
      'Mission Daksh was launched by the Bihar Government in December 2023.',
      'NIPUN Bharat Mission is a component of the centrally sponsored Samagra Shiksha scheme under NEP 2020.',
      'Article 21A guarantees free and compulsory education for children between ages 6 and 14.'
    ],
    mainsQuestions: [
      'Evaluate the impact of targeted pedagogical interventions in overcoming learning poverty in rural primary schools of Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_social_welfare_2026',
    topicClusterTitle: 'Human Capital, Education & Social Welfare in Bihar',
    publishedAt: '2026-08-17T12:00:00.000Z'
  },

  // ==========================================
  // AUGUST 16, 2026 (7 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_16_01',
    date: '2026-08-16',
    title: 'India Hands Over Humanitarian Relief and Emergency Solar Microgrids to ASEAN Disaster Relief Hub',
    summary: 'Under the "Act East" Policy and Quad Humanitarian Assistance and Disaster Relief (HADR) Partnership, India deploys mobile solar water purification units and emergency communications gear.',
    content: `The Ministry of External Affairs (MEA) has completed the handover of the third consignment of disaster relief and resilient energy equipment to the AHA Centre (ASEAN Coordinating Centre for Humanitarian Assistance on disaster management) in Jakarta.

Strategic Underpinnings:
- Reinforces India’s SAGAR doctrine (Security and Growth for All in the Region) and India-ASEAN Comprehensive Strategic Partnership.
- Demonstrates indigenous disaster management engineering by deploying DRDO water purifiers and ISRO satellite terminals.`,
    category: 'International Relations',
    source: 'Press Information Bureau (PIB) - Ministry of External Affairs',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081601',
    sourceProvenance: {
      sourceId: 'src_pib_mea',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_security_ir',
    conceptId: 'c_global_groupings',
    tags: ['India-ASEAN', 'Act East', 'HADR', 'SAGAR', 'International Relations', 'GS-2'],
    prelimsPointers: [
      'AHA Centre is headquartered in Jakarta, Indonesia.',
      'India-ASEAN relations were upgraded to Comprehensive Strategic Partnership in 2022.',
      'SAGAR doctrine was first articulated by India in 2015 in Mauritius.'
    ],
    mainsQuestions: [
      'Evaluate humanitarian assistance and disaster relief (HADR) as a pillar of India’s soft power in the Indo-Pacific region. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_indo_pacific_2026',
    topicClusterTitle: 'Indo-Pacific Security & Regional Diplomacy',
    publishedAt: '2026-08-16T06:00:00.000Z'
  },
  {
    id: 'ca_2026_08_16_02',
    date: '2026-08-16',
    title: 'Bihar Environment Department Initiates Second Tiger Reserve Notification Process in Kaimur Wildlife Sanctuary',
    summary: 'The National Tiger Conservation Authority (NTCA) accords final approval for establishing Bihar’s second tiger reserve in Kaimur, augmenting the existing Valmiki Tiger Reserve.',
    content: `The Bihar Department of Environment, Forest and Climate Change has formally notified the core and buffer zones for the Kaimur Tiger Reserve (KTR), which becomes the 56th Tiger Reserve of India and the second in Bihar.

Key Ecological Features:
1. Geography: Spread across Kaimur and Rohtas districts in the Vindhyan plateau region of south-western Bihar.
2. Landscape Connectivity: Contiguous with Chandraprabha Wildlife Sanctuary in Uttar Pradesh and Sanjay-Dubri Tiger Reserve in Madhya Pradesh, establishing a vital wildlife corridor.
3. Prey Base Augmentation: Forest department has translocated spotted deer (Cheetal) and wild boar from Valmiki National Park to enrich prey availability.`,
    category: 'Bihar Special',
    source: 'Department of Environment, Forest & Climate Change - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/forest',
    sourceProvenance: {
      sourceId: 'src_bihar_forest',
      sourceName: 'Bihar Forest Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_geo_rivers',
    tags: ['Bihar Special', 'BPSC', 'Kaimur Tiger Reserve', 'Valmiki National Park', 'NTCA', 'Biodiversity', 'GS-3'],
    prelimsPointers: [
      'Valmiki National Park is situated in West Champaran along the Gandak River (Bihar’s 1st Tiger Reserve).',
      'Kaimur Wildlife Sanctuary is situated in the Vindhyan plateau region.',
      'NTCA is a statutory body under the Wildlife (Protection) Act, 1972, chaired by the Union Minister for Environment.'
    ],
    mainsQuestions: [
      'Discuss the significance of interstate wildlife corridors in tiger conservation with special reference to the Kaimur landscape in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_environment_2026',
    topicClusterTitle: 'Biodiversity, Tiger Conservation & Forest Reserves',
    publishedAt: '2026-08-16T07:30:00.000Z'
  },
  {
    id: 'ca_2026_08_16_03',
    date: '2026-08-16',
    title: 'The Hindu Editorial: Fiscal Federalism and the Distributional Challenges Facing the 16th Finance Commission',
    summary: 'An analytical assessment of the Terms of Reference of the 16th Finance Commission, balancing demographic performance incentives with horizontal equalization for lower-income states.',
    content: `As the 16th Finance Commission chaired by Dr. Arvind Panagariya conducts state consultations, structural tensions between northern high-population states and southern demographic achievers have resurfaced.

Editorial Analysis:
- Vertical Devolution: States are seeking an expansion of the net divisible pool share beyond the current 41%, particularly in light of the proliferation of central cesses and surcharges that are not shared with states.
- Horizontal Formula: Balancing 'demographic effort' and 'forest/ecology' criteria against 'income distance' is vital so that performing southern states are not penalized while lagging eastern states (Bihar, UP) receive fiscal equalization grants.
- Capital Expenditure Incentives: Commission should tie revenue deficit grants to state asset-creation and power-sector debt restructuring benchmarks.`,
    category: 'Economy & Federalism',
    source: 'The Hindu - Lead Editorial Synthesis',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fin_comm',
    tags: ['Finance Commission', 'Article 280', 'Fiscal Federalism', 'Devolution', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Finance Commission is constituted by the President every 5 years under Article 280.',
      '15th Finance Commission used the 2011 Census population data while assigning 12.5% weight to demographic performance.',
      'Article 270 governs the distribution of taxes between Union and States, excluding cesses levied under Article 271.'
    ],
    mainsQuestions: [
      'Examine the key dilemmas before the 16th Finance Commission in reconciling equity and efficiency in inter-governmental resource allocation. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_fiscal_federalism_2026',
    topicClusterTitle: 'Fiscal Federalism & Finance Commission Dynamics',
    publishedAt: '2026-08-16T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_16_04',
    date: '2026-08-16',
    title: 'Ministry of Mines Launches Auction of 18 Strategic Offshore Critical Mineral Blocks under New Offshore Mining Rules',
    summary: 'The Ministry of Mines invites international bids for exploration and production of offshore nickel, cobalt, titanium, and rare earth deposits in India’s Exclusive Economic Zone (EEZ).',
    content: `The Ministry of Mines has launched the first tranche of auctions for offshore mineral blocks in accordance with the Offshore Areas Mineral (Development and Regulation) Amendment Act, 2023.

Key Features:
1. Offshore Blocks: Located off the coasts of Odisha, Andhra Pradesh, Kerala, and the Andaman & Nicobar Islands, containing ilmenite, rutile, zircon, and polymetallic placers.
2. Competitive Bidding: Composite licences (exploration-cum-production) granted transparently via online ascending forward auction.
3. Environmental Safeguards: Mandatory marine ecosystem baseline surveys and strict exclusion of coral reef buffers and marine protected areas.`,
    category: 'Economy & Resources',
    source: 'Press Information Bureau (PIB) - Ministry of Mines',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081604',
    sourceProvenance: {
      sourceId: 'src_pib_mines',
      sourceName: 'Ministry of Mines',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Offshore Mining', 'Critical Minerals', 'Ministry of Mines', 'EEZ', 'GS-3'],
    prelimsPointers: [
      'India’s Exclusive Economic Zone (EEZ) extends up to 200 nautical miles from the baseline under UNCLOS.',
      'Offshore Areas Mineral (Development and Regulation) Act was amended in 2023 to introduce competitive auctions.',
      'Atomic minerals in beach sands include monazite, ilmenite, rutile, and zircon.'
    ],
    mainsQuestions: [
      'Evaluate the economic and strategic potential of seabed mining in India’s Exclusive Economic Zone along with its ecological safeguards. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_critical_minerals_2026',
    topicClusterTitle: 'Critical Minerals & Deep Ocean Exploration',
    publishedAt: '2026-08-16T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_16_05',
    date: '2026-08-16',
    title: 'Indian Express Explained: Understanding the Supreme Court 7-Judge SC/ST Sub-Classification Verdict',
    summary: 'A detailed legal explainer dissecting the constitutional rationale behind permitting sub-quotas within SC/ST categories, the empirical data test, and the debate surrounding the creamy layer.',
    content: `The landmark 7-judge Constitution Bench judgment in State of Punjab v. Davinder Singh marks a transformative inflection point in India’s affirmative action jurisprudence.

Key Explanations:
1. Overruling Chinnaiah (2004): The court clarified that the Presidential List under Article 341 only identifies the castes eligible for benefits; it does not freeze state legislative power under Article 16(4) to provide intra-group prioritization.
2. Substantive Equality Principle: Equal treatment of unequals perpetuates inequality; more backward sub-groups within SCs (e.g., Valmikis, Mazhabi Sikhs, Mahadalits) can be given dedicated sub-quotas.
3. Strict Judicial Review: Sub-classification cannot be arbitrary; it requires verifiable empirical data on inadequacy of representation in state services and educational institutions.`,
    category: 'Polity & Governance',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art14',
    tags: ['Article 341', 'Sub-Classification', 'Supreme Court', 'Creamy Layer', 'Affirmative Action', 'GS-2'],
    prelimsPointers: [
      'Article 341 empowers the President to specify Scheduled Castes in consultation with State Governors.',
      'In Indra Sawhney (1992), creamy layer exclusion was mandated for OBCs under Article 16(4).',
      'The 7-judge bench decided the matter by a 6:1 majority.'
    ],
    mainsQuestions: [
      'Discuss how the concept of substantive equality has evolved in Indian constitutional jurisprudence through landmark reservation judgments. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_constitutional_reforms_2026',
    topicClusterTitle: 'Constitutional Reforms & Parliamentary Law',
    publishedAt: '2026-08-16T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_16_06',
    date: '2026-08-16',
    title: 'Bihar Health Department Launches State Mission for Sickle Cell Anaemia Screening in Tribal and Mahadalit Belts',
    summary: 'In alignment with the National Sickle Cell Anaemia Elimination Mission, Bihar deploys mobile point-of-care solubility screening units across Banka, Jamui, Kaimur, and West Champaran.',
    content: `The Bihar Department of Health has launched an intensive state-wide screening campaign to eliminate Sickle Cell Anaemia as a public health challenge by 2047.

Programme Elements:
- Focus Districts: Banka, Jamui, Rohtas, Kaimur, and West Champaran districts having significant tribal (Tharu, Oraon, Santhal) and vulnerable demographic concentrations.
- Genetic Counseling Cards: Providing color-coded pre-marital genetic counseling cards to prevent homozygous inheritance of the sickle cell gene (HbS).
- Universal Screening: Screening all individuals aged 0 to 40 years using HPLC (High Performance Liquid Chromatography) confirmation at district sadar hospitals.`,
    category: 'Bihar Special',
    source: 'State Health Society - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/health',
    sourceProvenance: {
      sourceId: 'src_bihar_health',
      sourceName: 'Bihar State Health Society',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Sickle Cell', 'Public Health', 'Tribal Welfare', 'National Health Mission', 'BPSC_GS2'],
    prelimsPointers: [
      'Sickle Cell Anaemia is an autosomal recessive genetic blood disorder caused by a mutation in the beta-globin gene.',
      'National Sickle Cell Anaemia Elimination Mission aims to eliminate the disease by 2047.',
      'Tharu tribe resides in the terai region of West Champaran district in Bihar.'
    ],
    mainsQuestions: [
      'Examine the public health burden of genetic blood disorders among vulnerable communities in Bihar and suggest policy interventions. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_social_welfare_2026',
    topicClusterTitle: 'Human Capital, Education & Social Welfare in Bihar',
    publishedAt: '2026-08-16T11:00:00.000Z'
  },
  {
    id: 'ca_2026_08_16_07',
    date: '2026-08-16',
    title: 'Department of Telecommunications Releases 6G Vision Document and Spectrum Allocation Framework for Terahertz R&D',
    summary: 'The DoT sets up Bharat 6G Testbeds to develop indigenous intelligent reflecting surfaces, non-terrestrial satellite-cellular convergence, and sub-terahertz radio transceivers.',
    content: `The Department of Telecommunications (DoT), Ministry of Communications, has released the Bharat 6G Spectrum Roadmap aiming for commercial rollout by 2030.

Key Technology Pillars:
- Sub-Terahertz Bands: De-licensing spectrum in the 95 GHz to 3 THz range for academic institutions and telecom startups to conduct experimental transceiver validation.
- Direct-to-Device (D2D) Satellite Linkage: Integrating terrestrial mobile cellular towers with low Earth orbit (LEO) satellite constellations to guarantee 100% geographical connectivity in remote border areas.
- Standard Essential Patents (SEPs): Creating an institutional patent fund to support Indian researchers in contributing to 3GPP and ITU global 6G standardizations.`,
    category: 'Science & Technology',
    source: 'Press Information Bureau (PIB) - Ministry of Communications',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081607',
    sourceProvenance: {
      sourceId: 'src_pib_dot',
      sourceName: 'Department of Telecommunications',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['6G Vision', 'Bharat 6G', 'Telecom', 'Terahertz', 'DoT', 'GS-3'],
    prelimsPointers: [
      'Bharat 6G Mission is guided by the Apex Council constituted under the Department of Telecommunications.',
      'International Telecommunication Union (ITU) is a specialized UN agency headquartered in Geneva, Switzerland.',
      'Terahertz radiation lies between microwave and infrared frequencies on the electromagnetic spectrum.'
    ],
    mainsQuestions: [
      'Assess India’s transition from a technology consumer in 4G to an intellectual property and standard contributor in 6G communications. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_telecom_innovation_2026',
    topicClusterTitle: 'Telecom Modernization & Digital Infrastructure',
    publishedAt: '2026-08-16T12:00:00.000Z'
  },

  // ==========================================
  // AUGUST 15, 2026 (INDEPENDENCE DAY SPECIAL - 8 ARTICLES)
  // ==========================================
  {
    id: 'ca_2026_08_15_01',
    date: '2026-08-15',
    title: 'Independence Day 2026 Address: Prime Minister Announces "Mission Viksit Bharat 2047" Execution Blueprint',
    summary: 'From the ramparts of the Red Fort, the Prime Minister outlines the roadmap for semiconductor sovereignty, green hydrogen corridors, and judicial infrastructure modernization.',
    content: `Addressing the nation on the 80th Independence Day, the Prime Minister highlighted the national mission towards a Developed India (Viksit Bharat) by 2047.

Key Pillars Announced:
1. Semiconductor Ecosystem: Launch of India Semiconductor Mission 2.0 with emphasis on indigenous chip design and commercial silicon carbide wafer fabrication.
2. Next-Gen Infrastructure: Modernization of subordinate court complexes with AI-driven translation tools in 22 Eighth Schedule languages (Bhashini integration).
3. Women-Led Development: Expanding "Lakhpati Didi" target to 5 crore rural self-help group women through drone pilot certifications and agri-processing clusters.`,
    category: 'National Governance',
    source: 'Press Information Bureau (PIB) - Prime Minister’s Office',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081501',
    sourceProvenance: {
      sourceId: 'src_pib_pmo',
      sourceName: 'Press Information Bureau (PIB)',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Viksit Bharat 2047', 'Independence Day', 'Semiconductor', 'Lakhpati Didi', 'Bhashini', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Digital India Bhashini is an AI-led language translation platform developed under the Ministry of Electronics and Information Technology (MeitY).',
      'Lakhpati Didi initiative is implemented under the Deendayal Antyodaya Yojana - National Rural Livelihoods Mission (DAY-NRLM).'
    ],
    mainsQuestions: [
      'Examine the strategic importance of semiconductor manufacturing in achieving technological sovereignty for Viksit Bharat 2047. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_viksit_bharat_2047',
    topicClusterTitle: 'National Strategic Vision & Viksit Bharat 2047',
    publishedAt: '2026-08-15T04:00:00.000Z'
  },
  {
    id: 'ca_2026_08_15_02',
    date: '2026-08-15',
    title: 'Bihar Chief Minister Unveils "Saat Nischay-3" Vision Document During Gandhi Maidan Celebrations',
    summary: 'During the Independence Day address at Gandhi Maidan, Patna, Chief Minister outlines the blueprint for Saat Nischay Part-3 focusing on AI in Agriculture, Climate-Smart Villages, and Global Logistics.',
    content: `Addressing the Independence Day gathering at historical Gandhi Maidan, Patna, the Chief Minister of Bihar announced preliminary contours of the upcoming "Saat Nischay-3" developmental framework (2025-2030).

Core Tenets:
1. Climate-Smart Agriculture & Makhana Global Brand: Setting up dedicated testing and export certification laboratories in Darbhanga and Purnia for Mithila Makhana.
2. Skill Centres of Excellence: Upgrading Industrial Training Institutes (ITIs) in all 38 districts with robotics and EV servicing labs in partnership with Tata Technologies.
3. Women Reservation Consolidation: Strengthening financial capital access for female entrepreneurs under the Mukhyamantri Mahila Udyami Yojana.`,
    category: 'Bihar Special',
    source: 'Information & Public Relations Department (IPRD) - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/prdbihar',
    sourceProvenance: {
      sourceId: 'src_bihar_iprd',
      sourceName: 'Bihar Information & Public Relations Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'BPSC', 'Saat Nischay-3', 'Gandhi Maidan', 'Mithila Makhana', 'Economy', 'GS-2'],
    prelimsPointers: [
      'Saat Nischay Part-1 was launched in 2015; Part-2 was launched in 2020.',
      'Mithila Makhana received Geographical Indication (GI) status in 2022.',
      'Mukhyamantri Udyami Yojana provides ₹10 lakh support (₹5 lakh grant + ₹5 lakh interest-free loan).'
    ],
    mainsQuestions: [
      'Critically evaluate the socio-economic impacts of the Saat Nischay programmes on grassroots human development indicators in Bihar. (250 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_economy_2026',
    topicClusterTitle: 'Bihar Economic Growth, Saat Nischay & Governance',
    publishedAt: '2026-08-15T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_15_03',
    date: '2026-08-15',
    title: 'The Hindu Editorial: Eight Decades of Independence and the Unfinished Agenda of Human Development',
    summary: 'A reflective analysis on India’s journey since 1947, evaluating democratic durability, industrial progress, and persistent challenges in health, nutrition, and female workforce participation.',
    content: `As India marks its 80th Independence Day, the nation celebrates monumental accomplishments in constitutional stability, food self-sufficiency, space science, and digital public infrastructure. However, the human development index highlights deep structural divides.

Editorial Assessment:
- Democratic Resilience: The survival and deepening of democracy across an exceptionally diverse subcontinent remains India’s greatest triumph against post-colonial skeptic predictions.
- The Economic Paradigm: While GDP size has ascended to the top ranks globally, the structural transformation from low-productivity agriculture to high-productivity manufacturing remains incomplete.
- Human Capital Investment: Public expenditure on health (1.4% of GDP) and education (3.1% of GDP) must double to capitalize on India’s peak working-age demographic dividend before it ages by 2050.`,
    category: 'Governance & Society',
    source: 'The Hindu - Lead Editorial Synthesis',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Synthesis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Independence Day', 'Human Development', 'Demographic Dividend', 'Education', 'Health', 'GS-2'],
    prelimsPointers: [
      'Human Development Index (HDI) is published annually by the United Nations Development Programme (UNDP) measuring life expectancy, education, and GNI per capita.',
      'National Education Policy 2020 recommends raising public education expenditure to 6% of GDP.',
      'National Health Policy 2017 targets raising public health expenditure to 2.5% of GDP.'
    ],
    mainsQuestions: [
      'Assess India’s democratic and socio-economic journey since independence. What are the key bottlenecks impeding the realization of its full human capital potential? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_viksit_bharat_2047',
    topicClusterTitle: 'National Strategic Vision & Viksit Bharat 2047',
    publishedAt: '2026-08-15T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_15_04',
    date: '2026-08-15',
    title: 'Ministry of Defence Announces 5th Positive Indigenisation List Comprising 346 High-Tech Defence Items',
    summary: 'The Department of Military Affairs notifies an import embargo on 346 advanced weapon systems, sensors, and munitions to foster domestic private and public defence manufacturing.',
    content: `The Ministry of Defence has released the Fifth Positive Indigenisation List containing 346 strategically vital military subsystems, sensors, and specialized components.

Strategic Objectives:
- Phased Import Ban: Import bans will take effect sequentially between December 2026 and December 2030, covering multi-spectral surveillance sensors, loitering munitions, and naval combat radars.
- MSME & Startup Integration: Nodal innovations channelled through Innovations for Defence Excellence (iDEX) and Technology Development Fund (TDF) under DRDO.
- Export Ambition: Accelerating Indian defence exports towards the target of ₹50,000 crore by 2029.`,
    category: 'Defence & Security',
    source: 'Press Information Bureau (PIB) - Ministry of Defence',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081504',
    sourceProvenance: {
      sourceId: 'src_pib_mod',
      sourceName: 'Ministry of Defence',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_security_ir',
    conceptId: 'c_global_groupings',
    tags: ['Defence Indigenisation', 'iDEX', 'DRDO', 'Make in India', 'GS-3'],
    prelimsPointers: [
      'Department of Military Affairs (DMA) was created in 2019 headed by the Chief of Defence Staff (CDS).',
      'iDEX (Innovations for Defence Excellence) was launched in 2018 under the Defence Innovation Organisation (DIO).',
      'Defence Acquisition Procedure (DAP) 2020 governs capital procurement for Indian Armed Forces.'
    ],
    mainsQuestions: [
      'Examine the role of positive indigenisation lists in building a self-reliant domestic defence industrial base in India. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_defence_indigenisation_2026',
    topicClusterTitle: 'Defence Indigenisation & Strategic Self-Reliance',
    publishedAt: '2026-08-15T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_15_05',
    date: '2026-08-15',
    title: 'Indian Express Explained: How the National Green Hydrogen Mission is Reshaping Heavy Industry',
    summary: 'An explanatory guide to India’s green hydrogen mandates, the SIGHT subsidy auctions, and the technological economics of replacing fossil gas in ammonia and steel manufacturing.',
    content: `India’s National Green Hydrogen Mission represents one of the world’s largest government-backed bets on industrial decarbonization.

Key Explanations:
1. Production Targets: 5 Million Metric Tonnes (MMT) of green hydrogen per year by 2030, supported by 125 GW of associated renewable energy capacity.
2. The SIGHT Scheme: Strategic Interventions for Green Hydrogen Transition provides targeted production subsidies (Component II) and domestic electrolyser manufacturing capital grants (Component I).
3. Port Bunkering Corridors: Establishing green hydrogen and green ammonia export terminals at Kandla, Paradip, and Tuticorin to capture European and Japanese clean bunkering markets.`,
    category: 'Economy & Energy',
    source: 'Indian Express - Explained Desk',
    sourceUrl: 'https://indianexpress.com/section/explained',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'Indian Express Explained',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Green Hydrogen', 'MNRE', 'SIGHT', 'Renewable Energy', 'Decarbonisation', 'GS-3'],
    prelimsPointers: [
      'Green hydrogen standard defines green hydrogen as having emissions ≤ 2 kg CO2 equivalent per kg H2.',
      'Solar Energy Corporation of India (SECI) is the bidding agency for SIGHT scheme.',
      'National Green Hydrogen Mission was launched with an outlay of ₹19,744 crore.'
    ],
    mainsQuestions: [
      'Discuss the techno-economic hurdles in scaling green hydrogen production in India. How can public policy de-risk investments in electrolyser technology? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_green_hydrogen_2026',
    topicClusterTitle: 'Green Hydrogen Mission & Industrial Decarbonization',
    publishedAt: '2026-08-15T06:00:00.000Z'
  },
  {
    id: 'ca_2026_08_15_06',
    date: '2026-08-15',
    title: 'Bihar State Khadi Board Launches "Khadi Mall Global" Digital Platform for Madhubani Silk and Bhagalpuri Tussar',
    summary: 'The Bihar Industries Department rolls out an e-commerce platform with blockchain provenance verification for artisan-woven Bhagalpur silk, Madhubani handloom, and organic cotton khadi.',
    content: `The Bihar State Khadi and Village Industries Board has inaugurated the 'Khadi Mall Global' digital marketplace to connect rural handloom artisans with global retail buyers.

Initiative Highlights:
- Blockchain Authenticity: Every silk saree and fabric item is tagged with a cryptographic QR code verifying master weaver identity, natural dye composition, and Geographical Indication pedigree.
- Direct-to-Artisan Payments: Eliminates intermediary markups by settling export revenues directly into Jan Dhan bank accounts of women weavers in Bhagalpur, Madhubani, and Gaya.
- Design Incubation: Collaboration with National Institute of Fashion Technology (NIFT) Patna for modern apparel styling and contemporary color palettes.`,
    category: 'Bihar Special',
    source: 'Department of Industries - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/industries',
    sourceProvenance: {
      sourceId: 'src_bihar_industries',
      sourceName: 'Bihar Industries Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Bhagalpuri Silk', 'Khadi', 'Handloom', 'NIFT Patna', 'GI Tag', 'BPSC_GS2'],
    prelimsPointers: [
      'Bhagalpur is traditionally known as the "Silk City" of Bihar, famed for Tussar silk (Kosa silk).',
      'Bhagalpuri Silk received the GI tag in 2012.',
      'Khadi and Village Industries Commission (KVIC) is a statutory body established under the KVIC Act of 1956.'
    ],
    mainsQuestions: [
      'Evaluate the role of traditional handloom and handicraft sectors in generating rural non-farm employment in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_heritage_2026',
    topicClusterTitle: 'Bihar Cultural Heritage & Tourism Economy',
    publishedAt: '2026-08-15T10:30:00.000Z'
  },
  {
    id: 'ca_2026_08_15_07',
    date: '2026-08-15',
    title: 'ISRO Announces Bharatiya Antariksh Station (BAS) Module-1 Launch Schedule for 2028',
    summary: 'The Indian Space Research Organisation unveils the technical blueprint for the 52-tonne modular space station in Low Earth Orbit, setting Module-1 deployment on the Next Generation Launch Vehicle (NGLV) for 2028.',
    content: `On the occasion of Independence Day, ISRO Chairman released the finalized engineering configuration of the Bharatiya Antariksh Station (BAS).

Key Architecture:
- Mass and Orbit: 52-tonne modular space station in a 400 km circular Low Earth Orbit at an inclination of 51.5 degrees, accommodating 2 to 4 astronauts for extended scientific stays.
- Launch Vehicle: The foundational Base Module (BAS-1) will be launched using ISRO’s heavy-lift Next Generation Launch Vehicle (NGLV) powered by semi-cryogenic methane-LOX propulsion.
- Microgravity Research: Dedicated internal racks for crystal growth, protein crystallization, space biological medicine, and quantum communication transponders.`,
    category: 'Science & Technology',
    source: 'Indian Space Research Organisation (ISRO)',
    sourceUrl: 'https://www.isro.gov.in/',
    sourceProvenance: {
      sourceId: 'src_isro',
      sourceName: 'ISRO Press Release',
      sourceType: 'GOVERNMENT',
      adapter: 'isro'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ISRO', 'Bharatiya Antariksh Station', 'BAS', 'NGLV', 'Space Station', 'GS-3'],
    prelimsPointers: [
      'Bharatiya Antariksh Station (BAS) is targeted for full operational capability by 2035.',
      'Next Generation Launch Vehicle (NGLV) will use methalox (liquid methane + liquid oxygen) propellant for reusability.',
      'India signed the Artemis Accords in 2023 for peaceful space exploration.'
    ],
    mainsQuestions: [
      'Examine the strategic and scientific significance of India’s planned Bharatiya Antariksh Station in the evolving global space order. (150 words, 10 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_space_technology_2026',
    topicClusterTitle: 'Space Technology & Human Spaceflight',
    publishedAt: '2026-08-15T11:30:00.000Z'
  },
  {
    id: 'ca_2026_08_15_08',
    date: '2026-08-15',
    title: 'Ministry of Law & Justice Launches Nationwide "Nyaya Bandhu 2.0" Pro Bono Legal Aid Mobile App',
    summary: 'The Department of Justice expands pro bono legal representation by connecting indigent litigants and marginalized undertrials with practicing advocates across all High Courts and District Legal Services Authorities.',
    content: `The Union Ministry of Law & Justice has unveiled the upgraded Nyaya Bandhu (Pro Bono Legal Services) 2.0 mobile application and web portal to fulfill the mandate of Article 39A of the Constitution.

Key Upgrades:
1. Automated Matching: AI-driven matching of pro bono advocate specializations (criminal, civil, matrimonial) with registered marginalized applicants seeking legal representation.
2. Integration with NALSA: Seamless workflow coordination with the National Legal Services Authority (NALSA) and State Legal Services Authorities (SLSA).
3. Tele-Law Convergence: Direct access enabled through Common Services Centres (CSCs) in over 2.5 lakh gram panchayats nationwide.`,
    category: 'Polity & Governance',
    source: 'Press Information Bureau (PIB) - Ministry of Law & Justice',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081508',
    sourceProvenance: {
      sourceId: 'src_pib_law',
      sourceName: 'Ministry of Law & Justice',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Article 39A', 'Legal Aid', 'NALSA', 'Nyaya Bandhu', 'Justice Delivery', 'GS-2'],
    prelimsPointers: [
      'Article 39A (Equal justice and free legal aid) was inserted by the 42nd Constitutional Amendment Act, 1976.',
      'National Legal Services Authority (NALSA) was constituted under the Legal Services Authorities Act, 1987.',
      'The Chief Justice of India is the Patron-in-Chief of NALSA.'
    ],
    mainsQuestions: [
      'Evaluate the role of technology-enabled legal aid in realizing the constitutional promise of equal access to justice under Article 39A. (200 words, 12.5 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-15T12:00:00.000Z'
  }
];

export const OFFICIAL_CURRENT_AFFAIRS: CurrentAffairArticle[] = [
  ...RECENT_CURRENT_AFFAIRS,
  ...HISTORICAL_SEEDS_10_TO_14,
  ...HISTORICAL_SEEDS_05_TO_09
];
