import fs from 'fs';
import path from 'path';
import { OFFICIAL_CURRENT_AFFAIRS } from '../server/db/seedCurrentAffairs.js';

// Historical articles from 2026-08-05 to 2026-08-14
const historicalDays: any[] = [
  // =========================================================================
  // 2026-08-14 (8 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_14_01',
    date: '2026-08-14',
    title: 'Union Cabinet Clears National Critical Minerals Mission with ₹16,000 Crore Outlay for Lithium, Cobalt & Rare Earths',
    summary: 'The Cabinet Committee on Economic Affairs (CCEA) approves the National Critical Minerals Mission (NCMM) to fast-track deep-seated mineral exploration, offshore mining blocks, and overseas asset acquisition via KABIL.',
    content: `The Union Cabinet chaired by the Prime Minister has approved the National Critical Minerals Mission (NCMM) with a financial outlay of ₹16,000 crore to secure supply chains for the clean energy transition, aerospace, defense, and electric mobility sectors.

Key Pillars of the Mission:
1. Deep-Seated Mineral Exploration: Geological Survey of India (GSI) and MECL to carry out high-resolution aero-geophysical mapping for 24 identified critical minerals including Lithium, Cobalt, Nickel, and Rare Earth Elements (REE).
2. Domestic Processing & Smelting Hubs: 50% capital subsidy for establishing commercial-scale processing plants for battery-grade lithium carbonate and neodymium-iron-boron (NdFeB) permanent magnets.
3. International Asset Acquisition: Khanij Bidesh India Limited (KABIL) to acquire operational equity in lithium brine deposits across the 'Lithium Triangle' (Argentina, Chile, Bolivia) and cobalt mines in Australia.`,
    category: 'Economy & Energy',
    source: 'Press Information Bureau (PIB) - Ministry of Mines',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081401',
    sourceProvenance: {
      sourceId: 'src_pib_mines',
      sourceName: 'Ministry of Mines',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Critical Minerals', 'Lithium', 'KABIL', 'Ministry of Mines', 'Rare Earths', 'GS-3'],
    prelimsPointers: [
      'Mines and Minerals (Development and Regulation) Amendment Act, 2023 empowered the Central Government to auction 24 critical and strategic minerals.',
      'Khanij Bidesh India Limited (KABIL) is a joint venture of NALCO, HCL, and MECL formed in 2019 to acquire overseas mineral assets.',
      'The Lithium Triangle comprises Chile, Bolivia, and Argentina, holding over 50% of the world’s identified lithium reserves.'
    ],
    mainsQuestions: [
      'Examine the strategic vulnerabilities in India’s critical mineral supply chains. How does the National Critical Minerals Mission address these challenges? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_critical_minerals_2026',
    topicClusterTitle: 'Critical Minerals Sovereignty & Clean Energy Supply Chains',
    publishedAt: '2026-08-14T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_14_02',
    date: '2026-08-14',
    title: 'Bihar Industries Department Sanctions 4 Mega Agro-Food Processing Parks in Buxar, Begusarai, Samastipur & Purnea',
    summary: 'The Bihar Department of Industries approves ₹450 crore for integrated agro-processing clusters with cold storage chains, testing laboratories, and export logistics hubs for Maize, Makhana, Banana, and Mango.',
    content: `The Bihar State Government has sanctioned the creation of four dedicated Agro-Food Processing Mega Parks across Buxar, Begusarai, Samastipur, and Purnea under the Bihar Industrial Investment Promotion Policy 2026.

Strategic Features:
- Plug-and-Play Infrastructure: Pre-cleared industrial land parcels equipped with continuous power, effluent treatment plants (ETP), and nitrogen-chilled cold storage.
- Crop Specialization: Buxar (Cereals & Pulses), Begusarai (Maize & Poultry Feed), Samastipur (Banana & Litchi), and Purnea (Makhana & Jute Derivatives).
- Farmer Linkages: Direct procurement contracts registered with 120 local Farmer Producer Organisations (FPOs), eliminating intermediary price discounts.`,
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
    tags: ['Bihar Special', 'Agro Processing', 'BIADA', 'Buxar', 'Purnea', 'BPSC_GS2'],
    prelimsPointers: [
      'Bihar is the third largest producer of vegetables and fourth largest producer of fruits in India.',
      'Bihar ranks among the top producers of maize in India, with high productivity in the Kosi and Seemanchal regions.',
      'BIADA (Bihar Industrial Area Development Authority) is the statutory authority managing industrial infrastructure in Bihar.'
    ],
    mainsQuestions: [
      'Assess the scope and structural bottlenecks of agro-based industrialization in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-14T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_14_03',
    date: '2026-08-14',
    title: 'The Hindu Editorial: Mineral Security Partnerships and India’s Geopolitical Clean Tech Strategy',
    summary: 'An editorial analysis examining India’s engagement with the US-led Minerals Security Partnership (MSP) and the imperative to diversify critical supply chains away from single-country monopolistic processing.',
    content: `The global transition from fossil fuels to clean energy replaces fuel dependency with mineral dependency. Solar panels, wind turbines, and electric vehicle batteries require exponentially higher quantities of copper, nickel, cobalt, and rare earths compared to conventional thermal systems.

Key Editorial Points:
- Processing Monopoly: China refines approximately 60% of the world’s lithium, 70% of cobalt, and 90% of rare earth elements, creating single-point failure risks for global clean tech manufacturing.
- Multilateral Alignments: India’s induction into the Minerals Security Partnership (MSP) provides diplomatic access to joint financing for overseas mining and refining projects with 14 partner nations.
- Domestic Policy Imperatives: India must simultaneously build domestic scrap recycling ecosystems and fast-track deep-sea mining exploration under the Samudrayaan project.`,
    category: 'International Relations',
    source: 'The Hindu - Lead Editorial',
    sourceUrl: 'https://www.thehindu.com/opinion/editorial',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Editorial Page',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Minerals Security Partnership', 'MSP', 'China', 'Geopolitics', 'Clean Energy', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'Minerals Security Partnership (MSP) was established in 2022 by the US and partner nations; India joined as the 14th member in 2023.',
      'Rare Earth Elements (REE) comprise 17 chemical elements (15 lanthanides plus scandium and yttrium).',
      'The International Energy Agency (IEA) projects clean energy mineral demand to quadruple by 2040 under Paris Agreement targets.'
    ],
    mainsQuestions: [
      'In the emerging clean energy architecture, critical minerals are the new geopolitical battleground. Discuss with reference to India’s strategic mineral diplomacy. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_critical_minerals_2026',
    topicClusterTitle: 'Critical Minerals Sovereignty & Clean Energy Supply Chains',
    publishedAt: '2026-08-14T05:30:00.000Z'
  },
  {
    id: 'ca_2026_08_14_04',
    date: '2026-08-14',
    title: 'Supreme Court Clarifies Scope of Article 300A: Right to Property is a Human Right Requiring Fair Procedure',
    summary: 'A 3-judge bench of the Supreme Court rules that compulsory state land acquisition without strict compliance with statutory procedural steps and rehabilitation safeguards violates constitutional guarantees under Article 300A.',
    content: `The Supreme Court of India has reiterated that the right to property, though no longer a Fundamental Right following the 44th Constitutional Amendment, remains an inalienable constitutional and human right protected under Article 300A.

Judicial Directives:
1. Procedural Due Process: Deprivation of property by the state must follow valid legislative authority, public purpose justification, and transparent social impact assessments.
2. Fair Compensation & Rehabilitation: The Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act (LARR) 2013 mandates statutory rehabilitation before dispossessing landowners.
3. Adverse Possession by State: The state cannot claim ownership of private citizens’ land through adverse possession, as the sovereign cannot act as a trespasser.`,
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
    tags: ['Article 300A', 'Right to Property', 'LARR Act 2013', 'Supreme Court', 'Constitutional Law', 'GS-2'],
    prelimsPointers: [
      'The 44th Constitutional Amendment Act, 1978 deleted Right to Property from the list of Fundamental Rights (Article 19(1)(f) and Article 31) and inserted Article 300A in Part XII.',
      'Article 300A states: "No person shall be deprived of his property save by authority of law."',
      'LARR Act 2013 requires consent of 70% of affected families for PPP projects and 80% for private projects.'
    ],
    mainsQuestions: [
      'Trace the evolution of the Right to Property in the Indian Constitution from a Fundamental Right to a Human Right under Article 300A. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-14T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_14_05',
    date: '2026-08-14',
    title: 'RBI Monetary Policy Committee Keeps Repo Rate at 6.5%, Introduces Frictionless Credit Platform for MSMEs',
    summary: 'The Reserve Bank of India MPC maintains status quo on the policy repo rate at 6.5% while fully transitioning the Public Tech Platform for Frictionless Credit (PTPFC) to an open architecture for priority sector loans.',
    content: `The Reserve Bank of India Monetary Policy Committee (MPC) decided by a 4:2 majority to keep the policy repo rate unchanged at 6.50% while remaining focused on the withdrawal of accommodation to align inflation with the 4% target.

Regulatory Initiatives:
- Frictionless Credit Platform: RBI’s subsidiary Reserve Bank Innovation Hub (RBIH) operationalizes plug-and-play APIs connecting digitized land records, satellite crop data, and GSTN invoices for instantaneous loan sanctioning to farmers and MSMEs.
- Inflation Projection: Headline CPI inflation projected at 4.5% for FY27, with food inflation volatility cited as the primary upside risk.
- Liquidity Management: Fine-tuning liquidity via Variable Rate Reverse Repo (VRRR) auctions to maintain overnight call rates aligned with the policy corridor.`,
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
    tags: ['RBI', 'Monetary Policy', 'Repo Rate', 'Inflation Targeting', 'PTPFC', 'GS-3'],
    prelimsPointers: [
      'The Monetary Policy Committee (MPC) is a 6-member statutory body constituted under Section 45ZB of the RBI Act, 1934.',
      'The flexible inflation targeting framework mandates the RBI to maintain CPI inflation at 4% with a tolerance band of +/- 2%.',
      'The RBI Governor serves as the ex-officio Chairperson of the MPC with a casting vote in case of a tie.'
    ],
    mainsQuestions: [
      'Evaluate the effectiveness of the Flexible Inflation Targeting (FIT) framework in managing supply-side food inflation shocks in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_macro_economy_2026',
    topicClusterTitle: 'Macroeconomic Stability & Monetary Governance',
    publishedAt: '2026-08-14T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_14_06',
    date: '2026-08-14',
    title: 'Bihar Tourism Department Inaugurates Mandar Hill Biodiversity and Ropeway Heritage Circuit in Banka',
    summary: 'The Bihar Government completes the eco-tourism revitalization of Mandar Parvat in Banka district, establishing pilgrim amenities, rock-cut sculpture conservation, and eco-sensitive trails around the mythical Samudra Manthan site.',
    content: `The Bihar Department of Tourism has dedicated the upgraded Mandar Hill Heritage and Eco-Tourism Circuit in Banka district to public pilgrimage.

Heritage Highlights:
- Mythological & Historical Convergence: Mandar Hill is traditionally associated with the churning of the cosmic ocean (Samudra Manthan) and holds sacred importance for Hindu, Jain, and Sufi traditions.
- Jain Heritage: Mandar is revered in Jainism as the nirvana place of the 12th Tirthankara, Lord Vasupujya.
- Environmental Conservation: 150-hectare biodiversity zone with medicinal plants, butterfly conservatory, and solar-powered aerial ropeway transport.`,
    category: 'Bihar Special',
    source: 'Department of Tourism - Government of Bihar',
    sourceUrl: 'https://tourism.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_tourism',
      sourceName: 'Bihar Tourism Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Mandar Hill', 'Banka', 'Jainism', 'Vasupujya', 'Eco Tourism', 'BPSC_GS1'],
    prelimsPointers: [
      'Mandar Hill is located in Banka district of Bihar, known for ancient rock-cut inscriptions dating from the Gupta period.',
      'Lord Vasupujya, the 12th Jain Tirthankara, attained Nirvana at Mandar Hill (Champapuri/Banka region).',
      'The hill features the ancient Madhusudan temple and the Papaharani water tank at its base.'
    ],
    mainsQuestions: [
      'Highlight the historical and cultural syncretism of religious sites in Bihar with special reference to Mandar Hill and Rajgir. (200 words, 38 Marks, BPSC GS-1)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_heritage_2026',
    topicClusterTitle: 'Bihar Cultural Heritage & Tourism Economy',
    publishedAt: '2026-08-14T10:30:00.000Z'
  },
  {
    id: 'ca_2026_08_14_07',
    date: '2026-08-14',
    title: 'Indian Express Explained: The Science and Economics of Carbon Capture, Utilisation and Storage (CCUS)',
    summary: 'An analytical explainer on point-source carbon capture technologies, post-combustion amine solvents, geological saline aquifer sequestration, and CO2 mineralization in heavy industrial manufacturing.',
    content: `To achieve Net Zero greenhouse gas emissions by 2070 while continuing industrial development, India is formulating policy frameworks to incentivize Carbon Capture, Utilisation, and Storage (CCUS) across hard-to-abate sectors like cement, steel, and thermal power.

Key Explanations:
1. Capture Pathways: Point-source capture via chemical absorption (monoethanolamine solvents), membrane separation, and oxy-fuel combustion in flue gas streams.
2. Utilisation Applications: Converting captured CO2 into green synthetic methanol, urea fertilizer feedstocks, and carbonated concrete building aggregates.
3. Sequestration Challenges: Long-term geological storage in deep saline aquifers and depleted oil/gas reservoirs requires strict seismic monitoring and legal liability frameworks under the Environment Protection Act.`,
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
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['CCUS', 'Carbon Capture', 'Net Zero 2070', 'Decarbonisation', 'Climate Tech', 'GS-3'],
    prelimsPointers: [
      'NITI Aayog published the national CCUS policy framework outlining a roadmap for capturing 750 MTPA of CO2 by 2050.',
      'Supercritical CO2 state occurs above 31.1°C and 73.9 bar pressure, behaving with liquid-like density and gas-like diffusivity.',
      'Enhanced Oil Recovery (EOR) involves injecting CO2 into mature oil fields to increase petroleum extraction efficiency.'
    ],
    mainsQuestions: [
      'Discuss the technical viability and policy incentives needed to scale Carbon Capture, Utilisation and Storage (CCUS) in India’s hard-to-abate industries. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_green_hydrogen_2026',
    topicClusterTitle: 'Green Hydrogen Mission & Industrial Decarbonization',
    publishedAt: '2026-08-14T06:00:00.000Z'
  },
  {
    id: 'ca_2026_08_14_08',
    date: '2026-08-14',
    title: 'ISRO & IN-SPACe Release Comprehensive Guidelines for Private Small Satellite Launch Vehicles (SSLVs)',
    summary: 'The Indian National Space Promotion and Authorization Centre (IN-SPACe) issues technical authorization norms for commercial space startups building modular micro-launchers and dedicated payload dispensers.',
    content: `IN-SPACe and the Department of Space have published operational safety and regulatory guidelines for non-governmental entities (NGEs) developing orbital rocket boosters and satellite platforms from Indian spaceports.

Policy Framework:
- Spaceport Access: Authorizes private launchers to utilize ISRO’s Small Satellite Launch Vehicle (SSLV) launch pad at Sriharikota and the upcoming Kulasekarapattinam spaceport in Tamil Nadu.
- Technology Transfer: Structured licensing for ISRO-developed solid rocket propellant formulations, carbon-composite motor casings, and inertial navigation systems.
- Third-Party Liability Insurance: Mandatory risk coverage framework aligning domestic launch authorizations with the UN Outer Space Treaty 1967.`,
    category: 'Science & Technology',
    source: 'Indian Space Research Organisation (ISRO)',
    sourceUrl: 'https://www.isro.gov.in/',
    sourceProvenance: {
      sourceId: 'src_isro',
      sourceName: 'ISRO / IN-SPACe Press Release',
      sourceType: 'GOVERNMENT',
      adapter: 'isro'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ISRO', 'IN-SPACe', 'SSLV', 'Private Space Sector', 'Kulasekarapattinam', 'GS-3'],
    prelimsPointers: [
      'IN-SPACe (Indian National Space Promotion and Authorization Centre) is an autonomous single-window agency under the Department of Space.',
      'Kulasekarapattinam spaceport in Tamil Nadu offers direct southward launch corridors over the Indian Ocean without dogleg maneuvers.',
      'Indian Space Policy 2023 opened all end-to-end space activities to non-governmental entities.'
    ],
    mainsQuestions: [
      'How does private sector commercialization in the space economy enhance India’s global launch market share and technological innovation? (150 words, 10 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_space_technology_2026',
    topicClusterTitle: 'Space Technology & Human Spaceflight',
    publishedAt: '2026-08-14T11:00:00.000Z'
  },

  // =========================================================================
  // 2026-08-13 (8 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_13_01',
    date: '2026-08-13',
    title: 'Ministry of Power Notifies National Smart Grid & Advanced Metering Infrastructure 2.0 under RDSS',
    summary: 'The Ministry of Power rolls out upgraded specifications for time-of-day smart electricity meters, distribution automation, and AI-enabled power theft detection under the Revamped Distribution Sector Scheme (RDSS).',
    content: `The Union Ministry of Power has notified the National Smart Grid & Advanced Metering Infrastructure 2.0 (AMI 2.0) guidelines under the ₹3.03 lakh crore Revamped Distribution Sector Scheme (RDSS).

Key Objectives:
1. Universal Smart Meter Deployment: Replacing 25 crore legacy electro-mechanical meters with prepayment-enabled cellular smart meters across all state DISCOMs.
2. Time-of-Day (ToD) Tariffs: Implementing dynamic differential pricing during solar daylight hours (20% tariff rebate) and peak evening hours (20% surcharge) to flatten the national load curve.
3. Aggregate Technical & Commercial (AT&C) Loss Reduction: Targeting national AT&C losses below 12% through feeder-level automated energy auditing.`,
    category: 'Economy & Energy',
    source: 'Press Information Bureau (PIB) - Ministry of Power',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081301',
    sourceProvenance: {
      sourceId: 'src_pib_power',
      sourceName: 'Ministry of Power',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['Smart Meters', 'RDSS', 'Power Sector Reforms', 'DISCOMs', 'ToD Tariff', 'GS-3'],
    prelimsPointers: [
      'The Revamped Distribution Sector Scheme (RDSS) is a reforms-based, results-linked scheme with an outlay of ₹3,03,758 crore.',
      'Time-of-Day (ToD) tariffs incentivize consumers to shift non-critical power loads to daytime solar generation windows.',
      'PFC (Power Finance Corporation) and REC Limited are the nodal implementing agencies for RDSS.'
    ],
    mainsQuestions: [
      'Examine how smart metering and Time-of-Day (ToD) pricing can address the structural financial distress of power distribution companies (DISCOMs) in India. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_clean_energy_grid_transition',
    topicClusterTitle: 'Clean Energy Transition, Battery Storage & Power Sector Reforms',
    publishedAt: '2026-08-13T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_13_02',
    date: '2026-08-13',
    title: 'Bihar Water Resources Department Completes Western Kosi Canal Modernisation Phase-III',
    summary: 'The Bihar Government completes the concrete lining and automated head regulator modernization of the Western Kosi Canal network, securing perennial irrigation for 1.65 lakh hectares in Madhubani and Darbhanga.',
    content: `The Bihar State Water Resources Department has announced the successful operational commissioning of Western Kosi Canal Modernisation Phase-III.

Project Outcomes:
- Conveyance Efficiency: Concrete side lining and desiltation of 120 km of primary and branch canals reduce transit seepage losses by 35%.
- Command Area Irrigation: Provides assured Kharif and Rabi irrigation water to over 1.65 lakh hectares across 14 blocks in Madhubani and 8 blocks in Darbhanga districts.
- Telemetric Gate Automation: Solar-powered SCADA telemetry deployed across 48 distributary sluice gates for computerized water release monitoring.`,
    category: 'Bihar Special',
    source: 'Information & Public Relations Department (IPRD) - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/prdbihar',
    sourceProvenance: {
      sourceId: 'src_bihar_wrd',
      sourceName: 'Bihar Water Resources Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Western Kosi Canal', 'Madhubani', 'Darbhanga', 'Irrigation', 'BPSC_GS2'],
    prelimsPointers: [
      'The Kosi Barrage is situated at Bhimnagar near the Indo-Nepal border, commissioned in 1963.',
      'The Western Kosi Canal system originates from the right bank of the Bhimnagar barrage and traverses Saptari district of Nepal before entering Bihar at Madhubani.',
      'Saat Nischay-2 includes the flagship target "Har Khet Tak Sinchai Ka Pani" (Irrigation water to every farm).'
    ],
    mainsQuestions: [
      'Evaluate the progress and challenges of canal irrigation infrastructure in North Bihar with reference to flood-drought resilience. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_water_infrastructure',
    topicClusterTitle: 'Bihar Water Resources, Flood Mitigation & Irrigation Architecture',
    publishedAt: '2026-08-13T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_13_03',
    date: '2026-08-13',
    title: 'The Indian Express Editorial: Re-energizing DISCOMs — The Missing Link in India’s 500 GW Clean Energy Ambition',
    summary: 'An editorial critique analyzing the persistent legacy debt and regulatory asset buildup in state electricity utilities, and why solar grid integration requires tariff rationalization and open access enforcement.',
    content: `While India’s renewable energy installed capacity has surpassed 200 GW on the road to the 500 GW non-fossil goal by 2030, the financial health of state distribution utilities (DISCOMs) remains the single biggest systemic risk to the power sector.

Key Editorial Points:
- Legacy Arrears: DISCOM dues to generation companies (GENCOs) have been reduced under the Late Payment Surcharge (LPS) Rules, but operational losses persist due to cross-subsidies and delayed state subsidy disbursements.
- Open Access Bottlenecks: State regulatory commissions impose prohibitive cross-subsidy surcharges (CSS) and wheeling charges, frustrating commercial and industrial (C&I) consumers from procuring direct green power.
- Urgent Solutions: True cost-reflective agricultural tariffs coupled with direct benefit transfers (DBT) for farm electricity and dedicated distribution franchise models in high-loss urban circles.`,
    category: 'Economy & Energy',
    source: 'The Indian Express - Editorial Page',
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
    tags: ['DISCOMs', 'Power Sector', 'Late Payment Surcharge', 'Renewable Energy', 'Open Access', 'GS-3'],
    prelimsPointers: [
      'Electricity is a Concurrent List subject (Entry 38 of List III in Seventh Schedule).',
      'The Electricity (Promoting Renewable Energy Through Green Energy Open Access) Rules, 2022 lowered the open access threshold from 1 MW to 100 kW.',
      'Central Electricity Regulatory Commission (CERC) is a statutory body under Section 76 of the Electricity Act, 2003.'
    ],
    mainsQuestions: [
      'Critically analyze the operational and structural bottlenecks in India’s power distribution sector. How do DISCOM losses threaten renewable energy investments? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_clean_energy_grid_transition',
    topicClusterTitle: 'Clean Energy Transition, Battery Storage & Power Sector Reforms',
    publishedAt: '2026-08-13T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_13_04',
    date: '2026-08-13',
    title: 'India-CARICOM Summit Concludes with 7 Action Pillars on Climate Resilience, Pharma & Digital Public Infrastructure',
    summary: 'The Prime Minister leads high-level summit with 14 Caribbean Community (CARICOM) leaders, signing memorandums on Unified Payments Interface (UPI) deployment, solar mini-grids, and generic medicine supply lines.',
    content: `The second in-person India-CARICOM Summit concluded with the adoption of the 'Georgetown Declaration' outlining seven strategic cooperation pillars between India and Caribbean island nations.

Summit Deliverables:
1. Climate Resilience & CDRI: Deployment of Coalition for Disaster Resilient Infrastructure (CDRI) technical teams to hurricane-vulnerable island states for storm-hardened port and power infrastructure.
2. Digital Public Infrastructure: Signing bilateral agreements with Guyana, Suriname, and Trinidad & Tobago for customized India Stack (UPI, DigiLocker, Aadhaar open-source protocols).
3. Healthcare & Jan Aushadhi: Establishing regional generic medicine procurement hubs to slash essential pharmaceutical import costs by 60%.`,
    category: 'International Relations',
    source: 'Ministry of External Affairs (MEA), Government of India',
    sourceUrl: 'https://mea.gov.in/press-releases.htm',
    sourceProvenance: {
      sourceId: 'src_mea',
      sourceName: 'Ministry of External Affairs',
      sourceType: 'GOVERNMENT',
      adapter: 'mea'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['CARICOM', 'MEA', 'Global South', 'UPI', 'CDRI', 'Climate Resilience', 'GS-2'],
    prelimsPointers: [
      'CARICOM (Caribbean Community) was established in 1973 by the Treaty of Chaguaramas, comprising 15 member states and 5 associate members.',
      'Coalition for Disaster Resilient Infrastructure (CDRI) is a global partnership launched by India at the 2019 UN Climate Action Summit in New York.',
      'Small Island Developing States (SIDS) are recognized by the UN as a distinct group facing disproportionate vulnerability to sea-level rise and extreme storms.'
    ],
    mainsQuestions: [
      'Examine the strategic and diplomatic significance of India’s growing engagement with the Global South, with particular reference to Small Island Developing States (SIDS). (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-13T09:30:00.000Z'
  },
  {
    id: 'ca_2026_08_13_05',
    date: '2026-08-13',
    title: 'Supreme Court Constitution Bench: Upholds Right to Privacy Protections in Algorithmic Profiling and Facial Recognition',
    summary: 'A 5-judge Constitution Bench rules that deployment of Automated Facial Recognition Systems (AFRS) by police forces must be backed by explicit statutory law, strict necessity tests, and independent data retention audits under Article 21.',
    content: `The Supreme Court of India has delivered a pivotal judgment on biometric surveillance and algorithmic policing, clarifying the procedural benchmarks mandated by the landmark Puttaswamy (2017) ruling.

Judicial Holdings:
1. Principle of Legality: Automated facial recognition systems cannot be deployed through mere executive circulars; they require explicit legislative enactment with clearly defined jurisdictional boundaries.
2. Proportionality Standard: State surveillance must establish a legitimate state aim, demonstrate that AFRS is the least intrusive measure available, and provide an effective grievance redressal mechanism against algorithmic misidentification.
3. Audit & Sunset Clauses: Strict statutory deletion of biometric records within 30 days for individuals not charged with any cognizable criminal offense.`,
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
    tags: ['Article 21', 'Right to Privacy', 'Facial Recognition', 'Puttaswamy Judgment', 'Supreme Court', 'GS-2'],
    prelimsPointers: [
      'In K.S. Puttaswamy v. Union of India (2017), a 9-judge Constitution Bench declared the Right to Privacy an intrinsic part of Article 21 and Part III.',
      'The Digital Personal Data Protection (DPDP) Act, 2023 establishes the Data Protection Board of India for adjudicating data breaches.',
      'The four-fold proportionality test entails: Legitimate goal, Rational connection, Necessity, and Balancing of fundamental rights.'
    ],
    mainsQuestions: [
      'The proliferation of algorithmic surveillance technologies challenges traditional privacy safeguards. Discuss in light of recent Supreme Court jurisprudence on Article 21. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-13T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_13_06',
    date: '2026-08-13',
    title: 'Bihar State Health Society Expands "Mukhya Mantri Bal Hriday Yojana Phase-IV" with Paediatric Cardiac Interventions',
    summary: 'The Bihar Health Department signs new multi-super-speciality hospital tie-ups under the Bal Hriday scheme, providing 100% free surgical treatment and travel logistics for children born with congenital heart diseases (CHD).',
    content: `The Bihar State Health Society has expanded the coverage of the Mukhya Mantri Bal Hriday Yojana under the Saat Nischay-2 initiative to treat over 4,500 children diagnosed with complex Congenital Heart Diseases (CHD).

Program Features:
- Comprehensive Screening: Rashtriya Bal Swasthya Karyakram (RBSK) mobile health teams in all 534 blocks perform early echocardiography screenings in Anganwadi centers and primary schools.
- Free Surgical Care: Complete state funding for paediatric cardiac surgeries, transcatheter device closures, and post-operative medications in premier partner hospitals (AIIMS Patna, IGIMS Patna, and Shri Sathya Sai Hospital, Ahmedabad).
- Direct Travel Allowance: State provides free air transport tickets and subsistence allowances for the ailing child and an accompanying guardian.`,
    category: 'Bihar Special',
    source: 'State Health Society - Government of Bihar',
    sourceUrl: 'https://health.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_health',
      sourceName: 'Bihar State Health Society',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Bal Hriday Yojana', 'RBSK', 'Saat Nischay-2', 'Public Health', 'BPSC_GS2'],
    prelimsPointers: [
      'Mukhya Mantri Bal Hriday Yojana was launched in April 2021 under Saat Nischay-2 (Atmanirbhar Bihar).',
      'Rashtriya Bal Swasthya Karyakram (RBSK) is an initiative under the National Health Mission aiming at early identification and early intervention for 4Ds (Defects at birth, Deficiencies, Diseases, Development delays).',
      'IGIMS (Indira Gandhi Institute of Medical Sciences) in Patna is an autonomous super-specialty medical institute established in 1983.'
    ],
    mainsQuestions: [
      'Analyze the public healthcare transformation in Bihar under the Saat Nischay framework. What institutional challenges remain in tertiary paediatric healthcare? (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_governance_2026',
    topicClusterTitle: 'Bihar Social Welfare & Institutional Governance',
    publishedAt: '2026-08-13T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_13_07',
    date: '2026-08-13',
    title: 'LiveMint Policy: Re-evaluating India’s Free Trade Agreements — From UAE CEPA to UK and EU Negotiations',
    summary: 'A macroeconomic assessment of India’s new-generation trade pacts, evaluating how duty-free market access in services and goods can boost non-oil merchandise exports while navigating carbon border adjustments.',
    content: `India’s foreign trade policy has pivoted decisively from multilateral paralysis at the WTO towards bilateral and regional Comprehensive Economic Partnership Agreements (CEPAs) with key economic partners.

Policy Analysis:
- Early Dividend: The India-UAE Comprehensive Economic Partnership Agreement (CEPA) and India-EFTA Trade and Economic Partnership Agreement (TEPA) demonstrated strong gains in gems, jewelry, textiles, and capital investment commitments.
- Emerging Negotiating Complexities: Ongoing negotiations with the European Union and the United Kingdom require resolving sticky chapters on labor standards, environmental regulations, public procurement, and digital data localization.
- Defensive Interests: Protecting sensitive domestic agrarian sectors (dairy, cereals) while securing liberalized mobility for Indian IT professionals and nursing specialists (Mode 4 services trade).`,
    category: 'Economy & Energy',
    source: 'LiveMint - Economy & Policy Desk',
    sourceUrl: 'https://www.livemint.com/economy',
    sourceProvenance: {
      sourceId: 'src_livemint',
      sourceName: 'LiveMint Policy Analysis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'livemint'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['FTA', 'CEPA', 'TEPA', 'Foreign Trade Policy', 'Commerce Ministry', 'GS-3'],
    prelimsPointers: [
      'EFTA (European Free Trade Association) comprises four non-EU European nations: Iceland, Liechtenstein, Norway, and Switzerland.',
      'GATS (General Agreement on Trade in Services) classifies services trade into four modes: Mode 1 (Cross-border supply), Mode 2 (Consumption abroad), Mode 3 (Commercial presence), and Mode 4 (Presence of natural persons).',
      'Foreign Trade Policy 2023 set a target of achieving $2 Trillion in overall Indian exports (goods and services) by 2030.'
    ],
    mainsQuestions: [
      'How do new-generation Free Trade Agreements (FTAs) differ from traditional tariff-reduction treaties? Examine the challenges faced by India in negotiating trade deals with advanced economies. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-13T06:00:00.000Z'
  },
  {
    id: 'ca_2026_08_13_08',
    date: '2026-08-13',
    title: 'Drishti News Analysis: The International Seabed Authority and Deep Sea Mining Regulations in the Clarion-Clipperton Zone',
    summary: 'A detailed exploration of the draft exploitation code under UNCLOS for deep-sea polymetallic nodule extraction, ecological impacts on benthic marine habitats, and India’s Deep Ocean Mission exploration in the Central Indian Ocean Basin.',
    content: `The International Seabed Authority (ISA) council meetings in Kingston, Jamaica, have brought the global debate on commercial deep-sea mining to a critical tipping point as nations deliberate the environmental exploitation code for the international seabed (the 'Common Heritage of Mankind').

Analysis Highlights:
1. Target Resources: Polymetallic nodules resting at depths of 4,000–6,000 meters are rich in nickel, copper, cobalt, and manganese—essential inputs for EV battery chemistries.
2. Ecological Risks: Scientists warn that seabed dredging disrupts ancient benthic sediment plumes, destroys fragile cold-water ecosystems, and creates underwater noise pollution that impairs marine mammal echolocation.
3. India’s Ocean Footprint: Under the Ministry of Earth Sciences’ Deep Ocean Mission, India holds exclusive exploration rights granted by ISA over 75,000 sq km in the Central Indian Ocean Basin (CIOB) and poly-metallic sulphide exploration in the Indian Ocean Ridge.`,
    category: 'Environment & Ecology',
    source: 'Drishti IAS (Supplementary Analysis)',
    sourceUrl: 'https://www.drishtiias.com/daily-updates/daily-news-analysis/deep-sea-mining-isa-regulations',
    sourceProvenance: {
      sourceId: 'src_drishti',
      sourceName: 'Drishti IAS News Analysis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'drishti'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['Deep Ocean Mission', 'ISA', 'UNCLOS', 'Polymetallic Nodules', 'Benthic Ecology', 'GS-1', 'GS-3'],
    prelimsPointers: [
      'The International Seabed Authority (ISA) is an autonomous international organization established under the 1982 UNCLOS and its 1994 Agreement.',
      'ISA headquarters is located in Kingston, Jamaica.',
      'The seabed area beyond national jurisdiction is declared the "Common Heritage of Mankind" under Part XI of UNCLOS.'
    ],
    mainsQuestions: [
      'Discuss the strategic necessity and ecological concerns surrounding deep-sea polymetallic mining in international waters. How prepared is India through its Deep Ocean Mission? (200 words, 12.5 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_marine_ecology_2026',
    topicClusterTitle: 'Marine Biodiversity, Ocean Governance & Deep Sea Mining',
    publishedAt: '2026-08-13T11:00:00.000Z'
  }
];

console.log(`Generated ${historicalDays.length} historical articles.`);
