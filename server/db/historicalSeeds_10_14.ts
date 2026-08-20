import { CurrentAffairArticle } from '../../src/types/index.js';

export const HISTORICAL_SEEDS_10_TO_14: CurrentAffairArticle[] = [
  // =========================================================================
  // AUGUST 14, 2026 (8 ARTICLES)
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
  // AUGUST 13, 2026 (8 ARTICLES)
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
  },

  // =========================================================================
  // AUGUST 12, 2026 (7 ARTICLES)
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
  },

  // =========================================================================
  // AUGUST 11, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_11_01',
    date: '2026-08-11',
    title: 'Union Home Ministry & Law Commission Release Guidelines for Digital Forensics under Bharatiya Nagarik Suraksha Sanhita',
    summary: 'The Ministry of Home Affairs (MHA) and Law Commission issue standard operating procedures for mandatory videography of crime scenes, digital evidence seizure, and e-forensic chain of custody protocols.',
    content: `The Union Ministry of Home Affairs (MHA) has released national standard operating procedures for implementing forensic requirements under the Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023.

Key Directives:
1. Mandatory Forensic Visits: Forensic science experts must mandatorily inspect crime scenes and collect physical evidence for all criminal offenses carrying sentences of 7 years or more.
2. Digital Seizure & Hash Integrity: Seizure of electronic records (smartphones, hard disks, CCTV servers) must record SHA-256 cryptographic hashes immediately to guarantee tamper-proof chain of custody.
3. Inter-operable Criminal Justice System (ICJS): Real-time synchronization connecting e-Prisons, e-Forensics, e-Courts, and CCTNS databases across all state police commissionerates.`,
    category: 'Polity & Governance',
    source: 'Press Information Bureau (PIB) - Ministry of Home Affairs',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081101',
    sourceProvenance: {
      sourceId: 'src_pib_mha',
      sourceName: 'Ministry of Home Affairs',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['BNSS', 'Criminal Justice', 'Digital Forensics', 'ICJS', 'MHA', 'GS-2'],
    prelimsPointers: [
      'Bharatiya Nagarik Suraksha Sanhita (BNSS) replaced the Code of Criminal Procedure, 1973 with effect from July 1, 2024.',
      'National Forensic Sciences University (NFSU) in Gandhinagar, Gujarat is an institution of national importance under MHA.',
      'Inter-operable Criminal Justice System (ICJS) is executed by the National Crime Records Bureau (NCRB).'
    ],
    mainsQuestions: [
      'Evaluate how the mandatory forensic mandates under the Bharatiya Nagarik Suraksha Sanhita (BNSS) will enhance conviction rates while testing state forensic laboratory capacities. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_criminal_justice_2026',
    topicClusterTitle: 'Criminal Justice Reforms, New Penal Codes & Police Modernization',
    publishedAt: '2026-08-11T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_11_02',
    date: '2026-08-11',
    title: 'Bihar Information Technology Department Inaugurates Patna Fintech Hub & Cyber Command Center',
    summary: 'The Bihar Government launches a ₹150 crore plug-and-play incubator in Dak Bunglow Road, Patna, offering high-speed cloud infrastructure and cyber forensics sandbox for 60 fintech and IT startups.',
    content: `The Bihar Department of Information Technology has dedicated the Patna Fintech Innovation Hub and State Cyber Command Center to the youth under Saat Nischay-2.

Key Features:
- Tier-IV Data Center Access: Free cloud compute and API sandboxes provided to early-stage financial technology startups developing regional language payment interfaces and rural credit algorithms.
- Cyber Threat Monitoring: 24/7 security operations center (SOC) monitoring state government portal infrastructure against ransomware attacks, coordinated with Indian Cyber Crime Coordination Centre (I4C).
- Youth Tech Scholarships: ₹20,000 monthly stipends for 500 engineering graduates undergoing specialized blockchain and cloud security apprenticeships.`,
    category: 'Bihar Special',
    source: 'Department of Information Technology - Government of Bihar',
    sourceUrl: 'https://state.bihar.gov.in/it',
    sourceProvenance: {
      sourceId: 'src_bihar_it',
      sourceName: 'Bihar IT Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Patna Fintech Hub', 'IT Policy', 'Saat Nischay-2', 'Cyber Security', 'BPSC_GS2'],
    prelimsPointers: [
      'Bihar IT Policy 2024 offers extensive capital subsidies, lease rental reimbursements, and employment generation grants for IT/ITeS companies.',
      'Indian Cyber Crime Coordination Centre (I4C) was established under MHA to handle cyber crimes in a coordinated manner.',
      'Saat Nischay-2 includes "Yuva Shakti - Bihar Ki Pragati" (Youth Power - Progress of Bihar).'
    ],
    mainsQuestions: [
      'Assess the potential of Bihar’s IT and Startup policies in positioning Patna as an emerging technology and service sector hub in Eastern India. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_governance_2026',
    topicClusterTitle: 'Bihar Social Welfare & Institutional Governance',
    publishedAt: '2026-08-11T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_11_03',
    date: '2026-08-11',
    title: 'The Indian Express Editorial: Re-imagining Criminal Justice Delivery Under the New Penal Codes',
    summary: 'An editorial analysis examining the procedural transitions from IPC, CrPC, and Indian Evidence Act to BNS, BNSS, and BSA, evaluating institutional readiness and undertrial relief provisions.',
    content: `The implementation of India's three new criminal codes—Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS), and Bharatiya Sakshya Adhiniyam (BSA)—marks the most comprehensive overhaul of penal statutes since 1860.

Key Editorial Points:
- Progressive Inclusions: Recognizing community service as an alternate punishment for petty crimes, statutory time limits on judgment pronouncements (within 45 days of trial conclusion), and mandatory electronic summons delivery.
- Operational Bottlenecks: Over 80% of district police stations and rural subordinate courts face severe shortages of high-speed bandwidth, digital video recording kits, and certified forensic mobile units.
- Protecting Personal Liberty: Police custody provisions under Section 187 BNSS (which allow custody across the initial 40 or 60 days) require strict judicial oversight to prevent coercive detention abuses.`,
    category: 'Polity & Governance',
    source: 'The Indian Express - Editorial Desk',
    sourceUrl: 'https://indianexpress.com/article/opinion/editorials',
    sourceProvenance: {
      sourceId: 'src_indian_express',
      sourceName: 'The Indian Express Editorial Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'indian_express'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['BNS', 'BNSS', 'BSA', 'Criminal Justice', 'Article 21', 'Judicial Delivery', 'GS-2'],
    prelimsPointers: [
      'Bharatiya Nyaya Sanhita (BNS) replaced the Indian Penal Code, 1860.',
      'Bharatiya Sakshya Adhiniyam (BSA) replaced the Indian Evidence Act, 1872.',
      'Community service has been introduced as a punishment for six petty offenses under the BNS.'
    ],
    mainsQuestions: [
      'Analyze the structural reforms introduced by the new criminal law codes in India. What administrative hurdles must be overcome to ensure seamless trial delivery? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_criminal_justice_2026',
    topicClusterTitle: 'Criminal Justice Reforms, New Penal Codes & Police Modernization',
    publishedAt: '2026-08-11T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_11_04',
    date: '2026-08-11',
    title: 'Ministry of Environment Notifies National Coastal Zone Management Plan 2026 with Mangrove Eco-Protection',
    summary: 'The MoEFCC notifies updated CRZ norms under the Environment (Protection) Act, mandating 500-meter strict no-development zones in ecologically sensitive CRZ-IA mangrove habitats and coral atolls.',
    content: `The Union Ministry of Environment, Forest and Climate Change has published the National Coastal Zone Management Plan (NCZMP 2026) to shield vulnerable coastal populations from rising sea levels and storm surges.

Key Regulatory Pillars:
1. Strict CRZ-IA Conservation: Total prohibition on commercial reclamation and heavy industrial construction across all coastal mangrove forests, sand dunes, coral reefs, and sea turtle nesting sites.
2. MISHTI Scheme Integration: Expanding the Mangrove Initiative for Shoreline Habitats & Tangible Incomes (MISHTI) across 540 sq km of degraded coastline in West Bengal, Odisha, Andhra Pradesh, and Gujarat.
3. Coastal Community Livelihoods: Facilitating decentralized seaweed farming, crab culture, and artisanal fishing jetties in CRZ-III rural coastal areas.`,
    category: 'Environment & Climate Change',
    source: 'Press Information Bureau (PIB) - Ministry of Environment',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081104',
    sourceProvenance: {
      sourceId: 'src_pib_moefcc',
      sourceName: 'Ministry of Environment, Forest & Climate Change',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['CRZ', 'MISHTI Scheme', 'Mangroves', 'Coastal Ecology', 'MoEFCC', 'GS-3'],
    prelimsPointers: [
      'Coastal Regulation Zone (CRZ) notifications are issued under Section 3 of the Environment (Protection) Act, 1986.',
      'MISHTI (Mangrove Initiative for Shoreline Habitats & Tangible Incomes) was launched on World Environment Day 2023.',
      'Sundarbans in West Bengal is the largest contiguous mangrove forest in the world and a UNESCO World Heritage Site.'
    ],
    mainsQuestions: [
      'Evaluate the ecological and socio-economic importance of mangroves as natural bio-shields against coastal hazards in India. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_marine_ecology_2026',
    topicClusterTitle: 'Marine Biodiversity, Ocean Governance & Deep Sea Mining',
    publishedAt: '2026-08-11T08:30:00.000Z'
  },
  {
    id: 'ca_2026_08_11_05',
    date: '2026-08-11',
    title: 'NITI Aayog Releases State Energy and Climate Index (SECI) 2026: Evaluates Clean Power and Efficiency',
    summary: 'The apex policy think-tank publishes SECI Round-3 rankings assessing states across 6 parameters including DISCOM financial viability, clean energy penetration, and energy efficiency programs.',
    content: `NITI Aayog in collaboration with the Ministry of Power and Bureau of Energy Efficiency (BEE) has published the State Energy and Climate Index (SECI 2026).

Report Findings:
- Front-Runners: Gujarat, Kerala, and Punjab ranked as top performers among larger states due to strong rooftop solar uptake and loss-reduction in power distribution.
- Fast-Moving States: Bihar and Odisha registered the highest delta improvement scores driven by rural feeder solarization (PM-KUSUM) and widespread smart prepaid metering rollouts.
- Key Metrics: Evaluated 27 key indicators across DISCOM Performance, Access & Affordability, Clean Energy Initiatives, Energy Efficiency, Environmental Sustainability, and New Initiatives (EVs, Green Hydrogen).`,
    category: 'Economy & Renewable Energy',
    source: 'Press Information Bureau (PIB) - NITI Aayog',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081105',
    sourceProvenance: {
      sourceId: 'src_pib_niti',
      sourceName: 'NITI Aayog',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_fiscal_fed',
    tags: ['SECI', 'NITI Aayog', 'Energy Index', 'PM-KUSUM', 'Renewable Energy', 'GS-3'],
    prelimsPointers: [
      'The State Energy and Climate Index (SECI) was conceptualized by NITI Aayog to track state-level decarbonization and grid readiness.',
      'Bureau of Energy Efficiency (BEE) is a statutory body under the Ministry of Power established under the Energy Conservation Act, 2001.',
      'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan) provides solar pumps and grid-connected solar power plants to farmers.'
    ],
    mainsQuestions: [
      'How do competitive sub-national benchmarking indices like NITI Aayog’s SECI foster clean energy innovation among Indian states? (200 words, 12.5 Marks)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_clean_energy_grid_transition',
    topicClusterTitle: 'Clean Energy Transition, Battery Storage & Power Sector Reforms',
    publishedAt: '2026-08-11T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_11_06',
    date: '2026-08-11',
    title: 'Bihar Panchayati Raj Department Rolls Out Solar Street Light Scheme Phase-III Across 8,387 Gram Panchayats',
    summary: 'The Bihar Government completes installation of 4.5 lakh solar LED street lights with telemetric remote monitoring units (RMS) under the "Swachh Gaon, Samridh Gaon" Saat Nischay-2 initiative.',
    content: `The Bihar Department of Panchayati Raj in coordination with Bihar Renewable Energy Development Agency (BREDA) has achieved the complete commissioning of Phase-III of the Mukhya Mantri Gramin Solar Street Light Yojana.

Key Deliverables:
- Universal Panchayat Coverage: 10 to 12 solar LED lights installed in every rural ward across all 8,387 Gram Panchayats in the state.
- Remote Monitoring System (RMS): Centralized cloud dashboard with IoT micro-controllers that flags defective batteries and non-functioning fixtures within 24 hours.
- Rural Safety & Commerce: Provides illuminated village squares and haat bazaars, significantly improving nighttime safety for rural women and small traders.`,
    category: 'Bihar Special',
    source: 'Department of Panchayati Raj - Government of Bihar',
    sourceUrl: 'https://biharprd.bih.nic.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_prd',
      sourceName: 'Bihar Panchayati Raj Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Panchayati Raj', 'Solar Street Light', 'Saat Nischay-2', 'BREDA', 'BPSC_GS2'],
    prelimsPointers: [
      'Mukhya Mantri Gramin Solar Street Light Yojana was launched in September 2022 under Saat Nischay-2 ("Swachh Gaon, Samridh Gaon").',
      'BREDA (Bihar Renewable Energy Development Agency) functions under the Energy Department of Bihar.',
      'The 73rd Constitutional Amendment Act, 1992 added Part IX and the Eleventh Schedule (29 functional items) to the Constitution.'
    ],
    mainsQuestions: [
      'Examine the role of decentralized renewable energy systems in transforming rural living standards and local governance in Bihar. (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_governance_2026',
    topicClusterTitle: 'Bihar Social Welfare & Institutional Governance',
    publishedAt: '2026-08-11T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_11_07',
    date: '2026-08-11',
    title: 'The Hindu Science & Tech: Solid-State Battery Breakthroughs — Silicon Anodes and Thermal Runaway Prevention',
    summary: 'An analytical review of next-generation solid-state lithium battery chemistry, replacing volatile liquid organic electrolytes with solid ceramic separators to achieve 500 Wh/kg energy density.',
    content: `The global automotive and grid storage industries are racing to commercialize all-solid-state lithium-metal batteries (ASSBs), overcoming the critical safety and energy density ceilings of traditional lithium-ion batteries.

Technical Highlights:
1. Eliminating Thermal Runaway: Conventional liquid electrolytes contain flammable organic carbonates susceptible to catastrophic fires during internal short-circuits. Solid sulfide and oxide ceramic electrolytes are non-flammable and stable up to 300°C.
2. High Energy Density: Enables the direct use of pure lithium-metal or silicon-composite anodes, doubling EV driving range to over 1,000 km on a single 15-minute ultra-fast charge.
3. Manufacturing Hurdles: Solving microscopic lithium dendrite propagation across ceramic grain boundaries and developing low-cost dry-room roll-to-roll manufacturing processes.`,
    category: 'Science & Technology',
    source: 'The Hindu - Science & Tech Desk',
    sourceUrl: 'https://www.thehindu.com/sci-tech',
    sourceProvenance: {
      sourceId: 'src_the_hindu',
      sourceName: 'The Hindu Science Desk',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'the_hindu'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_economy',
    conceptId: 'c_resources_minerals',
    tags: ['Solid-State Battery', 'EV Tech', 'Lithium Metal', 'Clean Energy', 'Science & Tech', 'GS-3'],
    prelimsPointers: [
      'Lithium-ion batteries typically use graphite anodes and liquid electrolytes containing lithium hexafluorophosphate (LiPF6).',
      'Solid-state batteries replace liquid electrolyte with solid electrolytes such as ceramic, polymer, or sulfide-based conductors.',
      'Advanced Chemistry Cell (ACC) Battery Storage PLI scheme was approved by the Union Cabinet with an outlay of ₹18,100 crore.'
    ],
    mainsQuestions: [
      'Explain how solid-state battery technology can overcome the safety and range limitations of contemporary electric vehicles. Discuss India’s Advanced Chemistry Cell (ACC) PLI roadmap. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_clean_energy_grid_transition',
    topicClusterTitle: 'Clean Energy Transition, Battery Storage & Power Sector Reforms',
    publishedAt: '2026-08-11T06:00:00.000Z'
  },

  // =========================================================================
  // AUGUST 10, 2026 (7 ARTICLES)
  // =========================================================================
  {
    id: 'ca_2026_08_10_01',
    date: '2026-08-10',
    title: 'India and ASEAN Finalize Modalities for Comprehensive Review of ASEAN-India Trade in Goods Agreement (AITIGA)',
    summary: 'The Joint Committee of the ASEAN-India Trade in Goods Agreement (AITIGA) concludes negotiations in Jakarta to make the 2009 trade treaty more user-friendly, simple, and trade-facilitative by early 2027.',
    content: `The Ministry of Commerce and Industry has announced the conclusion of the 6th Joint Committee Meeting for the review of the ASEAN-India Trade in Goods Agreement (AITIGA).

Key Focus Areas:
1. Addressing Trade Asymmetry: India’s trade deficit with ASEAN widened from $7.5 billion in 2010 to over $43 billion, necessitating rationalization of non-tariff barriers and market access for Indian pharmaceuticals and engineering goods.
2. Stricter Rules of Origin (ROO): Preventing third-country circumvention and duty-free re-routing of Chinese manufactured goods through ASEAN member states by establishing strict Value Addition (VA) and Change in Tariff Classification (CTC) rules.
3. Customs Modernization: Paperless cross-border verification of electronic Certificates of Origin (e-CoO) to slash logistics transit times.`,
    category: 'International Relations & Trade',
    source: 'Press Information Bureau (PIB) - Ministry of Commerce',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081001',
    sourceProvenance: {
      sourceId: 'src_pib_commerce',
      sourceName: 'Ministry of Commerce & Industry',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['ASEAN', 'AITIGA', 'Act East Policy', 'Trade Deficit', 'Rules of Origin', 'GS-2'],
    prelimsPointers: [
      'ASEAN (Association of Southeast Asian Nations) was established on August 8, 1967 with the signing of the Bangkok Declaration.',
      'ASEAN comprises 10 member states: Brunei, Cambodia, Indonesia, Laos, Malaysia, Myanmar, Philippines, Singapore, Thailand, and Vietnam.',
      'India became a sectoral dialogue partner of ASEAN in 1992 and a full dialogue partner in 1995.'
    ],
    mainsQuestions: [
      'Evaluate the strategic and economic rationale for reviewing the ASEAN-India Trade in Goods Agreement (AITIGA). How does trade rebalancing align with India’s Act East Policy? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-10T06:30:00.000Z'
  },
  {
    id: 'ca_2026_08_10_02',
    date: '2026-08-10',
    title: 'Bihar Education Department Unveils Nalanda Open Science & Digital Research Repository',
    summary: 'The Bihar Government launches a state-of-the-art open-access academic portal linking 18 state universities, archiving 2.5 lakh digitized historical manuscripts, research theses, and Pali-Prakrit texts.',
    content: `The Bihar Department of Education has launched the 'Nalanda Digital Gyan Kosh' (Open Science and Research Repository) to democratize higher academic research and preserve ancient manuscript heritage.

Key Portal Features:
- Rare Manuscript Digitization: High-resolution multispectral scanning of palm-leaf and birch-bark manuscripts from Nalanda, Vikramshila, and Mithila Sanskrit institutes.
- Inter-University Research Access: Open digital repository compliant with OAI-PMH protocols, allowing university students across Bihar free access to indexed journals and laboratory datasets.
- Regional Language AI Translation: Natural Language Processing (NLP) models translating seminal scientific treatises into Hindi, Maithili, Bhojpuri, and Magahi.`,
    category: 'Bihar Special',
    source: 'Department of Education - Government of Bihar',
    sourceUrl: 'https://education.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_edu',
      sourceName: 'Bihar Education Department',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Nalanda', 'Higher Education', 'Manuscripts', 'Digital Repository', 'BPSC_GS1'],
    prelimsPointers: [
      'Ancient Nalanda University was founded during the Gupta Empire in the 5th century CE by Emperor Kumaragupta I.',
      'Vikramshila University was founded by the Pala king Dharmapala in the late 8th or early 9th century CE in modern-day Bhagalpur district.',
      'The National Mission for Manuscripts (NMM) was established in 2003 by the Ministry of Culture to preserve India’s vast manuscript heritage.'
    ],
    mainsQuestions: [
      'Highlight the historical contributions of ancient universities in Bihar (Nalanda and Vikramshila) to global scholarship and examine contemporary initiatives to revive higher education in the state. (200 words, 38 Marks, BPSC GS-1)'
    ],
    importance: 'HIGH',
    isTopStory: true,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_education_2026',
    topicClusterTitle: 'Bihar Education Reforms, Higher Technical Institutes & Innovation',
    publishedAt: '2026-08-10T07:15:00.000Z'
  },
  {
    id: 'ca_2026_08_10_03',
    date: '2026-08-10',
    title: 'LiveMint Editorial: Global Trade Architecture in Fragmented Geopolitics — The Rise of Plurilateral and Friend-Shoring Pacts',
    summary: 'A macroeconomic analysis of the breakdown of the WTO multilateral dispute settlement system and the emergence of minilateral supply chain compacts like IPEF and Minerals Security Partnership.',
    content: `The post-World War II consensus on multilateralism governed by the World Trade Organization (WTO) is undergoing structural fragmentation, replaced by plurilateral, security-driven trade arrangements.

Key Editorial Points:
- Demise of the Appellate Body: The continued paralysis of the WTO Appellate Body has reduced global trade dispute adjudication to bilateral retaliatory tariff wars.
- Geoeconomic Weaponization: Export controls on advanced semiconductors, critical raw materials, and clean tech components indicate that economic efficiency is being subordinated to national security and supply chain resilience.
- Strategic Imperatives for India: India must actively negotiate plurilateral agreements (such as the Indo-Pacific Economic Framework for Prosperity - IPEF) while aggressively reforming domestic logistics and trade facilitation to capture manufacturing relocations.`,
    category: 'Economy & International Trade',
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
    tags: ['WTO', 'IPEF', 'Friend-Shoring', 'Trade Fragmentation', 'Geopolitics', 'GS-2', 'GS-3'],
    prelimsPointers: [
      'The Indo-Pacific Economic Framework for Prosperity (IPEF) was launched in May 2022 with 14 partner countries across four pillars (Trade, Supply Chains, Clean Economy, Fair Economy).',
      'The WTO was established on January 1, 1995 under the Marrakesh Agreement, replacing the General Agreement on Tariffs and Trade (GATT).',
      'The WTO Appellate Body consists of 7 members; appointments have been blocked since 2019.'
    ],
    mainsQuestions: [
      'Examine the factors leading to the crisis in multilateral trade governance under the WTO. How should India navigate the era of friend-shoring and plurilateral economic pacts? (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-10T05:00:00.000Z'
  },
  {
    id: 'ca_2026_08_10_04',
    date: '2026-08-10',
    title: 'Supreme Court Bench Rules on Environmental Clearance Compliance and "Polluter Pays" Principle under NGT Act',
    summary: 'A 2-judge bench of the Supreme Court upholds National Green Tribunal (NGT) powers to levy environmental compensation on defaulting industrial units, holding that ex-post facto clearances cannot cure gross ecological devastation.',
    content: `The Supreme Court of India has reiterated strict environmental jurisprudence regarding environmental clearances (EC) and the restitution of ecological damage caused by unauthorized mining and industrial operations.

Judicial Holdings:
1. Polluter Pays as Precautionary Mandate: Environmental compensation is not a mere tax on pollution but a restitutionary remedy aimed at restoring degraded aquifers, forests, and soil ecosystems to their pristine baseline.
2. Invalidation of Ex-Post Facto Approvals: Environmental Impact Assessment (EIA) is a mandatory prior condition under the Environment (Protection) Act 1986; retrospective regularizations cannot validate unlawful operations.
3. NGT’s Suo Motu Authority: Reaffirmed that the National Green Tribunal possesses inherent suo motu powers under Section 14 of the NGT Act to initiate inquiries for environmental justice.`,
    category: 'Environment & Judicial Jurisprudence',
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
    tags: ['NGT Act', 'Polluter Pays', 'EIA', 'Supreme Court', 'Environmental Law', 'GS-3'],
    prelimsPointers: [
      'The National Green Tribunal (NGT) was established in 2010 under the National Green Tribunal Act 2010 for effective and expeditious disposal of environmental cases.',
      'The "Polluter Pays" and "Precautionary" principles were first incorporated into Indian environmental jurisprudence in the Vellore Citizens’ Welfare Forum case (1996).',
      'The NGT is not bound by the procedure laid down under the Code of Civil Procedure, 1908, but guided by principles of natural justice.'
    ],
    mainsQuestions: [
      'Analyze the role of the National Green Tribunal (NGT) and the Supreme Court in advancing environmental jurisprudence through the "Polluter Pays" and "Precautionary" principles. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_judicial_reforms_2026',
    topicClusterTitle: 'Judicial Reforms & Access to Justice',
    publishedAt: '2026-08-10T09:00:00.000Z'
  },
  {
    id: 'ca_2026_08_10_05',
    date: '2026-08-10',
    title: 'Ministry of Jal Shakti Reviews Jal Jeevan Mission Functional Household Tap Connections Sustainability',
    summary: 'The Department of Drinking Water and Sanitation reports 80% coverage under Har Ghar Jal, launching a national framework for source sustainability, greywater treatment, and community water quality surveillance.',
    content: `The Union Ministry of Jal Shakti has conducted a national performance review of the Jal Jeevan Mission (JJM), focusing on transitioning from infrastructure creation to operational service delivery and water safety.

Program Achievements & Directives:
- Tap Water Coverage: Over 15.5 crore rural households now have Functional Household Tap Connections (FHTC), providing 55 liters per capita per day (lpcd) of potable drinking water.
- Village Water & Sanitation Committees (VWSCs): Handing over operations and maintenance (O&M) of piped water systems to Gram Panchayats and Paani Samitis.
- Water Quality Testing: Empowering 5 women in every village with Field Test Kits (FTKs) to regularly monitor microbial contamination, arsenic, and fluoride levels.`,
    category: 'Water Governance & Rural Welfare',
    source: 'Press Information Bureau (PIB) - Ministry of Jal Shakti',
    sourceUrl: 'https://pib.gov.in/PressReleasePage.aspx?PRID=2026081005',
    sourceProvenance: {
      sourceId: 'src_pib_jal',
      sourceName: 'Ministry of Jal Shakti',
      sourceType: 'GOVERNMENT',
      adapter: 'pib'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_polity',
    conceptId: 'c_art21',
    tags: ['Jal Jeevan Mission', 'Har Ghar Jal', 'Jal Shakti', 'Paani Samiti', 'Water Quality', 'GS-2'],
    prelimsPointers: [
      'Jal Jeevan Mission was announced on August 15, 2019, to provide Functional Household Tap Connections (FHTC) to every rural household by 2024 (extended to 2028).',
      'The benchmark under JJM is providing 55 litres of potable drinking water per person per day.',
      'Goa was the first state in India to achieve 100% "Har Ghar Jal" certified coverage.'
    ],
    mainsQuestions: [
      'Evaluate the success and long-term source sustainability challenges of the Jal Jeevan Mission in rural India. (200 words, 12.5 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: false,
    topicClusterId: 'cluster_water_governance_2026',
    topicClusterTitle: 'Water Governance & Cooperative Federalism',
    publishedAt: '2026-08-10T08:00:00.000Z'
  },
  {
    id: 'ca_2026_08_10_06',
    date: '2026-08-10',
    title: 'Bihar Animal & Fisheries Resources Department Announces Cage Aquaculture in River Ganga & Kosi',
    summary: 'The Bihar Government approves ₹85 crore under the Pradhan Mantri Matsya Sampada Yojana (PMMSY) to install 1,200 floating fish cages for high-value Pangasius, Rohu, and Katla rearing by traditional Mallah cooperatives.',
    content: `The Bihar Department of Animal and Fisheries Resources has rolled out a riverine and reservoir cage culture fisheries initiative to boost state inland fish production.

Strategic Interventions:
- Floating Cage Batteries: Deploying circular and rectangular floating fish cages in oxbow lakes (mauns), reservoirs, and placid Ganga channels across Bhagalpur, Katihar, Saharsa, and Munger.
- Direct Beneficiary Subsidies: 60% financial assistance for Scheduled Caste, Scheduled Tribe, and women fisherfolk cooperatives for cage fabrication, fingerling stocking, and floating feed pellets.
- Self-Sufficiency Milestone: Bihar has turned from a fish-deficit state importing from Andhra Pradesh into a net inland fish surplus state producing over 8.5 lakh metric tons annually.`,
    category: 'Bihar Special',
    source: 'Department of Animal & Fisheries Resources - Government of Bihar',
    sourceUrl: 'https://ahd.bihar.gov.in/',
    sourceProvenance: {
      sourceId: 'src_bihar_fisheries',
      sourceName: 'Bihar Animal & Fisheries Dept',
      sourceType: 'GOVERNMENT',
      adapter: 'bihar_gov'
    },
    examRelevance: ['BPSC', 'UPSC_CSE'],
    subjectId: 'sub_bihar',
    conceptId: 'c_bihar_economy_saat_nischay',
    tags: ['Bihar Special', 'Cage Aquaculture', 'PMMSY', 'Fisheries', 'Blue Revolution', 'BPSC_GS2'],
    prelimsPointers: [
      'Pradhan Mantri Matsya Sampada Yojana (PMMSY) was launched in September 2020 with an investment of ₹20,050 crore to drive the Blue Revolution.',
      'Bihar ranks 4th in inland fish production in India.',
      'The National Fisheries Development Board (NFDB) is headquartered in Hyderabad, Telangana.'
    ],
    mainsQuestions: [
      'Analyze the growth potential of the fisheries and aquaculture sector in Bihar’s agrarian economy. How do schemes like PMMSY support traditional fishing communities? (200 words, 38 Marks, BPSC GS-2)'
    ],
    importance: 'MEDIUM',
    isTopStory: false,
    isEditorial: false,
    isBiharSpecial: true,
    topicClusterId: 'cluster_bihar_agro_2026',
    topicClusterTitle: 'Bihar Agro-Industrial Economy & GI Modernization',
    publishedAt: '2026-08-10T10:00:00.000Z'
  },
  {
    id: 'ca_2026_08_10_07',
    date: '2026-08-10',
    title: 'Drishti News Analysis: India-Middle East-Europe Economic Corridor (IMEC) — Geopolitics and Multi-Modal Architecture',
    summary: 'A detailed strategic analysis of the India-Middle East-Europe Economic Corridor (IMEC), examining rail-ship transit routes through the UAE, Saudi Arabia, Jordan, and Israel, and its role as an alternative to China’s Belt and Road Initiative (BRI).',
    content: `The India-Middle East-Europe Economic Corridor (IMEC), unveiled on the sidelines of the G20 New Delhi Leaders’ Summit, represents a transformative cross-continental infrastructure initiative connecting India, the Arabian Gulf, and Europe.

Strategic Dimensions:
1. Corridor Architecture:
   - Eastern Corridor: Connecting Indian western ports (JNPT, Mundra, Kandla) to Arabian ports (Fujairah, Jebel Ali, Haifa).
   - Northern Corridor: Connecting Gulf ports via advanced railway networks across Saudi Arabia and Jordan to Israel’s Haifa Port, and onward by sea to European ports (Piraeus, Marseille).
2. Economic Velocity: Reduces multimodal transit time between India and Europe by 40% and logistics costs by 30% compared to the traditional Suez Canal maritime route.
3. Clean Energy & Digital Public Infrastructure: Features co-located hydrogen pipelines, high-voltage undersea clean electricity cables, and high-speed data transmission fiber networks.`,
    category: 'International Relations & Strategy',
    source: 'Drishti IAS (Supplementary Analysis)',
    sourceUrl: 'https://www.drishtiias.com/daily-updates/daily-news-analysis/imec-corridor-geopolitics-strategic-challenges',
    sourceProvenance: {
      sourceId: 'src_drishti',
      sourceName: 'Drishti IAS News Analysis',
      sourceType: 'MEDIA_OUTLET',
      adapter: 'drishti'
    },
    examRelevance: ['UPSC_CSE', 'BPSC'],
    subjectId: 'sub_ca',
    conceptId: 'c_ca_general',
    tags: ['IMEC', 'G20', 'Middle East', 'Connectivity Corridors', 'Geopolitics', 'GS-2'],
    prelimsPointers: [
      'The Memorandum of Understanding (MoU) on IMEC was signed at the 2023 G20 New Delhi Summit by India, the US, Saudi Arabia, UAE, France, Germany, Italy, and the EU.',
      'Haifa Port in Israel is a critical Mediterranean maritime node in the IMEC northern corridor.',
      'The Partnership for Global Infrastructure and Investment (PGII) is a G7 initiative to fund sustainable infrastructure in developing countries.'
    ],
    mainsQuestions: [
      'The India-Middle East-Europe Economic Corridor (IMEC) is hailed as a game-changer for Eurasian trade and connectivity. Analyze its strategic advantages and geopolitical challenges. (250 words, 15 Marks)'
    ],
    importance: 'HIGH',
    isTopStory: false,
    isEditorial: true,
    isBiharSpecial: false,
    topicClusterId: 'cluster_international_diplomacy_2026',
    topicClusterTitle: 'Global South Leadership, Trade Corridors & Multilateral Summits',
    publishedAt: '2026-08-10T11:00:00.000Z'
  }
];
