import pool from './pool.js';

export async function seedMainsAndInterviewData() {
  console.log('[Seed] Seeding canonical Mains & Interview questions...');

  // 1. Canonical UPSC & BPSC Mains Questions
  const mainsQuestions = [
    {
      id: 'mq_upsc_gs2_fed_2024',
      subject_id: 'sub_polity',
      topic_id: 'top_const_framework',
      concept_id: 'c_basic_structure',
      type: 'MAINS',
      stage: 'MAINS',
      exam: 'UPSC',
      paper: 'GS Paper II',
      pyq_year: 2024,
      question_number: 1,
      marks: 10,
      word_limit: 150,
      difficulty: 'MEDIUM',
      origin: 'OFFICIAL_COMMISSION',
      source: 'UPSC CSE Mains 2024 GS Paper II',
      is_pyq: true,
      verified_status: 'VERIFIED_PYQ',
      is_published: true,
      question: 'Constitutional Morality is rooted in the Constitution itself and is founded on its essential facets. Explain the doctrine with the help of relevant judicial precedents.',
      explanation: 'Examine the evolution of Constitutional Morality from Ambedkar’s Constituent Assembly speech to modern Supreme Court judgments like Navtej Johar, Sabarimala, and Manoj Narula cases.',
      rubric: {
        dimensions: [
          'Introduction: Definition of Constitutional Morality and Ambedkar’s vision',
          'Core Facets: Rule of law, individual liberty, pluralism, and democratic norms',
          'Judicial Precedents: Navtej Johar (2018), Sabarimala (2018), Government of NCT Delhi (2018)',
          'Concerns: Judicial subjectivity vs democratic legislative legitimacy',
          'Conclusion: Balanced constitutional governance'
        ]
      },
      model_structure: {
        intro: 'Define Constitutional Morality as adherence to core constitutional values beyond mere legalism.',
        body: '1. Genesis in Constituent Assembly debates; 2. Key Supreme Court milestones; 3. Distinction from popular morality.',
        conclusion: 'Constitutional morality serves as an indispensable beacon to prevent arbitrary governance.'
      }
    },
    {
      id: 'mq_upsc_gs2_governance_2023',
      subject_id: 'sub_polity',
      topic_id: 'top_federalism_local',
      concept_id: 'c_panchayati_raj_73',
      type: 'MAINS',
      stage: 'MAINS',
      exam: 'UPSC',
      paper: 'GS Paper II',
      pyq_year: 2023,
      question_number: 2,
      marks: 15,
      word_limit: 250,
      difficulty: 'HARD',
      origin: 'OFFICIAL_COMMISSION',
      source: 'UPSC CSE Mains 2023 GS Paper II',
      is_pyq: true,
      verified_status: 'VERIFIED_PYQ',
      is_published: true,
      question: 'Analyze the impact of digital governance initiatives in citizen empowerment and transparency. What structural challenges continue to impede last-mile service delivery?',
      explanation: 'Evaluate DBT, JAM Trinity, UMANG, DigiLocker, and contrast with digital divide, exclusion errors, and cyber infrastructure deficit.',
      rubric: {
        dimensions: [
          'Direct Benefits: Leakage reduction, speed, administrative accountability',
          'Citizen Inclusivity: Citizen charter, grievance redressal, right to service',
          'Impediments: Digital illiteracy, connectivity gaps in rural areas, biometric mismatch',
          'Actionable Remedies: Hybrid delivery models, CSC strengthening, local language interfaces'
        ]
      }
    },
    {
      id: 'mq_upsc_gs3_econ_inflation_2024',
      subject_id: 'sub_economy',
      topic_id: 'top_monetary_banking',
      concept_id: 'c_mpc',
      type: 'MAINS',
      stage: 'MAINS',
      exam: 'UPSC',
      paper: 'GS Paper III',
      pyq_year: 2024,
      question_number: 3,
      marks: 15,
      word_limit: 250,
      difficulty: 'MEDIUM',
      origin: 'OFFICIAL_COMMISSION',
      source: 'UPSC CSE Mains 2024 GS Paper III',
      is_pyq: true,
      verified_status: 'VERIFIED_PYQ',
      is_published: true,
      question: 'How does supply chain disruption and imported inflation pose a trilemma for monetary policy makers in emerging economies like India? Discuss policy remedies beyond interest rate hikes.',
      explanation: 'Explain the constraints on RBI Monetary Policy Committee when inflation is driven by geopolitical shocks, crude prices, and food supply bottlenecks.',
      rubric: {
        dimensions: [
          'Conceptual clarity on cost-push vs demand-pull inflation',
          'Monetary Policy Trilemma: Inflation targeting, economic growth, and exchange rate stability',
          'Supply-side fiscal measures: Buffer stocks, tariff rationalization, logistics corridor',
          'Coordinated monetary-fiscal roadmap'
        ]
      }
    },
    {
      id: 'mq_upsc_gs4_ethics_case_2024',
      subject_id: 'sub_polity',
      topic_id: 'top_const_framework',
      concept_id: 'c_preamble_values',
      type: 'MAINS',
      stage: 'MAINS',
      exam: 'UPSC',
      paper: 'GS Paper IV',
      pyq_year: 2024,
      question_number: 7,
      marks: 20,
      word_limit: 250,
      difficulty: 'HARD',
      origin: 'OFFICIAL_COMMISSION',
      source: 'UPSC CSE Mains 2024 GS Paper IV',
      is_pyq: true,
      verified_status: 'VERIFIED_PYQ',
      is_published: true,
      question: 'You are the District Magistrate overseeing rehabilitation in an area struck by a flash flood. Political leaders demand preferential allocation of relief camps and rations to specific constituencies. Meanwhile, marginalized communities without digital identity or land deeds are being excluded by automated biometric verification. (a) Identify the ethical dilemmas. (b) Formulate your plan of action upholding administrative integrity and universal human dignity.',
      explanation: 'Ethical framework: Deontological duty of fairness vs political pressure, utilitarian distribution vs Rawlsian justice for the most vulnerable.',
      rubric: {
        dimensions: [
          'Stakeholder mapping (victims, administration, politicians, relief workers)',
          'Ethical dilemmas (Universal compassion vs Political pressure, Due process vs Emergency rescue)',
          'Immediate decisive action: Manual emergency relief counters with spot executive orders',
          'Systemic audit, transparency dashboard, zero-bias ration distribution'
        ]
      }
    },
    {
      id: 'mq_bpsc_gs1_bihar_rev_2023',
      subject_id: 'sub_bihar',
      topic_id: 'top_bihar_freedom',
      concept_id: 'c_bihar_freedom_1857',
      type: 'MAINS',
      stage: 'MAINS',
      exam: 'BPSC',
      paper: 'General Studies I',
      pyq_year: 2023,
      question_number: 1,
      marks: 38,
      word_limit: 400,
      difficulty: 'MEDIUM',
      origin: 'OFFICIAL_COMMISSION',
      source: '69th BPSC Mains GS Paper I',
      is_pyq: true,
      verified_status: 'VERIFIED_PYQ',
      is_published: true,
      question: 'Critically analyze the role of Bihar in the Revolt of 1857 with special reference to Babu Kunwar Singh. How did this mobilization inspire subsequent national resistance movements?',
      explanation: 'Highlight Kunwar Singh’s guerrilla strategy across Jagdishpur, Arrah, and Rewa, integration of peasant resistance, and lasting cultural-political legacy.',
      rubric: {
        dimensions: [
          'Historical background of 1857 in Bihar (Danapur regiment uprising)',
          'Kunwar Singh’s leadership: Military valor, inter-regional alliances, peasant support',
          'Limitations and tactical setbacks',
          'Legacy inspiring Champaran Satyagraha and 1942 Quit India in Bihar'
        ]
      }
    }
  ];

  for (const q of mainsQuestions) {
    await pool.query(`
      INSERT INTO public.questions (
        id, subject_id, topic_id, concept_id, type, stage, exam, paper, pyq_year,
        question_number, marks, word_limit, difficulty, origin, source, is_pyq,
        verified_status, is_published, question, explanation, rubric, model_structure,
        correct_answer
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'DESCRIPTIVE_EVALUATION')
      ON CONFLICT (id) DO UPDATE SET
        stage = EXCLUDED.stage,
        marks = EXCLUDED.marks,
        word_limit = EXCLUDED.word_limit,
        origin = EXCLUDED.origin,
        rubric = EXCLUDED.rubric,
        model_structure = EXCLUDED.model_structure,
        is_published = true;
    `, [
      q.id, q.subject_id, q.topic_id, q.concept_id, q.type, q.stage, q.exam, q.paper, q.pyq_year,
      q.question_number, q.marks, q.word_limit, q.difficulty, q.origin, q.source, q.is_pyq,
      q.verified_status, q.is_published, q.question, q.explanation, JSON.stringify(q.rubric), JSON.stringify(q.model_structure || {})
    ]);
  }

  // 2. Canonical Interview Questions across Categories
  const interviewQuestions = [
    {
      id: 'iq_daf_opt_polity',
      exam: 'UPSC',
      category: 'DAF_PROFILE',
      topic: 'Optional Subject Rationale',
      question: 'You completed your graduation in Engineering/Science, yet you chose Political Science & International Relations (or Humanities) as your optional subject. Why did you not pursue your core technical discipline?',
      difficulty: 'MEDIUM',
      origin: 'IKSHOVIA_CREATED',
      suggested_dimensions: [
        'Acknowledge value of analytical technical training',
        'Demonstrate genuine intellectual curiosity towards governance & society',
        'Avoid dismissing technical education; emphasize synergy between technology and public policy'
      ]
    },
    {
      id: 'iq_state_bihar_migration',
      exam: 'BPSC',
      category: 'STATE',
      topic: 'Regional Development & Migration in Bihar',
      question: 'Despite significant investments in physical infrastructure like roads and bridges, outward migration of labor and youth from Bihar persists. As an administrative officer, what specific structural economic shifts would you prioritize?',
      difficulty: 'HARD',
      origin: 'IKSHOVIA_CREATED',
      suggested_dimensions: [
        'Distinguish distress seasonal migration from voluntary opportunity seeking',
        'Agro-processing industries (makhana, litchi, maize clusters)',
        'Vocational training aligned with modern industrial demands',
        'Services and IT ecosystem in Tier-2 cities like Patna and Muzaffarpur'
      ]
    },
    {
      id: 'iq_gov_civil_service_neutrality',
      exam: 'UPSC',
      category: 'GOVERNANCE',
      topic: 'Civil Service Neutrality vs Commitment to Welfare',
      question: 'There is an ongoing debate between "neutral civil services" and "committed bureaucracy". How do you resolve this apparent contradiction when a political executive urges rapid policy implementation that skirts established procedural protocols?',
      difficulty: 'HARD',
      origin: 'IKSHOVIA_CREATED',
      suggested_dimensions: [
        'Distinguish commitment to political ideology vs commitment to Constitutional values',
        'Duty to tender frank and fearless advice in writing',
        'Executing lawful political mandates with administrative diligence',
        'Institutional safeguards under Article 311 and Conduct Rules'
      ]
    },
    {
      id: 'iq_sit_protest_highway',
      exam: 'UPSC',
      category: 'SITUATIONAL',
      topic: 'Law & Order vs Democratic Dissent',
      question: 'A group of farmers has blockaded a major national highway passing through your district demanding loan waivers. The blockade is cutting off medical oxygen and emergency supplies to hospitals in an adjacent city. How will you resolve this situation within 4 hours?',
      difficulty: 'HARD',
      origin: 'IKSHOVIA_CREATED',
      suggested_dimensions: [
        'Immediate prioritization of life-saving green corridor for emergency supplies',
        'Empathetic direct negotiation with community leaders at the spot',
        'Designation of an alternative authorized protest site',
        'Minimal graduated use of force only as an absolute last resort'
      ]
    },
    {
      id: 'iq_econ_freebies_vs_welfare',
      exam: 'UPSC',
      category: 'ECONOMY',
      topic: 'Fiscal Health vs Targeted Welfare',
      question: 'Where would you draw the boundary between legitimate merit-good public welfare and economically unsustainable electoral populist sops ("freebies")?',
      difficulty: 'MEDIUM',
      origin: 'IKSHOVIA_CREATED',
      suggested_dimensions: [
        'Productive capital expenditure vs revenue subsidy consumption',
        'Health, education, nutrition, and basic shelter as fundamental human capital investments',
        'Fiscal Responsibility and Budget Management (FRBM) constraints',
        'Independent fiscal council or transparency in state balance sheet liabilities'
      ]
    }
  ];

  for (const iq of interviewQuestions) {
    await pool.query(`
      INSERT INTO public.interview_questions (
        id, exam, category, topic, question, difficulty, origin, suggested_dimensions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        category = EXCLUDED.category,
        topic = EXCLUDED.topic,
        question = EXCLUDED.question,
        difficulty = EXCLUDED.difficulty,
        suggested_dimensions = EXCLUDED.suggested_dimensions;
    `, [
      iq.id, iq.exam, iq.category, iq.topic, iq.question, iq.difficulty, iq.origin,
      JSON.stringify(iq.suggested_dimensions || [])
    ]);
  }

  console.log('[Seed] Canonical Mains & Interview questions seeded successfully.');
}
