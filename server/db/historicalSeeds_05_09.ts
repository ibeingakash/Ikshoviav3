import { CurrentAffairArticle } from '../../src/types/index.js';

export const HISTORICAL_SEEDS_05_TO_09: CurrentAffairArticle[] = [
  // =========================================================================
  // AUGUST 09, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_09_01',
    date: '2026-08-09',
    title: 'Ministry of Road Transport Unveils Masterplan for 35 Multi-Modal Logistics Parks (MMLPs) under PM Gati Shakti',
    summary: 'The Ministry of Road Transport & Highways (MoRTH) and National Highways Logistics Management Limited (NHLML) fast-track land acquisition and private concession agreements for mega intermodal hubs across 10 key industrial corridors.',
    content: `The Ministry of Road Transport and Highways (MoRTH) has released the comprehensive progress blueprint for developing 35 Multi-Modal Logistics Parks (MMLPs) across India under the National Master Plan for Multi-Modal Connectivity (PM Gati Shakti).

Strategic Significance:
1. Logistics Cost Reduction: Aims to lower India's logistics cost from ~13% of GDP to 8-9%, matching global OECD benchmarks.
2. Intermodal Integration: Hubs feature direct railway sidings, 6-lane highway links, automated sorting yards, and temperature-controlled cold storages for agricultural and pharmaceutical exports.
3. Private Capital Mobilization: Developed under Design-Build-Finance-Operate-Transfer (DBFOT) Public-Private Partnership (PPP) concessions with 45-year tenures.`,
    category: 'Infrastructure & Economy',
    source: 'Press Information Bureau (PIB) - Ministry of Road Transport',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080901',
    sourceProvenance: {
      sourceId: 'src_pib_morth',
      sourceName: 'Ministry of Road Transport & Highways',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['PM Gati Shakti', 'MMLP', 'MoRTH', 'Logistics Policy', 'Infrastructure', 'GS-3'],
    prelimsPointers: [
      'PM Gati Shakti National Master Plan was launched in October 2021 as a GIS-based digital platform unifying 16 infrastructure ministries.',
      'National Logistics Policy (NLP) 2022 aims to improve India’s ranking in the World Bank Logistics Performance Index (LPI).',
      'NHLML is a 100% owned special purpose vehicle (SPV) of the National Highways Authority of India (NHAI).'
    ],
    mainsQuestions: [
      'Evaluate how Multi-Modal Logistics Parks (MMLPs) under PM Gati Shakti can resolve systemic bottlenecks in freight transport and supply chain logistics in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_infrastructure_logistics_2026',
    topicClusterTitle: 'Infrastructure Corridors, PM Gati Shakti & Logistics Modernization',
    publishedAt: '2026-08-09T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_09_02',
    date: '2026-08-09',
    title: 'Bihar State Planning Department Releases Aspirational District & Block Monitoring Framework 2026',
    summary: 'The Bihar Government introduces a real-time data dashboard tracking 40 key performance indicators across health, nutrition, education, agriculture, and infrastructure for 61 aspirational blocks in Bihar.',
    content: `The Bihar State Planning Board and Department of Planning & Development have launched the institutionalized State Aspirational Block Programme (ABP) Monitoring Framework.

Program Highlights:
- Targeted Saturation: Focuses on 61 developmentally lagging blocks across 27 districts in Bihar, converging resources from state schemes with NITI Aayog guidelines.
- Key Indicators: Tracking maternal anemia, institutional deliveries, functional tap water connections, school pupil-teacher ratios, and micro-irrigation penetration.
- Performance Incentive Grants: Annual untied challenge grants of ₹5 crore awarded to top-ranking blocks demonstrating maximum quarterly delta improvements.`,
    category: 'Bihar Special',
    source: 'Department of Planning & Development - Government of Bihar',
    sourceUrl: 'https://planning.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_planning',
      sourceName: 'Bihar Planning Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Aspirational Blocks', 'NITI Aayog', 'Planning Dept', 'Saat Nischay-2', 'BPSC_GS2'],
    prelimsPointers: [
      'NITI Aayog launched the nationwide Aspirational Blocks Programme (ABP) in January 2023 covering 500 blocks across the country.',
      'Bihar accounts for 61 blocks under the national Aspirational Blocks Programme.',
      'The Aspirational Districts Programme (ADP) was initially launched in 2018 covering 112 districts nationwide.'
    ],
    mainsQuestions: [
      'Discuss how micro-targeted governance through the Aspirational Blocks Programme addresses intra-district regional disparities in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_governance_2026',
    topicClusterTitle: 'Bihar Social Welfare & Institutional Governance',
    publishedAt: '2026-08-09T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_09_03',
    date: '2026-08-09',
    title: 'The Hindu Editorial: Transforming Logistics in India — National Logistics Policy and Modal Shift to Rail',
    summary: 'A critical analysis of India’s freight transportation mix, examining why rail freight share must increase from 27% to 45% to achieve national climate targets and lower manufacturing supply chain friction.',
    content: `India’s freight movement is heavily skewed towards road transport, which accounts for over 65% of domestic freight traffic despite being four times more carbon-intensive and significantly more expensive than railways and inland waterways.

Editorial Arguments:
- Modal Imbalance: Dedicated Freight Corridors (Eastern and Western DFCs) have increased average freight train speeds, but last-mile rail terminal connectivity remains deficient.
- Coastal & Waterway Transport: National Waterways (such as NW-1 on Ganga) offer low-cost bulk commodity transit but suffer from siltation and inadequate multimodal river terminal infrastructure.
- Green Freight Solutions: Mandatory EV truck adoption for short-haul urban distribution and open-access rail wagon leasing schemes for private logistics operators.`,
    category: 'Economy & Infrastructure',
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
    tags: ['Logistics', 'Rail Freight', 'DFC', 'Inland Waterways', 'Climate Action', 'GS-3'],
    prelimsPointers: [
      'National Waterway-1 (NW-1) spans 1,620 km from Prayagraj to Haldia along the Ganga-Bhagirathi-Hooghly river system.',
      'Dedicated Freight Corridor Corporation of India Limited (DFCCIL) is a public sector undertaking under the Ministry of Railways.',
      'Rail freight emits approximately one-fifth of the greenhouse gas emissions of road freight per ton-kilometer.'
    ],
    mainsQuestions: [
      'Examine the economic and environmental imperatives of increasing the share of railways and inland waterways in India’s freight modal mix. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_infrastructure_logistics_2026',
    topicClusterTitle: 'Infrastructure Corridors, PM Gati Shakti & Logistics Modernization',
    publishedAt: '2026-08-09T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_09_04',
    date: '2026-08-09',
    title: 'Ministry of Tribal Affairs Expands PM-JANMAN Scheme to Saturate Basic Amenities in 75 PVTG Habitats',
    summary: 'The Central Government approves accelerated financial allocations under Pradhan Mantri Janjati Adivasi Nyaya Maha Abhiyan (PM-JANMAN) for pucca housing, piped drinking water, and road connectivity for Particularly Vulnerable Tribal Groups.',
    content: `The Ministry of Tribal Affairs (MoTA) in coordination with 9 line ministries has reviewed the implementation of PM-JANMAN, designed to deliver essential welfare entitlements to 75 Particularly Vulnerable Tribal Groups (PVTGs).

Core Interventions:
1. Habitation Connectivity: Constructing 5,000 km of all-weather roads connecting isolated forest habitations under PMGSY norms.
2. Clean Energy & Water: Solar home lighting systems and Jal Jeevan Mission off-grid community water filtration units in hilly and non-electrified tribal hamlets.
3. Mobile Medical Units & Nutrition: Setting up 1,000 Van Dhan Vikas Kendras and specialized mobile sickle-cell screening clinics.`,
    category: 'Social Justice & Governance',
    source: 'Press Information Bureau (PIB) - Ministry of Tribal Affairs',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080904',
    sourceProvenance: {
      sourceId: 'src_pib_mota',
      sourceName: 'Ministry of Tribal Affairs',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_preamble',
    tags: ['PM-JANMAN', 'PVTG', 'Tribal Welfare', 'Ministry of Tribal Affairs', 'Article 275', 'GS-2'],
    prelimsPointers: [
      'In 1973, the Dhebar Commission created Primitive Tribal Groups (PTGs) as a distinct category, renamed Particularly Vulnerable Tribal Groups (PVTGs) in 2006.',
      'There are 75 recognized PVTG communities residing across 18 states and the Union Territory of Andaman and Nicobar Islands.',
      'Odisha has the highest number of recognized PVTG communities (13) in India.'
    ],
    mainsQuestions: [
      'Particularly Vulnerable Tribal Groups (PVTGs) face acute socio-economic marginalization. Evaluate the strategy and challenges of PM-JANMAN in ensuring inclusive development. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_tribal_welfare_2026',
    topicClusterTitle: 'Vulnerable Groups, Tribal Empowerment & Social Justice',
    publishedAt: '2026-08-09T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_09_05',
    date: '2026-08-09',
    title: 'ISRO Tests 3D-Printed Semi-Cryogenic Engine Pre-Burner for Next Generation Launch Vehicles (NGLV)',
    summary: 'The Liquid Propulsion Systems Centre (LPSC) of ISRO achieves hot-fire ignition test of an additive-manufactured semi-cryogenic engine pre-burner using kerosene and liquid oxygen (LOX-Kero).',
    content: `ISRO has marked a major propulsion milestone at its Propulsion Complex (IPRC) in Mahendragiri, Tamil Nadu, with the hot-testing of a 3D-printed semi-cryogenic engine pre-burner.

Propulsion Breakthrough:
- Additive Manufacturing: Utilizing laser powder bed fusion (LPBF) to print complex regenerative cooling channels in high-temperature Inconel superalloys, reducing engine parts count from 200 to 1 single consolidated component.
- LOX-Kerosene Cycle: The 2000 kN semi-cryogenic engine (SE-2000) will replace the earth-storable liquid core stage in future heavy-lift launch vehicles, doubling LEO payload capacity to 20 metric tons.
- Cost Efficiency: Kerosene (Isrosene) offers higher density, safer handling, and lower fuel costs compared to unsymmetrical dimethylhydrazine (UDMH).`,
    category: 'Science & Technology',
    source: 'Indian Space Research Organisation (ISRO)',
    sourceUrl: 'https://www.isro.gov.in/',
    sourceProvenance: {
      sourceId: 'src_isro',
      sourceName: 'ISRO Official Update',
      sourceType: 'GOVERNMENT',
      adapter: 'isro'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ISRO', 'Semi-Cryogenic', 'NGLV', 'Additive Manufacturing', 'Space Propulsion', 'GS-3'],
    prelimsPointers: [
      'Semi-cryogenic engines utilize refined kerosene (Isrosene) as fuel and liquid oxygen (LOX) as the oxidizer at -183°C.',
      'Unlike fully cryogenic engines (which use liquid hydrogen at -253°C and LOX), semi-cryogenic propellant has higher density and does not require deep cryogenic insulation for fuel.',
      'IPRC (ISRO Propulsion Complex) is situated at Mahendragiri in Tirunelveli district of Tamil Nadu.'
    ],
    mainsQuestions: [
      'Explain the technological advantages of semi-cryogenic propulsion systems over conventional liquid propellant engines in heavy satellite launch vehicles. (150 words, 10 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_space_technology_2026',
    topicClusterTitle: 'Space Technology & Human Spaceflight',
    publishedAt: '2026-08-09T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_09_06',
    date: '2026-08-09',
    title: 'Bihar Art, Culture & Youth Department Sanctions Bodh Gaya International Buddhist Cultural Center',
    summary: 'The Bihar Government approves ₹180 crore for developing an international Buddhist convention and experiential museum at Bodh Gaya, integrating UNESCO World Heritage conservation protocols.',
    content: `The Bihar Department of Art, Culture and Youth has accorded administrative approval for the construction of the Bodh Gaya International Buddhist Cultural & Heritage Centre.

Key Components:
- Architectural Heritage: Designed around ancient Magadhan stone relief architecture, showcasing sacred Buddhist relics, stupa architecture, and historical monastic art.
- International Pilgrim Facilities: Multilingual translation centers for delegations from Southeast Asian Buddhist nations (Japan, Thailand, Vietnam, Sri Lanka, Myanmar, Cambodia).
- Conservation Buffer: Strictly enforces eco-sensitive building heights and green zones within the 5 km buffer zone of the Mahabodhi Temple Complex UNESCO site.`,
    category: 'Bihar Special',
    source: 'Department of Art, Culture & Youth - Government of Bihar',
    sourceUrl: 'https://culture.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_culture',
      sourceName: 'Bihar Art & Culture Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Bodh Gaya', 'Mahabodhi Temple', 'UNESCO', 'Buddhism', 'BPSC_GS1'],
    prelimsPointers: [
      'Mahabodhi Temple Complex at Bodh Gaya was inscribed as a UNESCO World Heritage Site in 2002.',
      'The Vajrasana (Diamond Throne) at Bodh Gaya was originally established by Emperor Ashoka in the 3rd century BCE to mark the exact spot of Buddha’s Enlightenment.',
      'Nalanda Mahavihara was inscribed as Bihar’s second UNESCO World Heritage Site in 2016.'
    ],
    mainsQuestions: [
      'Trace the significance of Bihar as the cradle of Buddhism and evaluate state initiatives in promoting the Buddhist Tourism Circuit. (200 words, 38 Marks, BPSC GS-1)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_heritage_2026',
    topicClusterTitle: 'Bihar Cultural Heritage & Tourism Economy',
    publishedAt: '2026-08-09T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_09_07',
    date: '2026-08-09',
    title: 'Indian Express Explained: Fiscal Deficit Monetisation and Central Bank Balance Sheet Operations',
    summary: 'An analytical explainer on direct deficit financing versus secondary market open market operations (OMO), comparing historical Ways and Means Advances (WMA) with modern debt management frameworks.',
    content: `With global central banks managing elevated sovereign debt burdens post-pandemic, understanding the distinction between direct deficit monetisation (printing currency to fund deficits) and indirect market-based central bank operations is vital.

Core Concepts:
1. Direct Monetisation (Deficit Financing): Prior to 1997, the RBI automatically monetised government deficits through ad-hoc Treasury Bills. This practice was abolished by the landmark 1997 RBI-Government agreement and replaced with Ways and Means Advances (WMA).
2. FRBM Act Safeguards: Section 5 of the Fiscal Responsibility and Budget Management (FRBM) Act 2003 prohibits the RBI from directly subscribing to primary issuances of central government securities, with narrow escape clauses for national security or calamity.
3. Modern Open Market Operations (OMO): RBI conducts secondary market bond purchases/sales solely to manage liquidity and interest rate transmission, not to underwrite fiscal spending directly.`,
    category: 'Economy & Governance',
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
    conceptId: 'c_fiscal_fed',
    tags: ['Fiscal Deficit', 'Monetisation', 'FRBM Act', 'RBI', 'WMA', 'Public Finance', 'GS-3'],
    prelimsPointers: [
      'Ways and Means Advances (WMA) are temporary overdraft facilities provided by the RBI to the Union and State governments to bridge temporary cash flow mismatches.',
      'The FRBM Act was enacted in 2003 to institutionalize fiscal discipline and reduce fiscal deficit.',
      'The N.K. Singh Committee on FRBM recommended targeting a debt-to-GDP ratio of 60% (40% Central, 20% States) by 2023.'
    ],
    mainsQuestions: [
      'Distinguish between direct monetisation of fiscal deficit and secondary market liquidity management by the Reserve Bank of India. What are the macroeconomic risks of fiscal dominance? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_macro_economy_2026',
    topicClusterTitle: 'Macroeconomic Stability & Monetary Governance',
    publishedAt: '2026-08-09T06:00:00.000Z'
  },

  // =========================================================================
  // AUGUST 08, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_08_01',
    date: '2026-08-08',
    title: 'Ministry of Commerce Notifies E-Commerce Export Hubs (ECEHs) Framework under Foreign Trade Policy',
    summary: 'The Directorate General of Foreign Trade (DGFT) releases operational guidelines for establishing dedicated cross-border e-commerce export zones with paperless customs clearance, fast-track returns processing, and automated GST refunds.',
    content: `The Directorate General of Foreign Trade (DGFT), Ministry of Commerce and Industry, has notified the regulatory framework for establishing E-Commerce Export Hubs (ECEHs) across major air cargo and courier terminals in India.

Key Features:
1. Cross-Border Fulfillment Centers: Single-window warehousing hubs enabling MSMEs and artisans to stock goods near international cargo airports for rapid international dispatch.
2. Expedited Re-Import & Returns Processing: Simplified duty-free return protocols for rejected or returned export parcels, resolving a major bottleneck for small cross-border sellers.
3. Export Target: Designed to scale India's e-commerce merchandise exports from $5 billion to $100 billion by 2030, leveraging ONDC cross-border interoperability.`,
    category: 'Economy & Trade',
    source: 'Press Information Bureau (PIB) - Ministry of Commerce',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080801',
    sourceProvenance: {
      sourceId: 'src_pib_commerce',
      sourceName: 'Ministry of Commerce & Industry',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['E-Commerce Export Hubs', 'DGFT', 'FTP 2023', 'MSME Exports', 'ONDC', 'GS-3'],
    prelimsPointers: [
      'Foreign Trade Policy (FTP) 2023 was announced with no sunset date, transitioning from an incentive-based to a remission and entitlement-based regime.',
      'ONDC (Open Network for Digital Commerce) is an initiative of DPIIT to democratize digital commerce by moving from platform-centric to open network architecture.',
      'DGFT functions as an attached office of the Ministry of Commerce and Industry.'
    ],
    mainsQuestions: [
      'Analyze the potential of cross-border e-commerce in integrating Indian MSMEs and traditional craft clusters into global value chains. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-08T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_08_02',
    date: '2026-08-08',
    title: 'Bihar Industries Department Inks MoUs for 10 Mega Grain-Based Ethanol Distilleries under Biofuels Policy',
    summary: 'The Bihar Government signs agreements worth ₹1,400 crore for state-of-the-art grain-based ethanol plants in Purnia, Gopalganj, Muzaffarpur, and Buxar, positioning Bihar as the leading biofuels manufacturing hub in Eastern India.',
    content: `The Bihar Department of Industries has approved commercial proposals for 10 new grain-based ethanol production units under the Bihar Biofuels Production Promotion Policy.

Strategic Highlights:
- Feedstock Sourcing: Units will utilize surplus broken rice and locally harvested maize from Seemanchal and Mithila farmer cooperatives, ensuring remunerative floor prices.
- Production Capacity: Adds 650 kilolitres per day (KLPD) to Bihar’s existing ethanol refining capacity, supplying Oil Marketing Companies (OMCs) under the national E20 blending mandate.
- Zero Liquid Discharge (ZLD): Mandatory multi-effect evaporators and biomass boilers producing Distillers Dried Grains with Solubles (DDGS) as high-protein livestock feed.`,
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
    tags: ['Bihar Special', 'Ethanol Policy', 'Biofuels', 'E20 Blending', 'BIADA', 'BPSC_GS2'],
    prelimsPointers: [
      'Bihar became the first state in India to implement an Ethanol Production Promotion Policy in 2021.',
      'India’s National Policy on Biofuels 2018 advanced the target for achieving 20% ethanol blending in petrol (E20) to ESY 2025-26.',
      'DDGS (Distillers Dried Grains with Solubles) is a high-protein byproduct of grain fermentation used in animal feed.'
    ],
    mainsQuestions: [
      'Evaluate the prospects and economic ripple effects of grain-based ethanol manufacturing on Bihar’s agrarian economy. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-08T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_08_03',
    date: '2026-08-08',
    title: 'The Indian Express Editorial: Scaling India’s E-Commerce Exports — Logistics, Customs Digitisation and Financial Railing',
    summary: 'An editorial analysis examining how establishing designated export postal centers, automated foreign exchange reconciliation, and courier export limits can unlock billions in handicraft and apparel exports.',
    content: `While China exports over $300 billion annually through cross-border e-commerce platforms, India’s e-commerce exports remain under $5 billion due to legacy courier regulations and paper-intensive banking clearances.

Key Editorial Points:
- Courier vs Freight Disparity: Small artisan exporters face onerous EDPMS (Export Data Processing and Monitoring System) reconciliation burdens designed for bulk maritime cargo.
- Postal Export Modernization: Upgrading Dak Ghar Niryat Kendras (DNKs) across 800+ post offices with digital customs clearance and flat-rate international air postage.
- Currency Hedging for MSMEs: Providing automated micro-hedging and low-cost escrow payment solutions to protect small sellers against foreign exchange volatility.`,
    category: 'Economy & Trade',
    source: 'The Indian Express - Editorial Desk',
    sourceUrl: 'https://indianexpress.com/article/opinion/editorials',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'The Indian Express Editorial Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['E-Commerce', 'MSME', 'Exports', 'EDPMS', 'Dak Ghar Niryat', 'GS-3'],
    prelimsPointers: [
      'Dak Ghar Niryat Kendras (DNKs) are specialized post office export facilitation desks set up by India Post and CBIC.',
      'EDPMS (Export Data Processing and Monitoring System) is an electronic platform maintained by the RBI to track export realization.',
      'Central Board of Indirect Taxes and Customs (CBIC) administers customs and GST under the Department of Revenue.'
    ],
    mainsQuestions: [
      'What structural and procedural impediments hinder small businesses in India from participating in cross-border e-commerce? Suggest actionable policy solutions. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-08T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_08_04',
    date: '2026-08-08',
    title: 'Supreme Court Bench Upholds Enforcement Directorate Powers under PMLA with Strict Procedural Safeguards',
    summary: 'A 3-judge bench of the Supreme Court clarifies the scope of Section 19 (Arrest Powers) and Section 45 (Twin Bail Conditions) under the Prevention of Money Laundering Act (PMLA), requiring written reasons for arrest.',
    content: `The Supreme Court of India has issued vital clarifying guidelines regarding the investigative powers of the Directorate of Enforcement (ED) under the Prevention of Money Laundering Act (PMLA) 2002.

Judicial Directives:
1. Written Grounds of Arrest: In furtherance of Article 22(1) constitutional safeguards, the ED must furnish the written 'grounds of arrest' to the accused at the time of detention without exception.
2. Predicate Offence Nexus: PMLA proceedings cannot stand independently if the accused has been acquitted or discharged in the underlying predicate (scheduled) scheduled criminal case.
3. Speedy Trial and Article 21: Prolonged pre-trial incarceration without substantial trial progress entitles the accused to bail notwithstanding the stringent twin conditions under Section 45.`,
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
    tags: ['PMLA', 'Enforcement Directorate', 'Article 21', 'Article 22', 'Supreme Court', 'GS-2'],
    prelimsPointers: [
      'The Prevention of Money Laundering Act (PMLA) was enacted in 2002 to prevent money laundering and provide for confiscation of property derived from criminal activities.',
      'The Directorate of Enforcement (ED) functions under the Department of Revenue, Ministry of Finance.',
      'Section 45 of PMLA requires the court to be satisfied that there are reasonable grounds for believing the accused is not guilty and not likely to commit an offense while on bail.'
    ],
    mainsQuestions: [
      'Examine the constitutional tension between stringent anti-money laundering statutory regimes (PMLA) and fundamental rights guaranteed under Articles 21 and 22 of the Constitution. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-08T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_08_05',
    date: '2026-08-08',
    title: 'Ministry of New & Renewable Energy Releases National Offshore Wind Energy Tender for Gujarat and Tamil Nadu',
    summary: 'The Ministry of New and Renewable Energy (MNRE) issues commercial bid documents for 4,000 MW of seabed seabed-lease offshore wind installations with viability gap funding (VGF) support.',
    content: `The Ministry of New and Renewable Energy (MNRE) through the Solar Energy Corporation of India (SECI) has invited international tenders for developing India’s first commercial offshore wind energy farms.

Key Project Parameters:
- Seabed Allocations: 2,000 MW off the Gulf of Khambhat (Gujarat) and 2,000 MW off the Gulf of Mannar (Tamil Nadu).
- Fiscal Viability Gap Funding (VGF): ₹7,453 crore approved by the Union Cabinet to subsidize submarine cabling, offshore substation construction, and specialized port upgrades at Deendayal (Kandla) and VO Chidambaranar (Tuticorin) ports.
- High Plant Load Factor (PLF): Offshore wind turbines achieve 40-45% PLF due to stronger and more consistent ocean wind velocities compared to onshore wind turbines (25-30%).`,
    category: 'Environment & Renewable Energy',
    source: 'Press Information Bureau (PIB) - Ministry of New and Renewable Energy',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080805',
    sourceProvenance: {
      sourceId: 'src_pib_mnre',
      sourceName: 'Ministry of New & Renewable Energy',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Offshore Wind', 'MNRE', 'VGF', 'Gujarat', 'Tamil Nadu', 'Clean Energy', 'GS-3'],
    prelimsPointers: [
      'National Offshore Wind Energy Policy was notified by the Ministry of New and Renewable Energy in 2015.',
      'National Institute of Wind Energy (NIWE) in Chennai is the nodal agency for resource assessment and technical verification of wind sites.',
      'India possesses an estimated 70 GW of offshore wind energy potential along its 7,517 km coastline, primarily off Gujarat and Tamil Nadu.'
    ],
    mainsQuestions: [
      'Discuss the engineering, financial, and environmental challenges of harnessing offshore wind energy in India. How does the Viability Gap Funding (VGF) framework address commercial risks? (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_clean_energy_grid_transition',
    topicClusterTitle: 'Clean Energy Transition, Battery Storage & Power Sector Reforms',
    publishedAt: '2026-08-08T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_08_06',
    date: '2026-08-08',
    title: 'Bihar Agriculture Department Launches Makhana and Organic Vegetable Cluster in Kosi Basin',
    summary: 'The Bihar Government sanction ₹120 crore for establishing modern Makhana seed nurseries, organic certification hubs, and solar drip irrigation systems across Saharsa, Supaul, and Madhepura districts.',
    content: `The Bihar Department of Agriculture has launched the Kosi Basin Organic Makhana and Horticulture Corridor to empower smallholder wetland farmers.

Program Components:
- Seed Improvement: Distribution of high-yielding 'Sabour Makhana-1' and 'Swarna Vaidehi' seeds developed by BAU Sabour and ICAR RCER Patna.
- Direct Export Certification: Bihar State Seed & Organic Certification Agency (BSSOCA) to provide 100% subsidized organic certification for 8,000 hectares of aquatic wetlands.
- Solar Processing Centers: Establishing 50 village-level automated makhana popping, grading, and nitrogen-sealed packaging facilities to eliminate smoke exposure for traditional artisanal processors.`,
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
    tags: ['Bihar Special', 'Makhana', 'Kosi Basin', 'Organic Farming', 'BAU Sabour', 'BPSC_GS2'],
    prelimsPointers: [
      'Sabour Makhana-1 is an improved high-yielding variety developed by Bihar Agricultural University (BAU), Sabour.',
      'ICAR Research Complex for Eastern Region (ICAR-RCER) is headquartered at Patna, Bihar.',
      'Bihar State Seed & Organic Certification Agency (BSSOCA) is accredited under the National Programme for Organic Production (NPOP).'
    ],
    mainsQuestions: [
      'Examine the socio-economic and technological transformations occurring in traditional Makhana cultivation in North Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-08T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_08_07',
    date: '2026-08-08',
    title: 'Drishti Editorial Analysis: Climate Finance Negotiations — The New Collective Quantified Goal and Loss & Damage',
    summary: 'A detailed exploration of UNFCCC climate finance architectures, evaluating the New Collective Quantified Goal (NCQG) replacement for the $100 billion annual target and operationalizing the Loss and Damage Fund for vulnerable nations.',
    content: `As climate change drives unprecedented weather extremes across the Global South, international climate negotiations under the United Nations Framework Convention on Climate Change (UNFCCC) hinge fundamentally on the resolution of the climate finance impasse.

Key Dimensions of the Debate:
1. NCQG Architecture: Developing countries demand an annual public grant-equivalent floor of at least $1 trillion to cover adaptation, mitigation, and just energy transitions, replacing the unmet $100 billion goal.
2. Contributor Base Expansion: Developed economies attempt to expand the contributor base to include emerging economies (like China and Gulf states), which the G77 and BASIC blocs resist based on Common But Differentiated Responsibilities and Respective Capabilities (CBDR-RC).
3. Loss and Damage Fund: Ensuring direct access windows for sub-national local communities and vulnerable island states without creating new sovereign debt burdens.`,
    category: 'Environment & Climate Change',
    source: 'Drishti IAS (Supplementary Analysis)',
    sourceUrl: 'https://www.drishtiias.com/daily-updates/daily-news-editorials/climate-finance-ncqg-unfccc',
    sourceProvenance: {
      sourceId: 'src_drishti',
      sourceName: 'Drishti IAS Editorial Analysis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'drishti'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Climate Finance', 'UNFCCC', 'NCQG', 'Loss and Damage', 'CBDR-RC', 'COP31', 'GS-3'],
    prelimsPointers: [
      'The New Collective Quantified Goal (NCQG) on climate finance was mandated under Article 9 of the 2015 Paris Agreement to succeed the $100 billion target.',
      'Common But Differentiated Responsibilities and Respective Capabilities (CBDR-RC) is a foundational principle under the 1992 UNFCCC.',
      'The Loss and Damage Fund was formally established at COP27 in Sharm El-Sheikh (2022) and operationalized at COP28 in Dubai (2023).'
    ],
    mainsQuestions: [
      'Critically analyze the contentious issues surrounding the New Collective Quantified Goal (NCQG) on climate finance. How should India articulate the financial demands of the Global South? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_climate_finance_2026',
    topicClusterTitle: 'Climate Finance, Loss & Damage and Global Environmental Pacts',
    publishedAt: '2026-08-08T11:00:00.000Z'
  },

  // =========================================================================
  // AUGUST 07, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_07_01',
    date: '2026-08-07',
    title: 'Ministry of Health Revises National Rare Disease Policy 2026: Increases Financial Aid to ₹75 Lakh per Patient',
    summary: 'The Union Ministry of Health and Family Welfare amends the National Policy for Rare Diseases (NPRD), enhancing financial assistance across 12 designated Centers of Excellence (CoEs) for pediatric lysosomal storage disorders.',
    content: `The Union Ministry of Health and Family Welfare has notified significant amendments to the National Policy for Rare Diseases (NPRD 2026) to expand life-saving therapeutic access.

Key Policy Upgrades:
1. Enhanced Fiscal Grant: One-time financial support under Rashtriya Arogya Nidhi increased from ₹50 lakh to ₹75 lakh per eligible patient for rare diseases requiring bone marrow transplant or expensive enzyme replacement therapy.
2. Centers of Excellence (CoEs): Expanding the CoE network from 12 to 24 premier tertiary hospitals (including AIIMS, PGIMER, and IGIMS Patna) with dedicated genetic counseling units.
3. Domestic Orphan Drug Manufacturing: Production-Linked Incentive (PLI) scheme rolled out for indigenous synthesis of off-patent orphan medications to cut therapy costs by 80%.`,
    category: 'Public Health & Governance',
    source: 'Press Information Bureau (PIB) - Ministry of Health',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080701',
    sourceProvenance: {
      sourceId: 'src_pib_health',
      sourceName: 'Ministry of Health & Family Welfare',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Rare Diseases', 'NPRD 2026', 'Health Ministry', 'Orphan Drugs', 'Public Health', 'GS-2'],
    prelimsPointers: [
      'WHO defines a rare disease as a debilitating lifelong disease or disorder that affects 1 or less per 1000 population.',
      'Under the NPRD, rare diseases are categorized into three groups: Group 1 (one-time curative treatment), Group 2 (long-term/lifelong treatment with low cost), and Group 3 (definitive treatment with very high lifelong cost).',
      'Rashtriya Arogya Nidhi (RAN) provides financial assistance to poor patients suffering from major life-threatening diseases.'
    ],
    mainsQuestions: [
      'Examine the ethical, legal, and financial dimensions of state-funded treatment for rare genetic diseases in India. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_public_health_policy_2026',
    topicClusterTitle: 'Public Health Infrastructure, Universal Healthcare & Medical Missions',
    publishedAt: '2026-08-07T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_07_02',
    date: '2026-08-07',
    title: 'Bihar Urban Development Department Approves Patna Metro Extension to Bihta Airport & Danapur Cantt',
    summary: 'The Bihar State Cabinet approves ₹5,200 crore for Phase-II detailed project report (DPR) connecting Patna Metro Corridor-1 to Bihta International Civil Enclave and Danapur Railway Station.',
    content: `The Bihar Urban Development and Housing Department in consultation with Patna Metro Rail Corporation (PMRC) and Delhi Metro Rail Corporation (DMRC) has approved the alignment of the Patna Metro extension.

Project Highlights:
- Airport & Rail Connectivity: Extends Corridor-1 (Danapur to Khemnichak) by 24 km to reach the upcoming commercial civil enclave at Bihta Airport, relieving heavy arterial congestion on NH-30.
- Multimodal Interchanges: Seamless skywalk and ticketing integration at Danapur Railway Station and Khemnichak interchange station.
- Green Transit: Designed to shift 4.5 lakh daily passenger trips from fossil-fuel intermediate public transport (auto-rickshaws, private buses) to electrified mass rapid transit.`,
    category: 'Bihar Special',
    source: 'Urban Development & Housing Department - Government of Bihar',
    sourceUrl: 'https://urban.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_urban',
      sourceName: 'Bihar Urban Development Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Patna Metro', 'Bihta Airport', 'Urban Mobility', 'PMRC', 'BPSC_GS2'],
    prelimsPointers: [
      'Patna Metro Rail Project was officially approved by the Union Cabinet in February 2019.',
      'Japan International Cooperation Agency (JICA) is funding a major portion of the Patna Metro project via soft official development assistance (ODA) loans.',
      'Patna Metro is being implemented as a 50:50 joint venture between the Government of India and the Government of Bihar.'
    ],
    mainsQuestions: [
      'Evaluate the role of mass transit systems like the Patna Metro in transforming urban agglomerations in Bihar. What land acquisition and urban planning challenges must be addressed? (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_urban_2026',
    topicClusterTitle: 'Bihar Urban Planning, Metro Infrastructure & Smart Cities',
    publishedAt: '2026-08-07T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_07_03',
    date: '2026-08-07',
    title: 'The Hindu Editorial: The Burden of Rare Diseases — High-Cost Orphan Drugs, Indigenous Manufacturing and Public Funding',
    summary: 'An editorial critique analyzing the prohibitive pricing of monopoly biopharmaceutical therapies, evaluating compulsory licensing avenues, and advocating for public-funded genetic screening in prenatal care.',
    content: `For families battling rare genetic conditions such as Spinal Muscular Atrophy (SMA), Gaucher disease, or Pompe disease, the cost of imported biologic therapies running into millions of rupees per year represents an insurmountable catastrophe.

Editorial Perspective:
- Intellectual Property Monopoly: Multinational pharmaceutical corporations exploit extended patent protections and orphan drug exclusivity to charge extortionate prices, creating stark health inequities.
- Domestic Chemical Capabilities: India's robust domestic generic pharmaceutical sector has the chemical engineering capability to synthesize small-molecule equivalents and biosimilars if enabled by technology transfers and compulsory licensing under Section 84 of the Indian Patents Act.
- Universal Preventive Screening: Investing in pre-marital and prenatal carrier screening in high-consanguinity populations is far more cost-effective than attempting to fund lifelong post-symptomatic biologic therapies.`,
    category: 'Public Health & Governance',
    source: 'The Hindu - Lead Editorial',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Rare Diseases', 'Orphan Drugs', 'Patents Act', 'Article 21', 'Public Health', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Section 84 of the Indian Patents Act, 1970 empowers the Controller General of Patents to grant compulsory licenses after 3 years of patent grant under specific conditions.',
      'TRIPS Agreement allows WTO member states flexibility to issue compulsory licenses in cases of national health emergencies.',
      'Article 47 of the Constitution directs the State to regard the raising of the level of nutrition and the improvement of public health as among its primary duties.'
    ],
    mainsQuestions: [
      'Right to health is an integral facet of Article 21. How can India balance pharmaceutical patent protections with affordable access to life-saving orphan drugs? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_public_health_policy_2026',
    topicClusterTitle: 'Public Health Infrastructure, Universal Healthcare & Medical Missions',
    publishedAt: '2026-08-07T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_07_04',
    date: '2026-08-07',
    title: 'Ministry of Communications Notifies Telecom Cyber Security & Critical Infrastructure Protection Rules',
    summary: 'The Department of Telecommunications (DoT) under the Telecommunications Act 2023 mandates trusted telecom equipment certifications, zero-trust network architectures, and real-time incident reporting to CERT-In within 6 hours.',
    content: `The Department of Telecommunications (DoT), Ministry of Communications, has published the Telecommunications (Security and Integrity of Critical Telecommunications Infrastructure) Rules 2026.

Key Regulatory Mandates:
1. National Security Directive on Telecommunication Sector (NSDTS): Mandatory procurement of hardware and software components solely from designated 'Trusted Sources' verified by the National Cyber Security Coordinator (NCSC).
2. Incident Reporting Protocols: Telecom Service Providers (TSPs) and cloud infrastructure providers must report major data breaches, undersea cable outages, and core switching intrusions to CERT-In and DoT within 6 hours.
3. Biometric Subscriber Verification: Telecom operators must integrate AI-based live liveness detection during digital KYC SIM activation to curb cyber fraud networks.`,
    category: 'Internal Security & Cyber Governance',
    source: 'Press Information Bureau (PIB) - Department of Telecommunications',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080704',
    sourceProvenance: {
      sourceId: 'src_pib_dot',
      sourceName: 'Department of Telecommunications',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Cyber Security', 'Telecom Act 2023', 'CERT-In', 'NCSC', 'Critical Infrastructure', 'GS-3'],
    prelimsPointers: [
      'The Telecommunications Act, 2023 repealed the Indian Telegraph Act 1885 and the Indian Wireless Telegraphy Act 1933.',
      'CERT-In (Indian Computer Emergency Response Team) is designated under Section 70B of the Information Technology Act, 2000.',
      'NCIIPC (National Critical Information Infrastructure Protection Centre) was established under Section 70A of the IT Act, 2000.'
    ],
    mainsQuestions: [
      'Examine the emerging cyber threats to India’s critical telecommunications infrastructure. How does the Telecommunications Act 2023 strengthen national security preparedness? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_cyber_security_2026',
    topicClusterTitle: 'Cyber Security, Digital Sovereignty & Critical Infrastructure Protection',
    publishedAt: '2026-08-07T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_07_05',
    date: '2026-08-07',
    title: 'Reserve Bank of India Releases Report on Currency and Finance on Green Finance and Transition Risks',
    summary: 'The RBI’s Report on Currency and Finance (RCF 2026) estimates that India requires $10.1 trillion in cumulative climate finance by 2070, urging financial institutions to conduct mandatory climate scenario stress testing.',
    content: `The Reserve Bank of India has published its flagship thematic Report on Currency and Finance (RCF 2026) focusing on "Towards a Greener Future: Transition Risks and Monetary Policy in India".

Major Findings & Recommendations:
- Transition Capital Gap: India will require green investments of ~2.5% of GDP annually to meet its 2030 Nationally Determined Contributions (NDCs) and 2070 Net Zero targets.
- Stranded Asset Risks: Commercial banks with heavy loan exposures to thermal coal power, fossil extraction, and internal combustion vehicle manufacturing face potential asset degradation as green regulations tighten.
- Green Taxonomy: RBI proposes a standardized Sovereign Green Taxonomy to prevent greenwashing and facilitate cross-border green bond issuances.`,
    category: 'Economy & Environment',
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
    tags: ['RBI', 'Green Finance', 'Transition Risk', 'Climate Economy', 'RCF Report', 'GS-3'],
    prelimsPointers: [
      'The Report on Currency and Finance (RCF) is an annual publication prepared by the Department of Economic and Policy Research (DEPR) of the RBI.',
      'Sovereign Green Bonds (SGrBs) were first issued by the Government of India in January 2023 under a framework certified by CICERO.',
      'Network for Greening the Financial System (NGFS) is a group of central banks and supervisors; RBI joined NGFS in April 2021.'
    ],
    mainsQuestions: [
      'Explain how climate transition risks affect the balance sheets of Indian commercial banks. Discuss the role of central banks in promoting green finance. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_macro_economy_2026',
    topicClusterTitle: 'Macroeconomic Stability & Monetary Governance',
    publishedAt: '2026-08-07T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_07_06',
    date: '2026-08-07',
    title: 'Bihar Women Development Corporation Expands Mukhya Mantri Kanya Utthan Yojana with Direct DBT Tracking',
    summary: 'The Bihar Government integrates automated Aadhaar Payment Bridge System (APBS) and educational lifecycle verification under Kanya Utthan Yojana, benefiting 22 lakh girl students from birth to university graduation.',
    content: `The Bihar Women and Child Development Corporation (WCDC) has launched an upgraded unified portal for the Mukhya Mantri Kanya Utthan Yojana under the Saat Nischay initiative.

Program Highlights:
- Lifecycle Cash Incentives: Progressive financial transfers provided at key developmental milestones: ₹2,000 at birth, ₹1,000 on Aadhaar linking, ₹2,000 on complete immunization, ₹10,000 on passing Class 10 (first division), ₹25,000 on passing Class 12 (unmarried), and ₹50,000 on university graduation.
- Preventing Child Marriage: The scheme has contributed to a 14% drop in minor female marriages and a surge in female gross enrollment ratio (GER) across Bihar colleges.
- Automated DBT Clearing: Integration with MedhaSoft school databases eliminates middlemen and physical document submission.`,
    category: 'Bihar Special',
    source: 'Social Welfare Department - Government of Bihar',
    sourceUrl: 'https://wcdc.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_welfare',
      sourceName: 'Bihar Social Welfare Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Kanya Utthan Yojana', 'Women Empowerment', 'DBT', 'Saat Nischay', 'BPSC_GS2'],
    prelimsPointers: [
      'Mukhya Mantri Kanya Utthan Yojana was launched in April 2018 to prevent female foeticide, promote girl education, and eradicate child marriage in Bihar.',
      'The scheme provides cumulative financial support of up to ₹54,100 to a girl child from birth to graduation.',
      'WCDC (Women and Child Development Corporation) functions under the Social Welfare Department, Government of Bihar.'
    ],
    mainsQuestions: [
      'Evaluate the impact of conditional cash transfer schemes like the Mukhya Mantri Kanya Utthan Yojana on female literacy, child sex ratio, and women empowerment in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_governance_2026',
    topicClusterTitle: 'Bihar Social Welfare & Institutional Governance',
    publishedAt: '2026-08-07T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_07_07',
    date: '2026-08-07',
    title: 'Indian Express Explained: Gravitational Wave Astronomy and the LIGO-India Observatory in Hingoli',
    summary: 'An analytical explainer on laser interferometry, general relativity spacetime ripples, and the construction progress of the Laser Interferometer Gravitational-Wave Observatory (LIGO-India) in Maharashtra.',
    content: `LIGO-India, the third gravitational-wave observatory of its kind in the world, is being constructed in Hingoli district of Maharashtra by the Department of Atomic Energy (DAE) and Department of Science and Technology (DST).

Scientific Dimensions:
1. Physics Principle: Gravitational waves are ripples in spacetime caused by violent cosmic cataclysms such as colliding black holes or merging neutron stars, predicted by Albert Einstein’s General Theory of Relativity (1915).
2. Advanced Interferometry: Uses 4-km-long perpendicular ultra-high vacuum arms with ultra-stabilized infrared lasers to measure spacetime distortions smaller than 1/10,000th the diameter of a proton.
3. Triangulation Advantage: Operating simultaneously with twin LIGO detectors in the United States (Hanford and Livingston) and Virgo in Italy, LIGO-India enables precise celestial pinpointing of deep-space gravitational sources.`,
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
    tags: ['LIGO-India', 'Gravitational Waves', 'General Relativity', 'DAE', 'DST', 'Hingoli', 'GS-3'],
    prelimsPointers: [
      'LIGO-India is a collaborative project between the LIGO Laboratory (Caltech-MIT) and Indian institutions: IUCAA (Pune), RRCAT (Indore), and IPR (Gandhinagar).',
      'The site of LIGO-India is situated in Hingoli district of Maharashtra.',
      'Gravitational waves were first directly detected by LIGO in September 2015, winning the 2017 Nobel Prize in Physics.'
    ],
    mainsQuestions: [
      'Explain the scientific significance of gravitational wave astronomy. How will the commissioning of LIGO-India enhance international multi-messenger astrophysics? (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_deep_tech_physics_2026',
    topicClusterTitle: 'Frontier Physics, Gravitational Wave Astronomy & Big Science Megaprojects',
    publishedAt: '2026-08-07T06:00:00.000Z'
  },

  // =========================================================================
  // AUGUST 06, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_06_01',
    date: '2026-08-06',
    title: 'Prime Minister Leads 10th Governing Council Meeting of NITI Aayog: Focus on Viksit Bharat 2047 State Action Plans',
    summary: 'The apex Governing Council meeting of NITI Aayog convenes State Chief Ministers and Union Ministers to formulate state-specific vision documents on manufacturing hubs, demographic transition, and agricultural productivity.',
    content: `The 10th Governing Council Meeting of NITI Aayog chaired by the Prime Minister was held at Bharat Mandapam, New Delhi, focusing on the theme "Viksit Bharat @ 2047: Role of Team India".

Key Deliberations:
1. State-Centric Economic Planning: Urged states to establish State Institution for Transformation (SIT) bodies modeled after NITI Aayog to streamline policy formulation and investment approvals.
2. Skill Harmonization & Demographic Dividend: Aligning vocational education with global industrial demand in high-tech fields (semiconductors, green hydrogen, aerospace).
3. Water Security & Interlinking: Emphasized rapid state cooperation on inter-state and intra-state river interlinking projects to drought-proof agrarian regions.`,
    category: 'Polity & Governance',
    source: 'Press Information Bureau (PIB) - NITI Aayog / PMO',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080601',
    sourceProvenance: {
      sourceId: 'src_pib_niti',
      sourceName: 'NITI Aayog / PMO',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_fiscal_fed',
    tags: ['NITI Aayog', 'Governing Council', 'Viksit Bharat 2047', 'Cooperative Federalism', 'GS-2'],
    prelimsPointers: [
      'NITI Aayog was established on January 1, 2015 by an executive resolution of the Union Cabinet, replacing the Planning Commission.',
      'The Governing Council of NITI Aayog comprises the Prime Minister as Chairperson, all State Chief Ministers, Chief Ministers of UTs with legislatures, and Lt. Governors of other UTs.',
      'Unlike the erstwhile Planning Commission, NITI Aayog does not possess the power to allocate financial resources to states.'
    ],
    mainsQuestions: [
      'NITI Aayog acts as the apex platform for fostering cooperative and competitive federalism in India. Critically evaluate its role in sub-national economic planning. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_cooperative_federalism_2026',
    topicClusterTitle: 'Cooperative Federalism, Inter-State Relations & Institutional Governance',
    publishedAt: '2026-08-06T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_06_02',
    date: '2026-08-06',
    title: 'Bihar State Cabinet Approves Special Economic Zone for Textiles and Leather in Gaya with ₹600 Crore Fund',
    summary: 'The Bihar Government clears 500 acres of land acquisition in Dobhi (Gaya) along the Amritsar-Kolkata Industrial Corridor (AKIC) for a dedicated textile, garment, and leather manufacturing cluster.',
    content: `The Bihar Cabinet has approved the establishment of a mega Integrated Textile and Leather Park at Dobhi, Gaya district, with a dedicated infrastructure investment of ₹600 crore.

Cluster Highlights:
- Strategic Location: Situated directly on the Amritsar-Kolkata Industrial Corridor (AKIC) and Golden Quadrilateral NH-19, offering freight access to Kolkata port within 8 hours.
- Employment Generation: Projected to create 75,000 direct manufacturing jobs, with a 60% reservation target for women garment workers and returnee migrant artisans.
- Fiscal Incentives: 100% reimbursement of stamp duty, ₹2 per unit power tariff subsidy, and 50% capital subsidy on plant and machinery under Bihar Textile & Leather Policy.`,
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
    tags: ['Bihar Special', 'Gaya', 'Textile Policy', 'AKIC', 'Industrial Corridor', 'BPSC_GS2'],
    prelimsPointers: [
      'Amritsar-Kolkata Industrial Corridor (AKIC) is structured around the Eastern Dedicated Freight Corridor (EDFC), traversing 7 states including Bihar.',
      'Bihar Textile and Leather Policy 2022 provides extensive capital subsidies and employment generation incentives for labor-intensive industries.',
      'Gaya is home to the traditional Manpur textile weaving cluster, known as the "Manchester of Bihar".'
    ],
    mainsQuestions: [
      'Examine the potential of labor-intensive manufacturing sectors like textiles and leather in tackling structural underemployment in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-06T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_06_03',
    date: '2026-08-06',
    title: 'LiveMint Editorial: Transforming Cooperative Federalism — How States Can Co-Anchor India’s High-Growth Trajectory',
    summary: 'A macroeconomic assessment of state-level capital expenditure (capex), examining how interest-free 50-year loans from the Center have catalyzed asset creation while cautioning against growing off-budget state liabilities.',
    content: `Achieving India's $30 trillion economic ambition by 2047 is impossible through Union fiscal policy alone; states account for approximately 60% of total public capital expenditure and administer critical sectors like power, land, and urban infrastructure.

Key Editorial Points:
- Special Assistance for Capital Investment: The Center's 50-year interest-free loan scheme has successfully nudged states into boosting productive infrastructure spending over unproductive revenue subsidies.
- Quality of Sub-National Expenditure: States with strong capex multipliers (such as investments in industrial parks and digital land records) achieve higher private corporate investment inflows.
- Off-Budget Guarantees Warning: CAG reports highlight that state government guarantees extended to loss-making state-owned enterprises (SOEs) pose hidden contingent liability risks to sub-national debt sustainability.`,
    category: 'Economy & Governance',
    source: 'LiveMint - Economy & Policy Desk',
    sourceUrl: 'https://www.livemint.com/economy',
    sourceProvenance: {
      sourceId: 'src_livemint',
      sourceName: 'LiveMint Editorial Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'livemint'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['Cooperative Federalism', 'State Capex', 'Fiscal Deficit', 'Off-Budget Borrowings', 'CAG', 'GS-3'],
    prelimsPointers: [
      'Article 293 of the Constitution governs borrowing by States, requiring Central Government consent if a state has outstanding central loans.',
      'The Scheme for Special Assistance to States for Capital Investment provides 50-year interest-free loans tied to specific governance reforms.',
      'Comptroller and Auditor General of India (CAG) audits accounts of Union and States under Article 148-151.'
    ],
    mainsQuestions: [
      'Critically analyze the fiscal federalism dynamics in India. How can the Center and States work together to sustain high public capital expenditure while maintaining fiscal prudence? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_cooperative_federalism_2026',
    topicClusterTitle: 'Cooperative Federalism, Inter-State Relations & Institutional Governance',
    publishedAt: '2026-08-06T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_06_04',
    date: '2026-08-06',
    title: 'Supreme Court 5-Judge Constitution Bench: Delivers Judgment on Money Bills Criteria under Article 110',
    summary: 'A 5-judge Constitution Bench defines the constitutional limits of categorizing legislative enactments as Money Bills, holding that non-financial administrative amendments cannot be passed by bypassing the Rajya Sabha.',
    content: `The Supreme Court of India has delivered a landmark ruling clarifying the interpretation of Article 110 of the Constitution concerning the definition and certification of Money Bills.

Judicial Holdings:
1. Strict Constitutional Definition: Article 110(1) uses the word "only" to delineate matters relating to taxation, borrowing, and the Consolidated Fund of India; legislation containing substantive criminal or regulatory provisions cannot be certified as a Money Bill.
2. Scope of Judicial Review: The Speaker's certification under Article 110(3) is final regarding parliamentary procedure, but is subject to judicial review if it violates constitutional boundaries or constitutes a colorable exercise of power.
3. Bicameral Principle: The Rajya Sabha represents the federal character of the Indian Union; bypassing it through improper Money Bill certification impairs the Basic Structure of bicameral federal democracy.`,
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
    conceptId: 'c_preamble',
    tags: ['Article 110', 'Money Bill', 'Rajya Sabha', 'Supreme Court', 'Bicameralism', 'GS-2'],
    prelimsPointers: [
      'Article 110 defines a Money Bill; Article 109 lays down the special procedure in respect of Money Bills.',
      'A Money Bill cannot be introduced in the Rajya Sabha and requires prior recommendation of the President.',
      'The Rajya Sabha can only withhold a Money Bill for a maximum of 14 days, after which it is deemed passed by both Houses.'
    ],
    mainsQuestions: [
      'Discuss the constitutional significance of Rajya Sabha in India’s parliamentary democracy. How has the Supreme Court addressed controversies regarding Money Bill certifications? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-06T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_06_05',
    date: '2026-08-06',
    title: 'Ministry of Environment Reports 15% Growth in Tiger Populations in Western Ghats & Central Landscapes',
    summary: 'The National Tiger Conservation Authority (NTCA) and Wildlife Institute of India (WII) release the quadrennial tiger status assessment report, highlighting successful anti-poaching corridors and camera trap census coverage.',
    content: `The National Tiger Conservation Authority (NTCA), Ministry of Environment, Forest and Climate Change, has released the comprehensive tiger census results documenting steady population recovery.

Report Highlights:
- Population Recovery: India's wild tiger population has crossed 3,680 individuals, accounting for over 75% of the global wild tiger population.
- Core Corridors: High density observed in the Central Indian landscape (Kanha, Bandhavgarh, Tadoba) and the Shivalik-Gangetic floodplains (Corbett, Dudhwa, Valmiki).
- Human-Wildlife Coexistence: Proposes expanding Community Reserves and Eco-Development Committees around buffer zones to mitigate human-carnivore conflict.`,
    category: 'Environment & Wildlife Conservation',
    source: 'Press Information Bureau (PIB) - Ministry of Environment',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080605',
    sourceProvenance: {
      sourceId: 'src_pib_moefcc',
      sourceName: 'Ministry of Environment, Forest & Climate Change',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Tiger Census', 'NTCA', 'Project Tiger', 'Wildlife Conservation', 'Valmiki TR', 'GS-3'],
    prelimsPointers: [
      'Project Tiger was launched on April 1, 1973 at Corbett National Park.',
      'National Tiger Conservation Authority (NTCA) was constituted under the Wildlife (Protection) Act, 1972, as amended in 2006.',
      'Valmiki Tiger Reserve in West Champaran district is the only tiger reserve in the state of Bihar.'
    ],
    mainsQuestions: [
      'Evaluate the success of Project Tiger over the past five decades. What ecological and human-wildlife conflict challenges threaten source tiger populations in India? (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_wildlife_biodiversity_2026',
    topicClusterTitle: 'Wildlife Conservation, Tiger Reserves & Ecosystem Protection',
    publishedAt: '2026-08-06T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_06_06',
    date: '2026-08-06',
    title: 'Bihar Science & Technology Department Establishes Centre of Excellence for AI & Drone Systems at MIT Muzaffarpur',
    summary: 'The Bihar Government partners with IIT Patna and industry leaders to set up a ₹45 crore advanced laboratory at Muzaffarpur Institute of Technology for agricultural drone testing and disaster mapping.',
    content: `The Bihar Department of Science, Technology and Technical Education has sanctioned the establishment of a Centre of Excellence (CoE) for Artificial Intelligence and Autonomous Drone Systems at MIT Muzaffarpur.

Strategic Objectives:
- Precision Agriculture: Developing indigenous drone sensor payloads for crop nutrient deficiency diagnosis, localized nano-urea spraying, and flood damage assessment in North Bihar.
- Disaster Management: Equipping State Disaster Response Force (SDRF) with thermal drone fleets for nighttime flood rescue and levee breach monitoring along the Gandak and Bagmati rivers.
- Technical Incubation: Incubating 30 student-led deep-tech robotics startups with seed funding of up to ₹25 lakh per venture under the Bihar Startup Policy.`,
    category: 'Bihar Special',
    source: 'Department of Science, Technology & Technical Education - Government of Bihar',
    sourceUrl: 'https://dst.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_dst',
      sourceName: 'Bihar Science & Tech Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'MIT Muzaffarpur', 'Drone Tech', 'IIT Patna', 'Startup Policy', 'BPSC_GS2'],
    prelimsPointers: [
      'Muzaffarpur Institute of Technology (MIT) was established in 1954, making it one of the oldest technical institutes in Bihar.',
      'The Drone Rules 2021 liberalized the regulatory regime for civil drone operations in India under the Ministry of Civil Aviation.',
      'Bihar Startup Policy 2022 provides seed grants of up to ₹10 lakh as an interest-free loan for 10 years to registered startups.'
    ],
    mainsQuestions: [
      'Discuss how emerging technologies such as Artificial Intelligence and unmanned aerial vehicles (drones) can enhance disaster preparedness and agricultural governance in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_education_2026',
    topicClusterTitle: 'Bihar Education Reforms, Higher Technical Institutes & Innovation',
    publishedAt: '2026-08-06T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_06_07',
    date: '2026-08-06',
    title: 'Drishti News Analysis: Samudrayaan Matsya 6000 Submersible Mission and India’s Deep Ocean Capabilities',
    summary: 'A detailed exploration of the National Institute of Ocean Technology (NIOT) deep-sea crewed submersible Matsya 6000, titanium hull engineering, and deep benthic marine exploration at 6,000 meters depth.',
    content: `Under the Ministry of Earth Sciences’ flagship Deep Ocean Mission, India is preparing for the wet-trials of 'Matsya 6000'—an indigenous crewed deep-sea submersible engineered to carry 3 scientists to depths of 6,000 meters in the Indian Ocean.

Mission Highlights:
1. Deep Ocean Engineering: The submersible features a 2.1-meter diameter titanium alloy human sphere developed in collaboration with ISRO and L&T, engineered to withstand crushing hydrostatic pressures of 600 bar.
2. Scientific Objectives: In-situ exploration of hydrothermal vent ecosystems, chemosynthetic microbial biodiversity, gas hydrates, and polymetallic nodule beds.
3. Elite Group: Successful operationalization will make India only the sixth nation in the world (after the US, Russia, France, Japan, and China) with crewed deep-sea submersibles capable of descending beyond 5,000 meters.`,
    category: 'Science & Technology',
    source: 'Drishti IAS (Supplementary Analysis)',
    sourceUrl: 'https://www.drishtiias.com/daily-updates/daily-news-analysis/samudrayaan-matsya-6000-deep-ocean-mission',
    sourceProvenance: {
      sourceId: 'src_drishti',
      sourceName: 'Drishti IAS News Analysis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'drishti'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Samudrayaan', 'Matsya 6000', 'Deep Ocean Mission', 'NIOT', 'MoES', 'GS-3'],
    prelimsPointers: [
      'Samudrayaan is India’s first crewed ocean mission, developed under the Deep Ocean Mission of the Ministry of Earth Sciences (MoES).',
      'National Institute of Ocean Technology (NIOT) is an autonomous society under MoES located in Chennai, Tamil Nadu.',
      'Hydrothermal vents are fissures on the seabed that discharge geothermally heated water, supporting chemosynthetic life without sunlight.'
    ],
    mainsQuestions: [
      'Examine the strategic, scientific, and resource-exploration significance of India’s Deep Ocean Mission and the Samudrayaan project. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_marine_ecology_2026',
    topicClusterTitle: 'Marine Biodiversity, Ocean Governance & Deep Sea Mining',
    publishedAt: '2026-08-06T11:00:00.000Z'
  },

  // =========================================================================
  // AUGUST 05, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_05_01',
    date: '2026-08-05',
    title: '16th Finance Commission Finalizes State Consultations on Vertical & Horizontal Tax Devolution Principles',
    summary: 'The 16th Finance Commission headed by Dr. Arvind Panagariya wraps up regional stakeholder interactions, deliberating on population census weighting, disaster management fund allocations, and fiscal performance incentives.',
    content: `The 16th Finance Commission has concluded its wide-ranging consultative hearings with state finance ministers and local body representatives to formulate its award report for the five-year period 2026-27 to 2030-31.

Core Areas of Deliberation:
1. Vertical Devolution Share: States advocate maintaining or raising the net divisible pool share above the current 41%, citing the proliferation of non-shareable cesses and surcharges levied by the Union Government.
2. Horizontal Allocation Criteria: Balancing equity (Income Distance, Area, Forest Cover) against efficiency (Tax Effort, Demographic Performance using 2011 Census figures).
3. Local Body Grants & Disaster Relief: Recommending tied vs untied funding splits for rural Panchayati Raj Institutions (PRIs) and Urban Local Bodies (ULBs) for solid waste and water management.`,
    category: 'Economy & Federalism',
    source: 'Press Information Bureau (PIB) - Ministry of Finance',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080501',
    sourceProvenance: {
      sourceId: 'src_pib_fin',
      sourceName: 'Ministry of Finance / Finance Commission',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['16th Finance Commission', 'Tax Devolution', 'Divisible Pool', 'Article 280', 'Fiscal Federalism', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'The Finance Commission is a quasi-judicial body constituted every five years by the President under Article 280 of the Constitution.',
      'The 16th Finance Commission is chaired by Dr. Arvind Panagariya (former Vice Chairman of NITI Aayog).',
      'The 15th Finance Commission had recommended a 41% share of central taxes to states, with 1% adjusted for the newly formed Union Territories of Jammu & Kashmir and Ladakh.'
    ],
    mainsQuestions: [
      'Examine the terms of reference and major contentious issues before the 16th Finance Commission regarding vertical and horizontal tax devolution. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_fiscal_federalism_2026',
    topicClusterTitle: 'Fiscal Federalism, Finance Commission & Sub-National Debt',
    publishedAt: '2026-08-05T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_05_02',
    date: '2026-08-05',
    title: 'Bihar Disaster Management Department Formulates State Disaster Risk Management Plan 2026-31',
    summary: 'The Bihar Government in collaboration with NDMA and UNDP releases a 5-year disaster mitigation blueprint focusing on North Bihar flash floods, real-time lightning alert networks, and urban heatwave action plans.',
    content: `The Bihar Department of Disaster Management has published the comprehensive Bihar State Disaster Risk Management Plan (SDRMP 2026–31) aligned with the Sendai Framework for Disaster Risk Reduction.

Strategic Interventions:
- Flash Flood Mitigation: Establishing 200 automated river level sensors across trans-boundary rivers (Kosi, Gandak, Bagmati, Kamla Balan, Mahananda) with 36-hour early warning models.
- Lightning Warning System (Indravajra): Scaling the Doppler-radar linked 'Indravajra' mobile application to deliver sirens and SMS alerts 40 minutes prior to cloud-to-ground strikes in rural fields.
- Climate-Proof Infrastructure: Upgrading school buildings and Panchayat Bhawans into cyclone- and flood-resistant multi-purpose community relief shelters.`,
    category: 'Bihar Special',
    source: 'Disaster Management Department - Government of Bihar',
    sourceUrl: 'https://disastermgmt.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_disaster',
      sourceName: 'Bihar Disaster Management Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Disaster Management', 'Indravajra', 'Sendai Framework', 'Floods', 'BPSC_GS2'],
    prelimsPointers: [
      'The Disaster Management Act, 2005 establishes the NDMA (chaired by Prime Minister), SDMA (chaired by Chief Minister), and DDMA (chaired by District Collector).',
      'The Sendai Framework for Disaster Risk Reduction (2015-2030) was adopted at the Third UN World Conference in Sendai, Japan.',
      'Bihar is among India’s most multi-hazard prone states, with 73% of North Bihar geographically susceptible to recurrent seasonal floods.'
    ],
    mainsQuestions: [
      'Evaluate the disaster vulnerability profile of Bihar. How does the State Disaster Risk Management Plan integrate structural and non-structural mitigation measures? (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_disaster_2026',
    topicClusterTitle: 'Bihar Disaster Management, Flood Mitigation & Climate Adaptation',
    publishedAt: '2026-08-05T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_05_03',
    date: '2026-08-05',
    title: 'The Hindu Editorial: The 16th Finance Commission — Balancing Equity and Efficiency in Union-State Tax Sharing',
    summary: 'An editorial analysis examining the shrinking divisible pool due to non-sharable cesses, the debate over 2011 census demographic weighting, and the necessity of conditional capital grants for urban development.',
    content: `The task before the 16th Finance Commission is fraught with unprecedented structural tensions in India's fiscal architecture. While the Union Government has expanded its footprint through centrally sponsored schemes, the effective tax devolution to states as a percentage of gross central revenue has declined due to the extensive reliance on cesses and surcharges.

Editorial Arguments:
- Divisible Pool Erosion: Cesses and surcharges now constitute over 15% of the Center's gross tax revenues, excluding these sums from the constitutional revenue-sharing pool under Article 270.
- North-South Fiscal Tensions: Southern states with replacement-level total fertility rates (TFR) argue that excessive reliance on the 2011 population census penalizes successful population stabilization policies.
- Equalization vs Performance: The Commission must formulate an equitable formula that supports lagging northern and eastern states (such as Bihar and Uttar Pradesh) while rewarding fiscal performance and green energy adoption.`,
    category: 'Economy & Federalism',
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
    tags: ['16th Finance Commission', 'Cesses and Surcharges', 'Divisible Pool', 'Article 270', 'Fiscal Equity', 'GS-2'],
    prelimsPointers: [
      'The 80th Constitutional Amendment Act, 2000 introduced the concept of an alternative scheme of devolution, sharing all central taxes with states except cesses and surcharges (Article 270).',
      'Article 271 allows Parliament to levy surcharges on certain taxes for Union purposes, the proceeds of which form part of the Consolidated Fund of India and are not shareable.',
      'Cess is a tax earmarked for a specific designated purpose (e.g., Road and Infrastructure Cess, Health and Education Cess).'
    ],
    mainsQuestions: [
      'The proliferation of cesses and surcharges has undermined the spirit of cooperative fiscal federalism. Critically analyze in the context of the 16th Finance Commission. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_fiscal_federalism_2026',
    topicClusterTitle: 'Fiscal Federalism, Finance Commission & Sub-National Debt',
    publishedAt: '2026-08-05T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_05_04',
    date: '2026-08-05',
    title: 'Supreme Court Clarifies Bail Jurisprudence: "Bail is the Rule, Jail is the Exception" Applies Under Special Acts',
    summary: 'A bench of the Supreme Court reiterates that constitutional guarantees under Article 21 override statutory bail restrictions under PMLA and UAPA when trials are unduly delayed without fault of the accused.',
    content: `The Supreme Court of India has reaffirmed the foundational principle of Indian criminal jurisprudence that "bail is the rule, jail is the exception", underscoring that statutory stringency cannot nullify personal liberty under Article 21.

Judicial Directives:
1. Constitutional Primacy: While special statutes (like UAPA, NDPS, and PMLA) contain twin-conditions restricting bail, these cannot be interpreted to justify indefinite pre-trial incarceration.
2. Speedy Trial Right: Right to a speedy trial is a fundamental right implicit in Article 21; where the prosecution cites hundreds of witnesses with little likelihood of trial completion in a reasonable timeframe, constitutional courts must grant bail.
3. Subordinate Judiciary Directive: Trial courts and High Courts must not act timidly in granting regular bail in eligible cases to prevent the overcrowding of prisons with undertrial prisoners.`,
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
    tags: ['Article 21', 'Bail Jurisprudence', 'PMLA', 'UAPA', 'Supreme Court', 'Fundamental Rights', 'GS-2'],
    prelimsPointers: [
      'In State of Rajasthan v. Balchand (1977), Justice V.R. Krishna Iyer established the doctrine: "Bail is the rule and jail is the exception".',
      'Over 75% of prison inmates in India are undertrial prisoners according to the National Crime Records Bureau (NCRB) Prison Statistics India report.',
      'Section 436A of the CrPC / Section 479 of BNSS provides for the release of undertrial prisoners who have served half the maximum period of imprisonment.'
    ],
    mainsQuestions: [
      '"Bail is the rule and jail is the exception." Discuss the evolution of this judicial doctrine and examine how statutory restrictions in special laws impact personal liberty under Article 21. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-05T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_05_05',
    date: '2026-08-05',
    title: 'Ministry of Rural Development Reports 98% Geotagging Milestone under PMGSY-IV for All-Weather Roads',
    summary: 'The Ministry of Rural Development achieves GIS-based verification and drone quality audits for over 7.5 lakh km of rural road assets constructed under the Pradhan Mantri Gram Sadak Yojana (PMGSY).',
    content: `The Ministry of Rural Development has achieved a milestone with the complete geospatial asset mapping of rural connectivity infrastructure under the Pradhan Mantri Gram Sadak Yojana (PMGSY).

Key Program Deliverables:
- All-Weather Connectivity: Connected over 1.7 lakh eligible habitations with surfaced black-top roads, boosting rural agricultural market access and school attendance.
- Green & Cold Mix Technologies: Over 1.2 lakh km paved using recycled plastics, fly ash, cold mix bio-bitumen, and jute geogrid stabilization, cutting carbon footprints by 30%.
- Real-Time Quality Tracking: Citizen feedback and grievance redressal integrated via the 'Meri Sadak' mobile app with geo-tagged photographic evidence.`,
    category: 'Rural Development & Infrastructure',
    source: 'Press Information Bureau (PIB) - Ministry of Rural Development',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026080505',
    sourceProvenance: {
      sourceId: 'src_pib_mord',
      sourceName: 'Ministry of Rural Development',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['PMGSY', 'Rural Infrastructure', 'Meri Sadak', 'Geotagging', 'Green Roads', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Pradhan Mantri Gram Sadak Yojana (PMGSY) was launched on December 25, 2000 as a 100% Centrally Sponsored Scheme (now funded 60:40 with states).',
      'The National Rural Infrastructure Development Agency (NRIDA) provides technical and operational support to the Ministry of Rural Development for PMGSY.',
      'PMGSY-III focuses on consolidation of 1,25,000 km of existing through routes and major rural links connecting habitations to Gramin Agricultural Markets (GrAMs).'
    ],
    mainsQuestions: [
      'Analyze the socio-economic impacts of all-weather rural road connectivity under PMGSY on agrarian income diversification and rural health outcomes. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_rural_development_2026',
    topicClusterTitle: 'Rural Infrastructure, Agrarian Economy & Local Governance',
    publishedAt: '2026-08-05T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_05_06',
    date: '2026-08-05',
    title: 'Bihar Agriculture Department Promotes Organic Farming Corridors Along River Ganga under Agri Road Map IV',
    summary: 'The Bihar Government expands the dedicated Organic Corridor (Jaivik Corridor) along both banks of the River Ganga across 13 districts, providing ₹11,500 per acre organic input subsidies and direct C-DAP certification.',
    content: `The Bihar Department of Agriculture has expanded the Ganga Organic Farming Corridor under the Fourth Agriculture Road Map (2023–2028).

Program Features:
- Geographical Scope: Encompasses agricultural lands within 5 km of both banks of the River Ganga across 13 districts (including Patna, Buxar, Bhojpur, Vaishali, Samastipur, Begusarai, Munger, and Bhagalpur).
- Organic Certification & Inputs: Direct DBT incentive of ₹11,500 per acre provided in the first year for vermicompost units, bio-pesticides, and green manuring, with free certification by BSSOCA.
- Clean Ganga Co-Benefits: Eliminates synthetic chemical and pesticide runoff into the sacred river ecosystem, complementing National Mission for Clean Ganga (NMCG) Namami Gange goals.`,
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
    tags: ['Bihar Special', 'Jaivik Corridor', 'Organic Farming', 'River Ganga', 'Agri Road Map', 'BPSC_GS2'],
    prelimsPointers: [
      'The Organic Corridor in Bihar covers 13 districts along the banks of the River Ganga.',
      'Bihar’s Fourth Agriculture Road Map (2023-2028) emphasizes organic farming, climate-resilient agriculture, and value addition.',
      'Paramparagat Krishi Vikas Yojana (PKVY) is a sub-component of National Mission on Sustainable Agriculture (NMSA) promoting organic farming via cluster approach.'
    ],
    mainsQuestions: [
      'Discuss the environmental and economic significance of the Organic Farming Corridor along River Ganga in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-05T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_05_07',
    date: '2026-08-05',
    title: 'Indian Express Explained: Carbon Border Adjustment Mechanism (CBAM) and Impact on Indian Steel & Aluminium Exports',
    summary: 'An analytical explainer on the European Union’s carbon border levy on energy-intensive imports, embedded emissions accounting, and India’s strategic response at the World Trade Organization (WTO).',
    content: `The European Union’s Carbon Border Adjustment Mechanism (CBAM) enters into full enforcement, imposing a carbon import tax on steel, aluminum, cement, fertilizer, and electricity to prevent 'carbon leakage' to jurisdictions with laxer emission standards.

Key Dimensions:
1. Mechanism: Importers into the EU must purchase CBAM certificates corresponding to the carbon price that would have been paid had the goods been produced under the EU Emissions Trading System (EU ETS).
2. Impact on Indian Manufacturing: With approximately 27% of India's steel and aluminum exports destined for the EU, CBAM threatens an additional tariff burden of 20-35%, eroding price competitiveness.
3. Policy Counter-Measures: India has challenged CBAM at the WTO Committee on Trade and Environment as a disguised protectionist non-tariff barrier violating the principle of Common But Differentiated Responsibilities (CBDR), while accelerating the domestic Carbon Credit Trading Scheme (CCTS).`,
    category: 'Economy & International Trade',
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
    conceptId: 'c_fiscal_fed',
    tags: ['CBAM', 'Carbon Tax', 'EU ETS', 'WTO', 'Steel Exports', 'Climate Trade', 'GS-3'],
    prelimsPointers: [
      'The EU Carbon Border Adjustment Mechanism (CBAM) applies initially to six carbon-intensive sectors: Cement, Iron & Steel, Aluminium, Fertilizers, Electricity, and Hydrogen.',
      'Bureau of Energy Efficiency (BEE) under the Ministry of Power is the administrator of India’s Carbon Credit Trading Scheme (CCTS).',
      'The Energy Conservation (Amendment) Act, 2022 empowered the Central Government to establish a domestic carbon credit trading market in India.'
    ],
    mainsQuestions: [
      'Critically analyze the European Union’s Carbon Border Adjustment Mechanism (CBAM). How does it challenge principles of multilateral climate agreements, and what strategic measures should India take? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_green_hydrogen_2026',
    topicClusterTitle: 'Green Hydrogen Mission & Industrial Decarbonization',
    publishedAt: '2026-08-05T06:00:00.000Z'
  }
];
