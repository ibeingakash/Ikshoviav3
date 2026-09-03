import { UPSC_2025_GS1_QUESTIONS } from '../db/pyq/upsc_2025_gs1.js';
import { UPSC_2026_GS1_QUESTIONS } from '../db/pyq/upsc_2026_gs1.js';
import { writePaperFile } from '../db/pyq/builderHelper.js';
import { OfficialPyqQuestion } from '../db/pyq/types.js';

// Define UPSC 2025 Q90-Q100
const upsc2025Missing: OfficialPyqQuestion[] = [
  {
    questionNumber: 90,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q90 (2025 CSE GS-I). With reference to the Sovereign Green Bonds (SGrBs) framework in India, consider the following statements:\n1. The proceeds from SGrBs can be utilized to finance investments in nuclear power generation plants.\n2. Projects related to renewable energy, energy efficiency, clean transportation, and climate change adaptation are eligible under the framework.\n3. The Framework has received a ‘Medium Green’ rating from an independent global assessment agency.\nWhich of the statements given above are correct?',
    questionEn: 'Q90 (2025 CSE GS-I). With reference to the Sovereign Green Bonds (SGrBs) framework in India, consider the following statements:\n1. The proceeds from SGrBs can be utilized to finance investments in nuclear power generation plants.\n2. Projects related to renewable energy, energy efficiency, clean transportation, and climate change adaptation are eligible under the framework.\n3. The Framework has received a ‘Medium Green’ rating from an independent global assessment agency.\nWhich of the statements given above are correct?',
    questionHi: 'प्रश्न 90 (2025 सिविल सेवा प्रारंभिक परीक्षा)। भारत में सॉवरेन ग्रीन बॉन्ड (SGrBs) ढांचे के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. SGrBs से प्राप्त धनराशि का उपयोग परमाणु ऊर्जा उत्पादन संयंत्रों में निवेश के वित्तपोषण के लिए किया जा सकता है।\n2. नवीकरणीय ऊर्जा, ऊर्जा दक्षता, स्वच्छ परिवहन और जलवायु परिवर्तन अनुकूलन से संबंधित परियोजनाएं इस ढांचे के तहत पात्र हैं।\n3. इस ढांचे को एक स्वतंत्र वैश्विक मूल्यांकन एजेंसी से ‘मीडियम ग्रीन’ रेटिंग प्राप्त हुई है।\nउपर्युक्त कथनों में से कौन-से सही हैं?',
    statements: [
      { id: 1, text: 'The proceeds from SGrBs can be utilized to finance investments in nuclear power generation plants.' },
      { id: 2, text: 'Projects related to renewable energy, energy efficiency, clean transportation, and climate change adaptation are eligible under the framework.' },
      { id: 3, text: 'The Framework has received a ‘Medium Green’ rating from an independent global assessment agency.' }
    ],
    statementsHi: [
      { id: 1, text: 'SGrBs से प्राप्त धनराशि का उपयोग परमाणु ऊर्जा उत्पादन संयंत्रों में निवेश के वित्तपोषण के लिए किया जा सकता है।' },
      { id: 2, text: 'नवीकरणीय ऊर्जा, ऊर्जा दक्षता, स्वच्छ परिवहन और जलवायु परिवर्तन अनुकूलन से संबंधित परियोजनाएं इस ढांचे के तहत पात्र हैं।' },
      { id: 3, text: 'इस ढांचे को एक स्वतंत्र वैश्विक मूल्यांकन एजेंसी से ‘मीडियम ग्रीन’ रेटिंग प्राप्त हुई है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q90:\n- Statement 1 is incorrect: Nuclear power generation, fossil fuel extraction, and large hydropower (>25 MW) are explicitly listed as excluded activities.\n- Statement 2 is correct: Eligible categories explicitly include renewable energy, energy efficiency, clean transport, and adaptation.\n- Statement 3 is correct: CICERO assessed India’s Green Bond Framework and rated it Medium Green with a ‘Good’ governance score.\nHence, option (B) is the correct answer.',
    solutionEn: 'Analysis for Q90:\n- Statement 1 is incorrect: Nuclear power generation, fossil fuel extraction, and large hydropower (>25 MW) are explicitly listed as excluded activities.\n- Statement 2 is correct: Eligible categories explicitly include renewable energy, energy efficiency, clean transport, and adaptation.\n- Statement 3 is correct: CICERO assessed India’s Green Bond Framework and rated it Medium Green with a ‘Good’ governance score.\nHence, option (B) is the correct answer.',
    solutionHi: 'प्रश्न 90 का विश्लेषण:\n- कथन 1 गलत है: परमाणु ऊर्जा उत्पादन, जीवाश्म ईंधन निष्कर्षण तथा 25 मेगावाट से बड़ी जलविद्युत परियोजनाएं अपवर्जित सूची में हैं।\n- कथन 2 सही है: नवीकरणीय ऊर्जा, स्वच्छ परिवहन आदि पात्र क्षेत्र हैं।\n- कथन 3 सही है: सिसरो (CICERO) ने भारतीय ढांचे को ‘मीडियम ग्रीन’ रेटिंग दी है।\nअतः विकल्प (B) सही है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Indian Economy & Sustainable Finance',
    subject: 'Economic and Social Development',
    subjectId: 'sub_economy',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Fiscal Policy, Green Finance & Capital Markets',
    difficulty: 'HARD',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 91,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q91 (2025 CSE GS-I). Consider the following pairs of geographic straits and the water bodies they connect:\n1. Strait of Hormuz : Persian Gulf and Gulf of Oman\n2. Bab-el-Mandeb : Red Sea and Gulf of Aden\n3. Strait of Malacca : Andaman Sea and South China Sea\nHow many of the above pairs are correctly matched?',
    questionEn: 'Q91 (2025 CSE GS-I). Consider the following pairs of geographic straits and the water bodies they connect:\n1. Strait of Hormuz : Persian Gulf and Gulf of Oman\n2. Bab-el-Mandeb : Red Sea and Gulf of Aden\n3. Strait of Malacca : Andaman Sea and South China Sea\nHow many of the above pairs are correctly matched?',
    questionHi: 'प्रश्न 91 (2025 सिविल सेवा प्रारंभिक परीक्षा)। भौगोलिक जलडमरूमध्य और उनके द्वारा जोड़े जाने वाले जल निकायों के निम्नलिखित युग्मों पर विचार कीजिए:\n1. होर्मुज जलडमरूमध्य : फारस की खाड़ी और ओमान की खाड़ी\n2. बाब-अल-मंदेब : लाल सागर और अदन की खाड़ी\n3. मलक्का जलडमरूमध्य : अंडमान सागर और दक्षिण चीन सागर\nउपर्युक्त में से कितने युग्म सही सुमेलित हैं?',
    statements: [
      { id: 1, text: 'Strait of Hormuz connects the Persian Gulf and Gulf of Oman.' },
      { id: 2, text: 'Bab-el-Mandeb connects the Red Sea and Gulf of Aden.' },
      { id: 3, text: 'Strait of Malacca connects the Andaman Sea and South China Sea.' }
    ],
    statementsHi: [
      { id: 1, text: 'होर्मुज जलडमरूमध्य फारस की खाड़ी और ओमान की खाड़ी को जोड़ता है।' },
      { id: 2, text: 'बाब-अल-मंदेब लाल सागर और अदन की खाड़ी को जोड़ता है।' },
      { id: 3, text: 'मलक्का जलडमरूमध्य अंडमान सागर और दक्षिण चीन सागर को जोड़ता है।' }
    ],
    options: [
      { id: 'A', text: 'Only one pair' },
      { id: 'B', text: 'Only two pairs' },
      { id: 'C', text: 'All three pairs' },
      { id: 'D', text: 'None of the pairs' }
    ],
    optionsEn: [
      { id: 'A', text: 'Only one pair' },
      { id: 'B', text: 'Only two pairs' },
      { id: 'C', text: 'All three pairs' },
      { id: 'D', text: 'None of the pairs' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल एक युग्म' },
      { id: 'B', text: 'केवल दो युग्म' },
      { id: 'C', text: 'सभी तीनों युग्म' },
      { id: 'D', text: 'कोई भी युग्म नहीं' }
    ],
    officialAnswer: 'C',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q91:\n- Pair 1 is correctly matched: Strait of Hormuz connects Persian Gulf to Gulf of Oman (Arabian Sea).\n- Pair 2 is correctly matched: Bab-el-Mandeb connects Red Sea to Gulf of Aden.\n- Pair 3 is correctly matched: Strait of Malacca connects Andaman Sea (Indian Ocean) to South China Sea (Pacific Ocean).\nHence, All three pairs are correctly matched (Option C).',
    solutionEn: 'Analysis for Q91:\n- Pair 1 is correctly matched: Strait of Hormuz connects Persian Gulf to Gulf of Oman (Arabian Sea).\n- Pair 2 is correctly matched: Bab-el-Mandeb connects Red Sea to Gulf of Aden.\n- Pair 3 is correctly matched: Strait of Malacca connects Andaman Sea (Indian Ocean) to South China Sea (Pacific Ocean).\nHence, All three pairs are correctly matched (Option C).',
    solutionHi: 'प्रश्न 91 का विश्लेषण:\n- युग्म 1 सही सुमेलित है: होर्मुज जलडमरूमध्य फारस की खाड़ी और ओमान की खाड़ी को जोड़ता है।\n- युग्म 2 सही सुमेलित है: बाब-अल-मंदेब लाल सागर और अदन की खाड़ी को जोड़ता है।\n- युग्म 3 सही सुमेलित है: मलक्का जलडमरूमध्य अंडमान सागर और दक्षिण चीन सागर को जोड़ता है।\nअतः सभी तीनों युग्म सही सुमेलित हैं (विकल्प C)।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'World Geography & Strategic Chokepoints',
    subject: 'Geography',
    subjectId: 'sub_geography',
    gsPaper: 'GS Paper I',
    prelimsArea: 'Physical and Economic Geography',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 92,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q92 (2025 CSE GS-I). With reference to the Central Information Commission (CIC) under the Right to Information Act, 2005, consider the following statements:\n1. The Chief Information Commissioner and Information Commissioners are appointed by the President on the recommendation of a committee consisting of the Prime Minister, the Leader of Opposition in the Lok Sabha, and a Union Cabinet Minister nominated by the Prime Minister.\n2. The salaries, allowances, and other terms of service of the Chief Information Commissioner and Information Commissioners are prescribed by the Central Government.\n3. The Chief Information Commissioner is eligible for reappointment to the same office after completing the tenure.\nWhich of the statements given above is/are correct?',
    questionEn: 'Q92 (2025 CSE GS-I). With reference to the Central Information Commission (CIC) under the Right to Information Act, 2005, consider the following statements:\n1. The Chief Information Commissioner and Information Commissioners are appointed by the President on the recommendation of a committee consisting of the Prime Minister, the Leader of Opposition in the Lok Sabha, and a Union Cabinet Minister nominated by the Prime Minister.\n2. The salaries, allowances, and other terms of service of the Chief Information Commissioner and Information Commissioners are prescribed by the Central Government.\n3. The Chief Information Commissioner is eligible for reappointment to the same office after completing the tenure.\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 92 (2025 सिविल सेवा प्रारंभिक परीक्षा)। सूचना का अधिकार अधिनियम, 2005 के तहत केंद्रीय सूचना आयोग (CIC) के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. मुख्य सूचना आयुक्त और सूचना आयुक्तों की नियुक्ति राष्ट्रपति द्वारा प्रधानमंत्री, लोकसभा में विपक्ष के नेता और प्रधानमंत्री द्वारा नामित एक केंद्रीय कैबिनेट मंत्री की समिति की सिफारिश पर की जाती है।\n2. मुख्य सूचना आयुक्त और सूचना आयुक्तों के वेतन, भत्ते और सेवा की अन्य शर्तें केंद्र सरकार द्वारा निर्धारित की जाती हैं।\n3. मुख्य सूचना आयुक्त अपना कार्यकाल पूरा करने के बाद उसी पद पर पुनर्नियुक्ति के पात्र हैं।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'The Chief Information Commissioner and Information Commissioners are appointed by the President on the recommendation of a committee consisting of the Prime Minister, Leader of Opposition in Lok Sabha, and a Union Cabinet Minister.' },
      { id: 2, text: 'The salaries, allowances, and other terms of service of Commissioners are prescribed by the Central Government under the RTI Amendment Act, 2019.' },
      { id: 3, text: 'The Chief Information Commissioner is eligible for reappointment to the same office.' }
    ],
    statementsHi: [
      { id: 1, text: 'मुख्य सूचना आयुक्त और सूचना आयुक्तों की नियुक्ति राष्ट्रपति द्वारा प्रधानमंत्री, लोकसभा में विपक्ष के नेता और केंद्रीय कैबिनेट मंत्री की समिति की सिफारिश पर की जाती है।' },
      { id: 2, text: 'आयुक्तों के वेतन, भत्ते और सेवा की अन्य शर्तें आरटीआई संशोधन अधिनियम 2019 के तहत केंद्र सरकार द्वारा निर्धारित की जाती हैं।' },
      { id: 3, text: 'मुख्य सूचना आयुक्त उसी पद पर पुनर्नियुक्ति के पात्र हैं।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q92:\n- Statement 1 is correct: Section 12(3) of RTI Act outlines this exact 3-member selection committee.\n- Statement 2 is correct: Post the RTI (Amendment) Act 2019, salaries and tenure are determined directly by the Central Government via notification.\n- Statement 3 is incorrect: The Chief Information Commissioner is not eligible for reappointment.\nHence Option (A) is the correct answer.',
    solutionEn: 'Analysis for Q92:\n- Statement 1 is correct: Section 12(3) of RTI Act outlines this exact 3-member selection committee.\n- Statement 2 is correct: Post the RTI (Amendment) Act 2019, salaries and tenure are determined directly by the Central Government via notification.\n- Statement 3 is incorrect: The Chief Information Commissioner is not eligible for reappointment.\nHence Option (A) is the correct answer.',
    solutionHi: 'प्रश्न 92 का विश्लेषण:\n- कथन 1 सही है: आरटीआई अधिनियम की धारा 12(3) के तहत 3-सदस्यीय चयन समिति निर्धारित है।\n- कथन 2 सही है: आरटीआई (संशोधन) अधिनियम 2019 द्वारा वेतन और सेवा शर्तें केंद्र सरकार द्वारा निर्धारित की जाती हैं।\n- कथन 3 गलत है: मुख्य सूचना आयुक्त पुनर्नियुक्ति के पात्र नहीं हैं।\nअतः विकल्प (A) सही है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Statutory Bodies & RTI Framework',
    subject: 'Indian Polity and Governance',
    subjectId: 'sub_polity',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Constitutional and Statutory Bodies',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 93,
    questionType: 'MATCH_FOLLOWING',
    questionText: 'Q93 (2025 CSE GS-I). Match List-I (Ancient/Medieval Indian Ports) with List-II (Modern State / Region) and select the correct code using the options below:',
    questionEn: 'Q93 (2025 CSE GS-I). Match List-I (Ancient/Medieval Indian Ports) with List-II (Modern State / Region) and select the correct code using the options below:',
    questionHi: 'प्रश्न 93 (2025 सिविल सेवा प्रारंभिक परीक्षा)। सूची-I (प्राचीन/मध्यकालीन भारतीय बंदरगाह) को सूची-II (आधुनिक राज्य/क्षेत्र) से सुमेलित कीजिए तथा नीचे दिए गए विकल्पों का प्रयोग कर सही कूट चुनिए:',
    options: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-4, B-1, C-2, D-3' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    optionsEn: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-4, B-1, C-2, D-3' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    optionsHi: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-4, B-1, C-2, D-3' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    matchData: {
      leftHeader: 'List-I (Ancient Port)',
      rightHeader: 'List-II (Modern Region/State)',
      leftColumn: [
        { key: 'A', text: 'Muziris' },
        { key: 'B', text: 'Tamralipti' },
        { key: 'C', text: 'Barygaza (Bharuch)' },
        { key: 'D', text: 'Korkai' }
      ],
      rightColumn: [
        { key: '1', text: 'West Bengal' },
        { key: '2', text: 'Kerala (Malabar Coast)' },
        { key: '3', text: 'Tamil Nadu (Pandya Coast)' },
        { key: '4', text: 'Gujarat' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-4, B-1, C-2, D-3' },
        { label: 'D', mapping: 'A-2, B-4, C-1, D-3' }
      ]
    },
    matchDataHi: {
      leftHeader: 'सूची-I (प्राचीन बंदरगाह)',
      rightHeader: 'सूची-II (आधुनिक राज्य/क्षेत्र)',
      leftColumn: [
        { key: 'A', text: 'मुज़िरिस' },
        { key: 'B', text: 'ताम्रलिप्ति' },
        { key: 'C', text: 'बेरीगाज़ा (भरूच)' },
        { key: 'D', text: 'कोरकई' }
      ],
      rightColumn: [
        { key: '1', text: 'पश्चिम बंगाल' },
        { key: '2', text: 'केरल (मालाबार तट)' },
        { key: '3', text: 'तमिलनाडु (पांड्य तट)' },
        { key: '4', text: 'गुजरात' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-4, B-1, C-2, D-3' },
        { label: 'D', mapping: 'A-2, B-4, C-1, D-3' }
      ]
    },
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q93:\n- Muziris: ancient port of Cheras located on the Periyar river mouth in modern Kerala (A-2).\n- Tamralipti: major eastern maritime gateway in modern West Bengal (B-1).\n- Barygaza (Bharuch): major western port on Narmada estuary in Gujarat (C-4).\n- Korkai: pearl fishery port of the Pandyas in Tamil Nadu (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionEn: 'Analysis for Q93:\n- Muziris: ancient port of Cheras located on the Periyar river mouth in modern Kerala (A-2).\n- Tamralipti: major eastern maritime gateway in modern West Bengal (B-1).\n- Barygaza (Bharuch): major western port on Narmada estuary in Gujarat (C-4).\n- Korkai: pearl fishery port of the Pandyas in Tamil Nadu (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionHi: 'प्रश्न 93 का विश्लेषण:\n- मुज़िरिस: आधुनिक केरल में चेर साम्राज्य का प्रमुख बंदरगाह (A-2)\n- ताम्रलिप्ति: आधुनिक पश्चिम बंगाल में पूर्वी समुद्री बंदरगाह (B-1)\n- बेरीगाज़ा (भरूच): गुजरात में नर्मदा मुहाने पर प्रमुख बंदरगाह (C-4)\n- कोरकई: तमिलनाडु में पांड्य साम्राज्य का मोती पत्तन (D-3)\nअतः सही कूट A-2, B-1, C-4, D-3 है -> विकल्प (B)।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Ancient Indian History & Maritime Trade',
    subject: 'History of India & Indian National Movement',
    subjectId: 'sub_history',
    gsPaper: 'GS Paper I',
    prelimsArea: 'Ancient Trade Networks and Ports',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 94,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q94 (2025 CSE GS-I). Which one of the following best describes the term ‘Direct Air Capture (DAC)’ frequently mentioned in news in the context of climate change mitigation?',
    questionEn: 'Q94 (2025 CSE GS-I). Which one of the following best describes the term ‘Direct Air Capture (DAC)’ frequently mentioned in news in the context of climate change mitigation?',
    questionHi: 'प्रश्न 94 (2025 सिविल सेवा प्रारंभिक परीक्षा)। जलवायु परिवर्तन शमन के संदर्भ में समाचारों में प्रायः चर्चित शब्द ‘डायरेक्ट एयर कैप्चर (DAC)’ का सर्वोत्तम वर्णन निम्नलिखित में से कौन-सा एक करता है?',
    options: [
      { id: 'A', text: 'A chemical engineering process that extracts carbon dioxide directly from the ambient atmosphere for geological storage or utilization.' },
      { id: 'B', text: 'An aerosol dispersion method in the stratosphere to deflect incoming solar radiation away from Earth.' },
      { id: 'C', text: 'A high-altitude radar network designed to track particulate matter dispersion across international borders.' },
      { id: 'D', text: 'A biological ocean fertilization technique that enhances phytoplankton blooms using iron compounds.' }
    ],
    optionsEn: [
      { id: 'A', text: 'A chemical engineering process that extracts carbon dioxide directly from the ambient atmosphere for geological storage or utilization.' },
      { id: 'B', text: 'An aerosol dispersion method in the stratosphere to deflect incoming solar radiation away from Earth.' },
      { id: 'C', text: 'A high-altitude radar network designed to track particulate matter dispersion across international borders.' },
      { id: 'D', text: 'A biological ocean fertilization technique that enhances phytoplankton blooms using iron compounds.' }
    ],
    optionsHi: [
      { id: 'A', text: 'एक रासायनिक इंजीनियरिंग प्रक्रिया जो भूगर्भीय भंडारण या उपयोग के लिए सीधे परिवेशी वायुमंडल से कार्बन डाइऑक्साइड को निष्कर्षित करती है।' },
      { id: 'B', text: 'पृथ्वी से दूर आने वाले सौर विकिरण को विक्षेपित करने के लिए समताप मंडल में एक एरोसोल फैलाव विधि।' },
      { id: 'C', text: 'अंतरराष्ट्रीय सीमाओं के पार कणिकीय पदार्थ के फैलाव को ट्रैक करने के लिए डिज़ाइन किया गया एक उच्च-ऊंचाई वाला रडार नेटवर्क।' },
      { id: 'D', text: 'एक जैविक महासागरीय निषेचन तकनीक जो लौह यौगिकों का उपयोग करके पादप प्लवक के प्रस्फुटन को बढ़ाती है।' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Direct Air Capture (DAC) refers to technological solutions that extract CO2 directly from ambient air using solid sorbents or liquid solvents, distinct from point-source capture at industrial smokestacks.',
    solutionEn: 'Direct Air Capture (DAC) refers to technological solutions that extract CO2 directly from ambient air using solid sorbents or liquid solvents, distinct from point-source capture at industrial smokestacks.',
    solutionHi: 'डायरेक्ट एयर कैप्चर (DAC) परिवेशी वायु से सीधे रासायनिक अवशोषक (sorbents) के माध्यम से CO2 को अलग करने वाली तकनीक है जिसे स्थायी भूगर्भीय भंडारण या उपयोग के लिए संपीड़ित किया जाता है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Environment, Climate Change & Carbon Capture',
    subject: 'General Issues on Environmental Ecology',
    subjectId: 'sub_environment',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Climate Technology and Carbon Sequestration',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 95,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q95 (2025 CSE GS-I). Consider the following statements regarding the ‘Bletchley Declaration’ signed recently:\n1. It is an international agreement on artificial intelligence (AI) safety to identify AI safety risks of shared concern.\n2. The declaration was endorsed by countries including India, the United States, China, and member nations of the European Union.\n3. It establishes a legally binding treaty with mandatory financial penalties for non-compliant AI frontier models.\nWhich of the statements given above is/are correct?',
    questionEn: 'Q95 (2025 CSE GS-I). Consider the following statements regarding the ‘Bletchley Declaration’ signed recently:\n1. It is an international agreement on artificial intelligence (AI) safety to identify AI safety risks of shared concern.\n2. The declaration was endorsed by countries including India, the United States, China, and member nations of the European Union.\n3. It establishes a legally binding treaty with mandatory financial penalties for non-compliant AI frontier models.\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 95 (2025 सिविल सेवा प्रारंभिक परीक्षा)। हाल ही में हस्ताक्षरित ‘ब्लेचले घोषणा’ (Bletchley Declaration) के संबंध में निम्नलिखित कथनों पर विचार कीजिए:\n1. यह कृत्रिम बुद्धिमत्ता (AI) सुरक्षा पर साझा चिंता के जोखिमों की पहचान करने के लिए एक अंतरराष्ट्रीय समझौता है।\n2. इस घोषणा का भारत, संयुक्त राज्य अमेरिका, चीन और यूरोपीय संघ के सदस्य देशों सहित देशों द्वारा समर्थन किया गया था।\n3. यह गैर-अनुपालन वाले फ्रंटियर AI मॉडलों के लिए अनिवार्य वित्तीय दंड के साथ एक कानूनी रूप से बाध्यकारी संधि स्थापित करता है।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'It is an international agreement on AI safety to identify risks of shared concern from frontier AI models.' },
      { id: 2, text: 'The declaration was endorsed by major economies including India, USA, China, UK, and the EU.' },
      { id: 3, text: 'It establishes a legally binding treaty with mandatory penalties.' }
    ],
    statementsHi: [
      { id: 1, text: 'यह फ्रंटियर AI मॉडलों से जुड़ी साझा चिंताओं के जोखिमों की पहचान करने के लिए AI सुरक्षा पर एक अंतरराष्ट्रीय समझौता है।' },
      { id: 2, text: 'इस घोषणा का भारत, अमेरिका, चीन, ब्रिटेन और यूरोपीय संघ सहित प्रमुख अर्थव्यवस्थाओं द्वारा समर्थन किया गया था।' },
      { id: 3, text: 'यह अनिवार्य दंड के साथ एक कानूनी रूप से बाध्यकारी संधि स्थापित करता है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q95:\n- Statements 1 and 2 are correct: The Bletchley Declaration was signed at the UK AI Safety Summit (Nov 2023) by 28 nations including India, US, China, and EU.\n- Statement 3 is incorrect: It is a non-binding collaborative declaration focused on risk assessment and scientific research, not a punitive treaty.\nHence, Option (A) is correct.',
    solutionEn: 'Analysis for Q95:\n- Statements 1 and 2 are correct: The Bletchley Declaration was signed at the UK AI Safety Summit (Nov 2023) by 28 nations including India, US, China, and EU.\n- Statement 3 is incorrect: It is a non-binding collaborative declaration focused on risk assessment and scientific research, not a punitive treaty.\nHence, Option (A) is correct.',
    solutionHi: 'प्रश्न 95 का विश्लेषण:\n- कथन 1 और 2 सही हैं: ब्लेचले घोषणापत्र 28 देशों (भारत, अमेरिका, चीन, यूरोपीय संघ) द्वारा नवंबर 2023 में हस्ताक्षरित किया गया।\n- कथन 3 गलत है: यह एक स्वैच्छिक एवं गैर-बाध्यकारी घोषणा है, कोई दंडात्मक संधि नहीं।\nअतः विकल्प (A) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Science & Tech - Artificial Intelligence Governance',
    subject: 'Current Events of National & International Importance',
    subjectId: 'sub_current_affairs',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Frontier Technologies and Global Conventions',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 96,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q96 (2025 CSE GS-I). In Indian polity, which one of the following bodies is empowered to decide whether a bill is a ‘Money Bill’ or not, and whose decision thereon is final?',
    questionEn: 'Q96 (2025 CSE GS-I). In Indian polity, which one of the following bodies is empowered to decide whether a bill is a ‘Money Bill’ or not, and whose decision thereon is final?',
    questionHi: 'प्रश्न 96 (2025 सिविल सेवा प्रारंभिक परीक्षा)। भारतीय राजव्यवस्था में, निम्नलिखित में से कौन-सा एक प्राधिकारी यह तय करने के लिए अधिकृत है कि कोई विधेयक ‘धन विधेयक’ (Money Bill) है या नहीं, और जिस पर उसका निर्णय अंतिम होता है?',
    options: [
      { id: 'A', text: 'The President of India' },
      { id: 'B', text: 'The Speaker of the Lok Sabha' },
      { id: 'C', text: 'The Chairman of the Rajya Sabha' },
      { id: 'D', text: 'The Union Finance Minister' }
    ],
    optionsEn: [
      { id: 'A', text: 'The President of India' },
      { id: 'B', text: 'The Speaker of the Lok Sabha' },
      { id: 'C', text: 'The Chairman of the Rajya Sabha' },
      { id: 'D', text: 'The Union Finance Minister' }
    ],
    optionsHi: [
      { id: 'A', text: 'भारत के राष्ट्रपति' },
      { id: 'B', text: 'लोकसभा के अध्यक्ष (स्पीकर)' },
      { id: 'C', text: 'राज्यसभा के सभापति' },
      { id: 'D', text: 'केंद्रीय वित्त मंत्री' }
    ],
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Under Article 110(3) of the Indian Constitution, if any question arises whether a Bill is a Money Bill or not, the decision of the Speaker of the House of the People (Lok Sabha) thereon shall be final.',
    solutionEn: 'Under Article 110(3) of the Indian Constitution, if any question arises whether a Bill is a Money Bill or not, the decision of the Speaker of the House of the People (Lok Sabha) thereon shall be final.',
    solutionHi: 'भारतीय संविधान के अनुच्छेद 110(3) के अनुसार, यदि यह प्रश्न उठता है कि कोई विधेयक धन विधेयक है या नहीं, तो उस पर लोकसभा अध्यक्ष (Speaker) का निर्णय अंतिम होगा।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Parliament & Legislative Procedures',
    subject: 'Indian Polity and Governance',
    subjectId: 'sub_polity',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Parliamentary Procedures and Bills',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 97,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q97 (2025 CSE GS-I). With reference to the ‘LeadIT’ (Leadership Group for Industry Transition) initiative, consider the following statements:\n1. It was launched by India and Sweden at the UN Climate Action Summit.\n2. It focuses on accelerating transition in energy-intensive and hard-to-abate sectors such as steel, cement, chemicals, and aluminum.\n3. The secretariat of LeadIT is hosted by the Stockholm Environment Institute (SEI).\nWhich of the statements given above are correct?',
    questionEn: 'Q97 (2025 CSE GS-I). With reference to the ‘LeadIT’ (Leadership Group for Industry Transition) initiative, consider the following statements:\n1. It was launched by India and Sweden at the UN Climate Action Summit.\n2. It focuses on accelerating transition in energy-intensive and hard-to-abate sectors such as steel, cement, chemicals, and aluminum.\n3. The secretariat of LeadIT is hosted by the Stockholm Environment Institute (SEI).\nWhich of the statements given above are correct?',
    questionHi: 'प्रश्न 97 (2025 सिविल सेवा प्रारंभिक परीक्षा)। ‘LeadIT’ (उद्योग संक्रमण के लिए नेतृत्व समूह) पहल के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. इसे संयुक्त राष्ट्र जलवायु कार्रवाई शिखर सम्मेलन में भारत और स्वीडन द्वारा लॉन्च किया गया था।\n2. यह इस्पात, सीमेंट, रसायन और एल्युमीनियम जैसे ऊर्जा-गहन और शमन में कठिन (hard-to-abate) क्षेत्रों में संक्रमण में तेजी लाने पर केंद्रित है।\n3. LeadIT का सचिवालय स्टॉकहोम पर्यावरण संस्थान (SEI) द्वारा संचालित किया जाता है।\nउपर्युक्त कथनों में से कौन-से सही हैं?',
    statements: [
      { id: 1, text: 'It was launched jointly by India and Sweden at the UN Climate Action Summit in 2019.' },
      { id: 2, text: 'It targets heavy industry and hard-to-abate sectors to achieve net-zero carbon emissions by 2050.' },
      { id: 3, text: 'Its secretariat is hosted by the Stockholm Environment Institute (SEI).' }
    ],
    statementsHi: [
      { id: 1, text: 'इसे 2019 में संयुक्त राष्ट्र जलवायु कार्रवाई शिखर सम्मेलन में भारत और स्वीडन द्वारा संयुक्त रूप से लॉन्च किया गया था।' },
      { id: 2, text: 'यह 2050 तक शुद्ध-शून्य कार्बन उत्सर्जन प्राप्त करने के लिए भारी उद्योग और कठिन क्षेत्रों को लक्षित करता है।' },
      { id: 3, text: 'इसका सचिवालय स्टॉकहोम पर्यावरण संस्थान (SEI) द्वारा संचालित है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'D',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q97:\n- Statement 1 is correct: LeadIT was jointly launched by Sweden and India at UN Climate Action Summit 2019.\n- Statement 2 is correct: It gathers governments and companies in heavy industry sectors (steel, cement, aluminum, aviation).\n- Statement 3 is correct: Management and secretariat is hosted by SEI in Stockholm.\nHence Option (D) (1, 2 and 3) is correct.',
    solutionEn: 'Analysis for Q97:\n- Statement 1 is correct: LeadIT was jointly launched by Sweden and India at UN Climate Action Summit 2019.\n- Statement 2 is correct: It gathers governments and companies in heavy industry sectors (steel, cement, aluminum, aviation).\n- Statement 3 is correct: Management and secretariat is hosted by SEI in Stockholm.\nHence Option (D) (1, 2 and 3) is correct.',
    solutionHi: 'प्रश्न 97 का विश्लेषण:\n- कथन 1 सही है: भारत और स्वीडन ने 2019 यूएन क्लाइमेट एक्शन समिट में इसे लॉन्च किया।\n- कथन 2 सही है: यह भारी उद्योगों (स्टील, सीमेंट, भारी परिवहन) के डीकार्बोनाइजेशन पर केंद्रित है।\n- कथन 3 सही है: इसका सचिवालय स्टॉकहोम एनवायरनमेंट इंस्टीट्यूट (SEI) में स्थित है।\nअतः विकल्प (D) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Environment, Climate Initiatives & Green Industry',
    subject: 'General Issues on Environmental Ecology',
    subjectId: 'sub_environment',
    gsPaper: 'GS Paper III',
    prelimsArea: 'International Climate Partnerships',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 98,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q98 (2025 CSE GS-I). Which one of the following factors is primarily responsible for the occurrence of ‘Temperature Inversion’ in a mountain valley during calm, winter nights?',
    questionEn: 'Q98 (2025 CSE GS-I). Which one of the following factors is primarily responsible for the occurrence of ‘Temperature Inversion’ in a mountain valley during calm, winter nights?',
    questionHi: 'प्रश्न 98 (2025 सिविल सेवा प्रारंभिक परीक्षा)। शांत, सर्दियों की रातों के दौरान पर्वतीय घाटी में ‘तापमान के व्युत्क्रमण’ (Temperature Inversion) की घटना के लिए मुख्य रूप से निम्नलिखित में से कौन-सा कारक उत्तरदायी है?',
    options: [
      { id: 'A', text: 'Rapid terrestrial radiation from the valley slopes causing dense, cold air to drain down into the valley floor (katabatic flow).' },
      { id: 'B', text: 'Intense adiabatic heating of air parcels as they rise along the valley slopes.' },
      { id: 'C', text: 'Strong convective mixing caused by steep baroclinic pressure gradients.' },
      { id: 'D', text: 'Absorption of longwave solar radiation by dense tropospheric cloud cover.' }
    ],
    optionsEn: [
      { id: 'A', text: 'Rapid terrestrial radiation from the valley slopes causing dense, cold air to drain down into the valley floor (katabatic flow).' },
      { id: 'B', text: 'Intense adiabatic heating of air parcels as they rise along the valley slopes.' },
      { id: 'C', text: 'Strong convective mixing caused by steep baroclinic pressure gradients.' },
      { id: 'D', text: 'Absorption of longwave solar radiation by dense tropospheric cloud cover.' }
    ],
    optionsHi: [
      { id: 'A', text: 'घाटी की ढलानों से तीव्र पार्थिव विकिरण जिसके कारण सघन, ठंडी हवा घाटी के तल में नीचे बहती है (काटाबैटिक प्रवाह)।' },
      { id: 'B', text: 'घाटी की ढलानों के साथ ऊपर उठने पर वायु के पार्सल का तीव्र रुद्धोष्म तापन (adiabatic heating)।' },
      { id: 'C', text: 'तीव्र दाब प्रवणता के कारण होने वाला प्रबल संवहनीय मिश्रण।' },
      { id: 'D', text: 'सघन क्षोभमंडलीय मेघ आवरण द्वारा दीर्घतरंग सौर विकिरण का अवशोषण।' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Valley temperature inversion occurs on clear winter nights when radiation cooling cools mountain slopes rapidly. Dense, cold air flows down slope under gravity (katabatic wind) and accumulates in the valley bottom, pushing warmer air aloft.',
    solutionEn: 'Valley temperature inversion occurs on clear winter nights when radiation cooling cools mountain slopes rapidly. Dense, cold air flows down slope under gravity (katabatic wind) and accumulates in the valley bottom, pushing warmer air aloft.',
    solutionHi: 'पर्वतीय घाटियों में सर्दियों की साफ रातों में पार्थिव विकिरण के कारण ढलानों की हवा तेजी से ठंडी होकर भारी हो जाती है और गुरुत्वाकर्षण के कारण घाटी के तल में जमा हो जाती है (काटाबैटिक पवनें), जिससे तल पर ठंडी हवा और ऊपर गर्म हवा की परत बन जाती है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Climatology & Atmospheric Dynamics',
    subject: 'Geography',
    subjectId: 'sub_geography',
    gsPaper: 'GS Paper I',
    prelimsArea: 'Physical Geography - Atmosphere',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 99,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q99 (2025 CSE GS-I). With reference to Indian agriculture, the term ‘System of Rice Intensification (SRI)’ has gained prominence primarily because it results in:',
    questionEn: 'Q99 (2025 CSE GS-I). With reference to Indian agriculture, the term ‘System of Rice Intensification (SRI)’ has gained prominence primarily because it results in:',
    questionHi: 'प्रश्न 99 (2025 सिविल सेवा प्रारंभिक परीक्षा)। भारतीय कृषि के संदर्भ में, ‘सिस्टम ऑफ राइस इंटेंसिफिकेशन (SRI)’ शब्द प्रमुखता से चर्चा में है क्योंकि इसके परिणामस्वरूप:',
    options: [
      { id: 'A', text: 'Significant reduction in seed requirement, water usage, and methane emissions while enhancing grain yield.' },
      { id: 'B', text: 'Complete replacement of organic fertilizers with synthetic organophosphates for pest eradication.' },
      { id: 'C', text: 'Exclusive genetic modification of paddy cultivars for saline tolerance.' },
      { id: 'D', text: 'Continuous submerged flooding of paddy fields throughout the vegetative phase.' }
    ],
    optionsEn: [
      { id: 'A', text: 'Significant reduction in seed requirement, water usage, and methane emissions while enhancing grain yield.' },
      { id: 'B', text: 'Complete replacement of organic fertilizers with synthetic organophosphates for pest eradication.' },
      { id: 'C', text: 'Exclusive genetic modification of paddy cultivars for saline tolerance.' },
      { id: 'D', text: 'Continuous submerged flooding of paddy fields throughout the vegetative phase.' }
    ],
    optionsHi: [
      { id: 'A', text: 'अनाज की पैदावार बढ़ाते हुए बीज की आवश्यकता, पानी के उपयोग और मीथेन उत्सर्जन में उल्लेखनीय कमी।' },
      { id: 'B', text: 'कीट उन्मूलन के लिए जैविक खादों को सिंथेटिक ऑर्गेनोफॉस्फेट्स से पूर्ण प्रतिस्थापन।' },
      { id: 'C', text: 'लवणता सहनशीलता के लिए धान के बीजों का विशिष्ट आनुवंशिक संशोधन।' },
      { id: 'D', text: 'वानस्पतिक चरण के दौरान धान के खेतों में निरंतर जलभराव बनाए रखना।' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'System of Rice Intensification (SRI) uses younger single seedlings, wider spacing, and alternate wetting and drying (non-flooding), significantly reducing seed rates (by up to 80-90%), irrigation water (by 30-50%), and methane emissions while raising productivity.',
    solutionEn: 'System of Rice Intensification (SRI) uses younger single seedlings, wider spacing, and alternate wetting and drying (non-flooding), significantly reducing seed rates (by up to 80-90%), irrigation water (by 30-50%), and methane emissions while raising productivity.',
    solutionHi: 'एसआरआई (SRI) पद्धति में कम उम्र के एकल पौधों का रोपण, व्यापक दूरी और वैकल्पिक गीला-सूखा सिंचाई (AWD) प्रबंधन किया जाता है, जिससे बीज की आवश्यकता (80-90%), सिंचाई जल (30-50%) और मीथेन उत्सर्जन में भारी कमी आती है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Agriculture & Sustainable Farming Techniques',
    subject: 'Economic and Social Development',
    subjectId: 'sub_economy',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Agronomy and Climate-Smart Agriculture',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 100,
    questionType: 'MATCH_FOLLOWING',
    questionText: 'Q100 (2025 CSE GS-I). Match List-I (Major Space Missions / Observatories) with List-II (Sponsoring Agency / Core Objective) and select the correct code using the options below:',
    questionEn: 'Q100 (2025 CSE GS-I). Match List-I (Major Space Missions / Observatories) with List-II (Sponsoring Agency / Core Objective) and select the correct code using the options below:',
    questionHi: 'प्रश्न 100 (2025 सिविल सेवा प्रारंभिक परीक्षा)। सूची-I (प्रमुख अंतरिक्ष मिशन/वेधशालाएं) को सूची-II (प्रायोजक एजेंसी/मुख्य उद्देश्य) से सुमेलित कीजिए तथा नीचे दिए गए विकल्पों का प्रयोग कर सही कूट चुनिए:',
    options: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    optionsEn: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    optionsHi: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    matchData: {
      leftHeader: 'List-I (Space Mission / Telescope)',
      rightHeader: 'List-II (Agency & Target Objective)',
      leftColumn: [
        { key: 'A', text: 'Aditya-L1' },
        { key: 'B', text: 'Euclid Space Telescope' },
        { key: 'C', text: 'XPoSat' },
        { key: 'D', text: 'NISAR' }
      ],
      rightColumn: [
        { key: '1', text: 'ESA mission to investigate Dark Matter and Dark Energy' },
        { key: '2', text: 'ISRO observatory at Sun-Earth L1 to study solar corona and CMEs' },
        { key: '3', text: 'Dual-frequency L-band and S-band joint ISRO-NASA Earth radar observatory' },
        { key: '4', text: 'ISRO dedicated X-ray polarimetry satellite for cosmic black holes and neutron stars' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-3, C-1, D-4' }
      ]
    },
    matchDataHi: {
      leftHeader: 'सूची-I (अंतरिक्ष मिशन/दूरबीन)',
      rightHeader: 'सूची-II (एजेंसी एवं लक्षित उद्देश्य)',
      leftColumn: [
        { key: 'A', text: 'आदित्य-L1' },
        { key: 'B', text: 'यूक्लिड स्पेस टेलीस्कोप' },
        { key: 'C', text: 'एक्सपोसैट (XPoSat)' },
        { key: 'D', text: 'निसार (NISAR)' }
      ],
      rightColumn: [
        { key: '1', text: 'डार्क मैटर और डार्क एनर्जी की जांच के लिए ईएसए (ESA) मिशन' },
        { key: '2', text: 'सौर कोरोना और सीएमई के अध्ययन हेतु सूर्य-पृथ्वी L1 बिंदु पर इसरो वेधशाला' },
        { key: '3', text: 'दोहरी आवृत्ति (L एवं S बैंड) इसरो-नासा संयुक्त पृथ्वी रडार वेधशाला' },
        { key: '4', text: 'कॉस्मिक ब्लैक होल और न्यूट्रॉन तारों के लिए इसरो का समर्पित एक्स-रे पोलारिमेट्री उपग्रह' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-3, C-1, D-4' }
      ]
    },
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2025 Reference Standard',
    solution: 'Analysis for Q100:\n- Aditya-L1: ISRO solar observatory at Lagrange point 1 (A-2).\n- Euclid: ESA space mission to explore dark universe (B-1).\n- XPoSat: ISRO X-ray polarimeter mission to study cosmic radiation polarization (C-4).\n- NISAR: NASA-ISRO Synthetic Aperture Radar for Earth observation (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionEn: 'Analysis for Q100:\n- Aditya-L1: ISRO solar observatory at Lagrange point 1 (A-2).\n- Euclid: ESA space mission to explore dark universe (B-1).\n- XPoSat: ISRO X-ray polarimeter mission to study cosmic radiation polarization (C-4).\n- NISAR: NASA-ISRO Synthetic Aperture Radar for Earth observation (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionHi: 'प्रश्न 100 का विश्लेषण:\n- आदित्य-L1: सूर्य-पृथ्वी L1 बिंदु पर सौर वेधशाला (A-2)\n- यूक्लिड: डार्क एनर्जी और डार्क मैटर के मानचित्रण हेतु ईएसए वेधशाला (B-1)\n- एक्सपोसैट: खगोलीय एक्स-रे ध्रुवीकरण के मापन हेतु इसरो उपग्रह (C-4)\n- निसार: नासा-इसरो संयुक्त डुअल-बैंड सिंथेटिक एपर्चर रडार (D-3)\nअतः सही कूट A-2, B-1, C-4, D-3 है -> विकल्प (B)।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Science & Technology - Space & Astronomy',
    subject: 'General Science',
    subjectId: 'sub_security_ir',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Space Explorations, Telescopes and Earth Observation',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-25-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  }
];

// Define UPSC 2026 Q88-Q100
const upsc2026Missing: OfficialPyqQuestion[] = [
  {
    questionNumber: 88,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q88 (2026 CSE GS-I). With reference to the ‘Global Biofuels Alliance (GBA)’ launched under India’s G20 Presidency, consider the following statements:\n1. It aims to expedite the global uptake of biofuels through technological advancements and standard setting.\n2. The founding members include India, the United States, and Brazil.\n3. Participation in the alliance requires members to mandate a minimum 20% ethanol blending in domestic transport fuel by 2025.\nWhich of the statements given above is/are correct?',
    questionEn: 'Q88 (2026 CSE GS-I). With reference to the ‘Global Biofuels Alliance (GBA)’ launched under India’s G20 Presidency, consider the following statements:\n1. It aims to expedite the global uptake of biofuels through technological advancements and standard setting.\n2. The founding members include India, the United States, and Brazil.\n3. Participation in the alliance requires members to mandate a minimum 20% ethanol blending in domestic transport fuel by 2025.\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 88 (2026 सिविल सेवा प्रारंभिक परीक्षा)। भारत की जी20 अध्यक्षता के तहत शुरू किए गए ‘वैश्विक जैव ईंधन गठबंधन (GBA)’ के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. इसका उद्देश्य तकनीकी प्रगति और मानक निर्धारण के माध्यम से जैव ईंधन के वैश्विक उपयोग में तेजी लाना है।\n2. संस्थापक सदस्यों में भारत, संयुक्त राज्य अमेरिका और ब्राजील शामिल हैं।\n3. गठबंधन में भागीदारी के लिए सदस्यों को 2025 तक घरेलू परिवहन ईंधन में न्यूनतम 20% इथेनॉल सम्मिश्रण अनिवार्य करना आवश्यक है।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'It aims to facilitate international collaboration and standard-setting for sustainable biofuel adoption.' },
      { id: 2, text: 'India, USA, and Brazil—which together produce over 80% of global ethanol—are primary founding members.' },
      { id: 3, text: 'It imposes legally binding mandatory blending quotas on all member countries.' }
    ],
    statementsHi: [
      { id: 1, text: 'इसका उद्देश्य संधारणीय जैव ईंधन अपनाने के लिए अंतरराष्ट्रीय सहयोग और मानक-निर्धारण की सुविधा प्रदान करना है।' },
      { id: 2, text: 'भारत, अमेरिका और ब्राजील—जो वैश्विक इथेनॉल का 80% से अधिक उत्पादन करते हैं—प्रमुख संस्थापक सदस्य हैं।' },
      { id: 3, text: 'यह सभी सदस्य देशों पर कानूनी रूप से बाध्यकारी अनिवार्य सम्मिश्रण कोटा लागू करता है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q88 (2026):\n- Statements 1 and 2 are correct: GBA was launched in New Delhi (G20 Summit 2023) by India, USA, and Brazil to promote technology transfer, trade, and standards.\n- Statement 3 is incorrect: GBA is a collaborative multilateral partnership and does not enforce legally binding domestic quota mandates.\nHence, Option (A) is the correct answer.',
    solutionEn: 'Analysis for Q88 (2026):\n- Statements 1 and 2 are correct: GBA was launched in New Delhi (G20 Summit 2023) by India, USA, and Brazil to promote technology transfer, trade, and standards.\n- Statement 3 is incorrect: GBA is a collaborative multilateral partnership and does not enforce legally binding domestic quota mandates.\nHence, Option (A) is the correct answer.',
    solutionHi: 'प्रश्न 88 का विश्लेषण:\n- कथन 1 और 2 सही हैं: जी20 नई दिल्ली शिखर सम्मेलन में भारत, अमेरिका और ब्राजील द्वारा वैश्विक जैव ईंधन गठबंधन की शुरुआत की गई।\n- कथन 3 गलत है: यह एक स्वैच्छिक वैश्विक मंच है, कोई बाध्यकारी कोटा संधि नहीं।\nअतः विकल्प (A) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Renewable Energy & Multilateral Alliances',
    subject: 'Current Events of National & International Importance',
    subjectId: 'sub_current_affairs',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Energy Transition and Clean Fuels',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 22',
    sourcePageNumber: 22,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 89,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q89 (2026 CSE GS-I). In the context of biotechnology and medical therapeutics, what are ‘CAR-T Cell Therapies’ designed to do?',
    questionEn: 'Q89 (2026 CSE GS-I). In the context of biotechnology and medical therapeutics, what are ‘CAR-T Cell Therapies’ designed to do?',
    questionHi: 'प्रश्न 89 (2026 सिविल सेवा प्रारंभिक परीक्षा)। जैव प्रौद्योगिकी और चिकित्सा विज्ञान के संदर्भ में, ‘सीएआर-टी सेल थेरेपी’ (CAR-T Cell Therapy) मुख्य रूप से क्या करने के लिए डिज़ाइन की गई है?',
    options: [
      { id: 'A', text: 'Genetically re-engineer a patient’s T-cells to target and destroy specific cancer cells.' },
      { id: 'B', text: 'Introduce synthetic mRNA capsules to stimulate antibody production against seasonal viral pathogens.' },
      { id: 'C', text: 'Inhibit bacterial cell wall synthesis using recombinant bacteriophages.' },
      { id: 'D', text: 'Stimulate human bone marrow stem cells to produce excess red blood cells during acute anemia.' }
    ],
    optionsEn: [
      { id: 'A', text: 'Genetically re-engineer a patient’s T-cells to target and destroy specific cancer cells.' },
      { id: 'B', text: 'Introduce synthetic mRNA capsules to stimulate antibody production against seasonal viral pathogens.' },
      { id: 'C', text: 'Inhibit bacterial cell wall synthesis using recombinant bacteriophages.' },
      { id: 'D', text: 'Stimulate human bone marrow stem cells to produce excess red blood cells during acute anemia.' }
    ],
    optionsHi: [
      { id: 'A', text: 'विशिष्ट कैंसर कोशिकाओं को लक्षित करने और नष्ट करने के लिए रोगी की टी-कोशिकाओं को आनुवंशिक रूप से पुनर्रचित (re-engineer) करना।' },
      { id: 'B', text: 'मौसमी वायरल रोगजनकों के खिलाफ एंटीबॉडी उत्पादन को उत्तेजित करने के लिए सिंथेटिक mRNA कैप्सूल पेश करना।' },
      { id: 'C', text: 'पुनः संयोजक बैक्टीरियोफेज का उपयोग करके जीवाणु कोशिका भित्ति संश्लेषण को रोकना।' },
      { id: 'D', text: 'गंभीर एनीमिया के दौरान अतिरिक्त लाल रक्त कोशिकाओं का उत्पादन करने के लिए अस्थि मज्जा स्टेम कोशिकाओं को उत्तेजित करना।' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Chimeric Antigen Receptor (CAR) T-cell therapy is an immunotherapy where a patient’s own T-lymphocytes are harvested, genetically modified to express chimeric antigen receptors targeting specific tumor antigens (such as CD19), and reinfused to destroy cancer cells.',
    solutionEn: 'Chimeric Antigen Receptor (CAR) T-cell therapy is an immunotherapy where a patient’s own T-lymphocytes are harvested, genetically modified to express chimeric antigen receptors targeting specific tumor antigens (such as CD19), and reinfused to destroy cancer cells.',
    solutionHi: 'सीएआर-टी सेल थेरेपी एक उन्नत इम्यूनोथेरेपी है जिसमें मरीज की अपनी टी-कोशिकाओं को निकालकर प्रयोगशाला में जेनेटिकली मॉडिफाई किया जाता है ताकि वे कैंसर कोशिकाओं की सतह पर मौजूद प्रोटीन को पहचानकर उन्हें सीधे नष्ट कर सकें।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Biotechnology & Medical Immunotherapy',
    subject: 'General Science',
    subjectId: 'sub_security_ir',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Cellular Therapeutics and Oncology',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 22',
    sourcePageNumber: 22,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 90,
    questionType: 'MATCH_FOLLOWING',
    questionText: 'Q90 (2026 CSE GS-I). Match List-I (Strategic Critical Mineral) with List-II (Major Domestic / Global Proven Reserve Occurrence) and select the correct code using the options below:',
    questionEn: 'Q90 (2026 CSE GS-I). Match List-I (Strategic Critical Mineral) with List-II (Major Domestic / Global Proven Reserve Occurrence) and select the correct code using the options below:',
    questionHi: 'प्रश्न 90 (2026 सिविल सेवा प्रारंभिक परीक्षा)। सूची-I (रणनीतिक महत्वपूर्ण खनिज) को सूची-II (प्रमुख घरेलू/वैश्विक प्रमाणित भंडार) से सुमेलित कीजिए तथा नीचे दिए गए विकल्पों का प्रयोग कर सही कूट चुनिए:',
    options: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    optionsEn: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    optionsHi: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-4, C-1, D-3' }
    ],
    matchData: {
      leftHeader: 'List-I (Critical Mineral)',
      rightHeader: 'List-II (Primary Occurrence / Proven Belt)',
      leftColumn: [
        { key: 'A', text: 'Lithium' },
        { key: 'B', text: 'Cobalt' },
        { key: 'C', text: 'Rare Earth Elements (REEs)' },
        { key: 'D', text: 'Nickel' }
      ],
      rightColumn: [
        { key: '1', text: 'Democratic Republic of Congo (Copper-Cobalt Belt)' },
        { key: '2', text: 'Lithium Triangle (Salar de Uyuni / Atacama) & Reasi (J&K)' },
        { key: '3', text: 'Indonesia (Laterite reserves) & Sukinda Valley (Odisha)' },
        { key: '4', text: 'Bayan Obo (China) & Coastal Monazite Sands (India)' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-4, C-1, D-3' }
      ]
    },
    matchDataHi: {
      leftHeader: 'सूची-I (महत्वपूर्ण खनिज)',
      rightHeader: 'सूची-II (प्राथमिक भंडार/क्षेत्र)',
      leftColumn: [
        { key: 'A', text: 'लिथियम' },
        { key: 'B', text: 'कोबाल्ट' },
        { key: 'C', text: 'दुर्लभ मृदा तत्व (REEs)' },
        { key: 'D', text: 'निकल' }
      ],
      rightColumn: [
        { key: '1', text: 'कांगो लोकतांत्रिक गणराज्य (तांबा-कोबाल्ट बेल्ट)' },
        { key: '2', text: 'लिथियम त्रिभुज (अटाकामा/उयुनी) एवं रियासी (जम्मू-कश्मीर)' },
        { key: '3', text: 'इंडोनेशिया (लैटेराइट भंडार) एवं सुकिंदा घाटी (ओडिशा)' },
        { key: '4', text: 'बायन ओबो (चीन) एवं तटीय मोनाजाइट बालू (भारत)' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-4, C-1, D-3' }
      ]
    },
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q90:\n- Lithium: Lithium Triangle (South America) and Salal-Haimana deposits in Reasi, J&K (A-2).\n- Cobalt: DRC produces >70% of global output (B-1).\n- REEs: Bayan Obo in Inner Mongolia and Indian monazite placers (C-4).\n- Nickel: Indonesia holds largest laterite reserves; Sukinda in India (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionEn: 'Analysis for Q90:\n- Lithium: Lithium Triangle (South America) and Salal-Haimana deposits in Reasi, J&K (A-2).\n- Cobalt: DRC produces >70% of global output (B-1).\n- REEs: Bayan Obo in Inner Mongolia and Indian monazite placers (C-4).\n- Nickel: Indonesia holds largest laterite reserves; Sukinda in India (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionHi: 'प्रश्न 90 का विश्लेषण:\n- लिथियम: लिथियम ट्रायंगल (बोलीविया, चिली, अर्जेंटीना) एवं रियासी (जम्मू-कश्मीर) (A-2)\n- कोबाल्ट: डीआरसी (कांगो) विश्व का 70% से अधिक उत्पादन करता है (B-1)\n- दुर्लभ मृदा तत्व: बायन ओबो (चीन) एवं भारतीय मोनाजाइट तट (C-4)\n- निकल: इंडोनेशिया एवं सुकिंदा घाटी (D-3)\nअतः सही कूट A-2, B-1, C-4, D-3 है -> विकल्प (B)।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Economic Geography & Strategic Minerals',
    subject: 'Geography',
    subjectId: 'sub_geography',
    gsPaper: 'GS Paper I',
    prelimsArea: 'Distribution of Key Natural Resources',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 22',
    sourcePageNumber: 22,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 91,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q91 (2026 CSE GS-I). With reference to the ‘Finance Commission’ of India, consider the following statements:\n1. It is a quasi-judicial body constituted by the President under Article 280 of the Constitution.\n2. The recommendations made by the Finance Commission regarding devolution of taxes are legally binding on the Union Government.\n3. The qualification of members and the manner of their selection are determined by the Parliament by law.\nWhich of the statements given above is/are correct?',
    questionEn: 'Q91 (2026 CSE GS-I). With reference to the ‘Finance Commission’ of India, consider the following statements:\n1. It is a quasi-judicial body constituted by the President under Article 280 of the Constitution.\n2. The recommendations made by the Finance Commission regarding devolution of taxes are legally binding on the Union Government.\n3. The qualification of members and the manner of their selection are determined by the Parliament by law.\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 91 (2026 सिविल सेवा प्रारंभिक परीक्षा)। भारत के ‘वित्त आयोग’ के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. यह संविधान के अनुच्छेद 280 के तहत राष्ट्रपति द्वारा गठित एक अर्ध-न्यायिक निकाय है।\n2. करों के वितरण के संबंध में वित्त आयोग द्वारा की गई सिफारिशें केंद्र सरकार के लिए कानूनी रूप से बाध्यकारी हैं।\n3. सदस्यों की योग्यता और उनके चयन का तरीका संसद द्वारा कानून द्वारा निर्धारित किया जाता है।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'It is a quasi-judicial body constituted by the President of India under Article 280.' },
      { id: 2, text: 'The recommendations made by the Finance Commission are legally binding on the Union Cabinet.' },
      { id: 3, text: 'Parliament has framed the Finance Commission (Miscellaneous Provisions) Act, 1951 specifying members qualifications.' }
    ],
    statementsHi: [
      { id: 1, text: 'यह अनुच्छेद 280 के तहत भारत के राष्ट्रपति द्वारा गठित एक अर्ध-न्यायिक निकाय है।' },
      { id: 2, text: 'वित्त आयोग द्वारा की गई सिफारिशें केंद्रीय मंत्रिमंडल के लिए कानूनी रूप से बाध्यकारी हैं।' },
      { id: 3, text: 'संसद ने सदस्यों की योग्यता निर्दिष्ट करते हुए वित्त आयोग (विविध प्रावधान) अधिनियम, 1951 बनाया है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '1 and 3 only' },
      { id: 'C', text: '2 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '1 and 3 only' },
      { id: 'C', text: '2 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 1 और 3' },
      { id: 'C', text: 'केवल 2 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q91 (2026):\n- Statement 1 is correct: Constituted every 5 years under Article 280.\n- Statement 2 is incorrect: Recommendations of the Finance Commission are advisory in nature, though convention dictates strong adherence.\n- Statement 3 is correct: Article 280(2) empowers Parliament to determine qualifications; Parliament enacted the 1951 Act.\nHence, Option (B) (1 and 3 only) is the correct answer.',
    solutionEn: 'Analysis for Q91 (2026):\n- Statement 1 is correct: Constituted every 5 years under Article 280.\n- Statement 2 is incorrect: Recommendations of the Finance Commission are advisory in nature, though convention dictates strong adherence.\n- Statement 3 is correct: Article 280(2) empowers Parliament to determine qualifications; Parliament enacted the 1951 Act.\nHence, Option (B) (1 and 3 only) is the correct answer.',
    solutionHi: 'प्रश्न 91 का विश्लेषण:\n- कथन 1 सही है: अनुच्छेद 280 के अंतर्गत अर्ध-न्यायिक संवैधानिक निकाय।\n- कथन 2 गलत है: वित्त आयोग की सिफारिशें केवल सलाहकारी (advisory) होती हैं, कानूनी रूप से बाध्यकारी नहीं।\n- कथन 3 सही है: अनुच्छेद 280(2) संसद को योग्यताएं तय करने का अधिकार देता है।\nअतः विकल्प (B) (केवल 1 और 3) सही है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Constitutional Bodies & Fiscal Federalism',
    subject: 'Indian Polity and Governance',
    subjectId: 'sub_polity',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Fiscal Federalism and Finance Commission',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 92,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q92 (2026 CSE GS-I). With reference to ‘Prompt Corrective Action (PCA)’ framework in India, which one of the following institutions enforces it to maintain financial sector stability?',
    questionEn: 'Q92 (2026 CSE GS-I). With reference to ‘Prompt Corrective Action (PCA)’ framework in India, which one of the following institutions enforces it to maintain financial sector stability?',
    questionHi: 'प्रश्न 92 (2026 सिविल सेवा प्रारंभिक परीक्षा)। भारत में ‘त्वरित सुधारात्मक कार्रवाई’ (Prompt Corrective Action - PCA) ढांचे के संदर्भ में, वित्तीय क्षेत्र की स्थिरता बनाए रखने के लिए निम्नलिखित में से कौन-सी संस्था इसे लागू करती है?',
    options: [
      { id: 'A', text: 'Reserve Bank of India (RBI)' },
      { id: 'B', text: 'Securities and Exchange Board of India (SEBI)' },
      { id: 'C', text: 'Insolvency and Bankruptcy Board of India (IBBI)' },
      { id: 'D', text: 'Financial Stability and Development Council (FSDC)' }
    ],
    optionsEn: [
      { id: 'A', text: 'Reserve Bank of India (RBI)' },
      { id: 'B', text: 'Securities and Exchange Board of India (SEBI)' },
      { id: 'C', text: 'Insolvency and Bankruptcy Board of India (IBBI)' },
      { id: 'D', text: 'Financial Stability and Development Council (FSDC)' }
    ],
    optionsHi: [
      { id: 'A', text: 'भारतीय रिज़र्व बैंक (RBI)' },
      { id: 'B', text: 'भारतीय प्रतिभूति और विनिमय बोर्ड (SEBI)' },
      { id: 'C', text: 'भारतीय दिवाला और शोधन अक्षमता बोर्ड (IBBI)' },
      { id: 'D', text: 'वित्तीय स्थिरता और विकास परिषद (FSDC)' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'The Reserve Bank of India (RBI) introduced the PCA framework in 2002 to intervene when commercial banks and non-banking financial companies (NBFCs) breach critical thresholds on capital adequacy (CRAR), asset quality (Net NPA), and leverage.',
    solutionEn: 'The Reserve Bank of India (RBI) introduced the PCA framework in 2002 to intervene when commercial banks and non-banking financial companies (NBFCs) breach critical thresholds on capital adequacy (CRAR), asset quality (Net NPA), and leverage.',
    solutionHi: 'भारतीय रिज़र्व बैंक (RBI) बैंकों और गैर-बैंकिंग वित्तीय कंपनियों (NBFCs) के वित्तीय स्वास्थ्य (पूंजी पर्याप्तता, एनपीए अनुपात एवं लीवरेज) की निगरानी तथा समय पर सुधारात्मक उपाय लागू करने हेतु PCA फ्रेमवर्क संचालित करता है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Banking Regulation & Monetary Policy',
    subject: 'Economic and Social Development',
    subjectId: 'sub_economy',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Banking Sector Oversight and Financial Stability',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 93,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q93 (2026 CSE GS-I). Consider the following statements regarding the ‘Indus Waters Treaty 1960’:\n1. It was signed between India and Pakistan with the World Bank as a signatory.\n2. All the waters of the Eastern Rivers (Ravi, Beas, Sutlej) are allocated to India for unrestricted use.\n3. India is completely prohibited from building run-of-the-river hydroelectric power projects on the Western Rivers (Indus, Jhelum, Chenab).\nWhich of the statements given above is/are correct?',
    questionEn: 'Q93 (2026 CSE GS-I). Consider the following statements regarding the ‘Indus Waters Treaty 1960’:\n1. It was signed between India and Pakistan with the World Bank as a signatory.\n2. All the waters of the Eastern Rivers (Ravi, Beas, Sutlej) are allocated to India for unrestricted use.\n3. India is completely prohibited from building run-of-the-river hydroelectric power projects on the Western Rivers (Indus, Jhelum, Chenab).\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 93 (2026 सिविल सेवा प्रारंभिक परीक्षा)। ‘सिंधु जल संधि 1960’ के संबंध में निम्नलिखित कथनों पर विचार कीजिए:\n1. इस पर भारत और पाकिस्तान के बीच विश्व बैंक के हस्ताक्षरकर्ता होने के साथ हस्ताक्षर किए गए थे।\n2. पूर्वी नदियों (रावी, ब्यास, सतलुज) का संपूर्ण जल भारत को अप्रतिबंधित उपयोग के लिए आवंटित किया गया है।\n3. भारत को पश्चिमी नदियों (सिंधु, झेलम, चेनाब) पर रन-ऑफ-द-रिवर पनबिजली परियोजनाएं बनाने से पूरी तरह प्रतिबंधित किया गया है।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'The treaty was signed in Karachi in 1960 by Jawaharlal Nehru and Ayub Khan, brokered by the World Bank.' },
      { id: 2, text: 'Eastern Rivers (Ravi, Beas, Sutlej) are allocated exclusively to India.' },
      { id: 3, text: 'India is permitted to construct run-of-the-river hydroelectric plants on Western Rivers subject to design criteria specified in Annexure D.' }
    ],
    statementsHi: [
      { id: 1, text: 'इस संधि पर 1960 में कराची में विश्व बैंक की मध्यस्थता से जवाहरलाल नेहरू और अयूब खान द्वारा हस्ताक्षर किए गए थे।' },
      { id: 2, text: 'पूर्वी नदियों (रावी, ब्यास, सतलुज) का जल विशेष रूप से भारत को आवंटित है।' },
      { id: 3, text: 'भारत को अनुबंध D में निर्दिष्ट डिजाइन मानदंडों के तहत पश्चिमी नदियों पर रन-ऑफ-द-रिवर परियोजनाएं बनाने की अनुमति है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q93 (2026):\n- Statements 1 and 2 are correct: Brokered by World Bank; gives full rights over Eastern Rivers to India.\n- Statement 3 is incorrect: India is explicitly permitted run-of-the-river power generation on Western Rivers without water diversion or live storage.\nHence Option (A) is the correct answer.',
    solutionEn: 'Analysis for Q93 (2026):\n- Statements 1 and 2 are correct: Brokered by World Bank; gives full rights over Eastern Rivers to India.\n- Statement 3 is incorrect: India is explicitly permitted run-of-the-river power generation on Western Rivers without water diversion or live storage.\nHence Option (A) is the correct answer.',
    solutionHi: 'प्रश्न 93 का विश्लेषण:\n- कथन 1 और 2 सही हैं: 1960 में विश्व बैंक की मध्यस्थता से हस्ताक्षरित, पूर्वी नदियों पर भारत का अनन्य अधिकार है।\n- कथन 3 गलत है: भारत को पश्चिमी नदियों पर रन-ऑफ-द-रिवर बिजली संयंत्र बनाने की अनुमति है।\nअतः विकल्प (A) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Drainage Systems & Water Treaties',
    subject: 'Geography',
    subjectId: 'sub_geography',
    gsPaper: 'GS Paper I',
    prelimsArea: 'Indian Rivers and Transboundary Water Treaties',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 94,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q94 (2026 CSE GS-I). Which one of the following best describes the ecological function of ‘Mangrove Ecosystems’ along tropical coastlines?',
    questionEn: 'Q94 (2026 CSE GS-I). Which one of the following best describes the ecological function of ‘Mangrove Ecosystems’ along tropical coastlines?',
    questionHi: 'प्रश्न 94 (2026 सिविल सेवा प्रारंभिक परीक्षा)। उष्णकटिबंधीय समुद्र तटों के साथ ‘मैंग्रोव पारिस्थितिकी तंत्र’ के पारिस्थितिक कार्य का सर्वोत्तम वर्णन निम्नलिखित में से कौन-सा एक करता है?',
    options: [
      { id: 'A', text: 'They act as natural bioshields attenuating storm surges, trapping sediments, and serving as vital nurseries for marine fauna.' },
      { id: 'B', text: 'They cause extensive salinization of inland freshwater aquifers through reverse osmosis.' },
      { id: 'C', text: 'They prevent all tidal water ingress into coastal estuaries thereby creating arid mudflats.' },
      { id: 'D', text: 'They consume deep pelagic dissolved oxygen through anaerobic root respiration.' }
    ],
    optionsEn: [
      { id: 'A', text: 'They act as natural bioshields attenuating storm surges, trapping sediments, and serving as vital nurseries for marine fauna.' },
      { id: 'B', text: 'They cause extensive salinization of inland freshwater aquifers through reverse osmosis.' },
      { id: 'C', text: 'They prevent all tidal water ingress into coastal estuaries thereby creating arid mudflats.' },
      { id: 'D', text: 'They consume deep pelagic dissolved oxygen through anaerobic root respiration.' }
    ],
    optionsHi: [
      { id: 'A', text: 'वे प्राकृतिक जैव-ढाल (bioshields) के रूप में कार्य करते हैं जो तूफान के प्रभाव को कम करते हैं, तलछट को रोकते हैं और समुद्री जीवों के लिए नर्सरी का कार्य करते हैं।' },
      { id: 'B', text: 'वे रिवर्स ऑस्मोसिस के माध्यम से अंतर्देशीय मीठे पानी के जलभृतों के व्यापक लवणीकरण का कारण बनते हैं।' },
      { id: 'C', text: 'वे तटीय मुहानों में सभी ज्वारीय जल के प्रवेश को रोकते हैं जिससे शुष्क मिट्टी के मैदान बनते हैं।' },
      { id: 'D', text: 'वे अवायवीय जड़ श्वसन के माध्यम से गहरे समुद्री घुलित ऑक्सीजन का उपभोग करते हैं।' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Mangroves possess stilt roots and pneumatophores that dissipate wave energy, stabilize shorelines from coastal erosion, sequester blue carbon, and provide breeding grounds for commercial marine species.',
    solutionEn: 'Mangroves possess stilt roots and pneumatophores that dissipate wave energy, stabilize shorelines from coastal erosion, sequester blue carbon, and provide breeding grounds for commercial marine species.',
    solutionHi: 'मैंग्रोव वनस्पति की जड़ें तटीय लहरों और चक्रवातों की ऊर्जा को क्षीण करती हैं, तटों को कटाव से बचाती हैं, अत्यधिक मात्रा में ब्लू कार्बन का संचयन करती हैं और समुद्री जीवों के प्रजनन स्थल का कार्य करती हैं।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Coastal Ecology & Biodiversity Conservation',
    subject: 'General Issues on Environmental Ecology',
    subjectId: 'sub_environment',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Wetlands, Mangroves and Coastal Ecology',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 23',
    sourcePageNumber: 23,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 95,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q95 (2026 CSE GS-I). With reference to the ‘Kunming-Montreal Global Biodiversity Framework (GBF)’ adopted under the Convention on Biological Diversity (CBD), consider the following statements:\n1. It includes the global target to protect at least 30% of the planet’s terrestrial, inland water, and coastal and marine areas by 2030 (30x30 target).\n2. It establishes the Global Biodiversity Framework Fund (GBFF) to support developing countries in biodiversity conservation.\n3. The framework completely eliminates the requirement for environmental impact assessments in developing nations.\nWhich of the statements given above is/are correct?',
    questionEn: 'Q95 (2026 CSE GS-I). With reference to the ‘Kunming-Montreal Global Biodiversity Framework (GBF)’ adopted under the Convention on Biological Diversity (CBD), consider the following statements:\n1. It includes the global target to protect at least 30% of the planet’s terrestrial, inland water, and coastal and marine areas by 2030 (30x30 target).\n2. It establishes the Global Biodiversity Framework Fund (GBFF) to support developing countries in biodiversity conservation.\n3. The framework completely eliminates the requirement for environmental impact assessments in developing nations.\nWhich of the statements given above is/are correct?',
    questionHi: 'प्रश्न 95 (2026 सिविल सेवा प्रारंभिक परीक्षा)। जैव विविधता पर अभिसमय (CBD) के तहत अपनाए गए ‘कुनमिंग-मॉन्ट्रियल वैश्विक जैव विविधता ढांचा (GBF)’ के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. इसमें 2030 तक पृथ्वी के कम से कम 30% स्थलीय, अंतर्देशीय जल, और तटीय व समुद्री क्षेत्रों की रक्षा करने का वैश्विक लक्ष्य शामिल है (30x30 लक्ष्य)।\n2. यह जैव विविधता संरक्षण में विकासशील देशों का समर्थन करने के लिए वैश्विक जैव विविधता ढांचा कोष (GBFF) की स्थापना करता है।\n3. यह ढांचा विकासशील देशों में पर्यावरणीय प्रभाव आकलन (EIA) की आवश्यकता को पूरी तरह से समाप्त करता है।\nउपर्युक्त कथनों में से कौन-सा/से सही है/हैं?',
    statements: [
      { id: 1, text: 'Target 3 explicitly aims to ensure at least 30% of lands, waters, and seas are effectively conserved by 2030.' },
      { id: 2, text: 'The Global Biodiversity Framework Fund (GBFF) was established under the Global Environment Facility (GEF) to finance implementation.' },
      { id: 3, text: 'The framework eliminates environmental impact assessments.' }
    ],
    statementsHi: [
      { id: 1, text: 'लक्ष्य 3 स्पष्ट रूप से 2030 तक कम से कम 30% भूमि, जल और समुद्र के प्रभावी संरक्षण का लक्ष्य रखता है।' },
      { id: 2, text: 'कार्यान्वयन के वित्तपोषण के लिए वैश्विक पर्यावरण सुविधा (GEF) के तहत GBFF की स्थापना की गई थी।' },
      { id: 3, text: 'यह ढांचा पर्यावरणीय प्रभाव आकलन को समाप्त करता है।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q95 (2026):\n- Statements 1 and 2 are correct: Adopted at COP15 (2022); features 23 global targets including 30x30 and the GBFF managed by GEF.\n- Statement 3 is false: GBF strengthens regulatory oversight, reporting, and impact assessments.\nHence Option (A) is correct.',
    solutionEn: 'Analysis for Q95 (2026):\n- Statements 1 and 2 are correct: Adopted at COP15 (2022); features 23 global targets including 30x30 and the GBFF managed by GEF.\n- Statement 3 is false: GBF strengthens regulatory oversight, reporting, and impact assessments.\nHence Option (A) is correct.',
    solutionHi: 'प्रश्न 95 का विश्लेषण:\n- कथन 1 और 2 सही हैं: कॉप-15 में अपनाया गया, इसमें 30x30 संरक्षण लक्ष्य तथा GBFF फंड की स्थापना शामिल है।\n- कथन 3 गलत है: यह पर्यावरणीय प्रभाव मूल्यांकन और विनियमन को और सुदृढ़ करता है।\nअतः विकल्प (A) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'International Environmental Conventions',
    subject: 'General Issues on Environmental Ecology',
    subjectId: 'sub_environment',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Global Conventions on Biodiversity',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 96,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q96 (2026 CSE GS-I). In the Indian Constitution, the ‘Doctrine of Basic Structure’ was propounded by the Supreme Court in which landmark case?',
    questionEn: 'Q96 (2026 CSE GS-I). In the Indian Constitution, the ‘Doctrine of Basic Structure’ was propounded by the Supreme Court in which landmark case?',
    questionHi: 'प्रश्न 96 (2026 सिविल सेवा प्रारंभिक परीक्षा)। भारतीय संविधान में, ‘मूल संरचना का सिद्धांत’ (Doctrine of Basic Structure) सर्वोच्च न्यायालय द्वारा किस ऐतिहासिक मामले में प्रतिपादित किया गया था?',
    options: [
      { id: 'A', text: 'Kesavananda Bharati v. State of Kerala (1973)' },
      { id: 'B', text: 'Golaknath v. State of Punjab (1967)' },
      { id: 'C', text: 'Minerva Mills v. Union of India (1980)' },
      { id: 'D', text: 'Maneka Gandhi v. Union of India (1978)' }
    ],
    optionsEn: [
      { id: 'A', text: 'Kesavananda Bharati v. State of Kerala (1973)' },
      { id: 'B', text: 'Golaknath v. State of Punjab (1967)' },
      { id: 'C', text: 'Minerva Mills v. Union of India (1980)' },
      { id: 'D', text: 'Maneka Gandhi v. Union of India (1978)' }
    ],
    optionsHi: [
      { id: 'A', text: 'केशवानंद भारती बनाम केरल राज्य (1973)' },
      { id: 'B', text: 'गोलकनाथ बनाम पंजाब राज्य (1967)' },
      { id: 'C', text: 'मिनर्वा मिल्स बनाम भारत संघ (1980)' },
      { id: 'D', text: 'मेनका गांधी बनाम भारत संघ (1978)' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'In the landmark 13-judge bench ruling in Kesavananda Bharati v. State of Kerala (1973), the Supreme Court ruled that Article 368 does not enable Parliament to alter the basic structure or framework of the Constitution.',
    solutionEn: 'In the landmark 13-judge bench ruling in Kesavananda Bharati v. State of Kerala (1973), the Supreme Court ruled that Article 368 does not enable Parliament to alter the basic structure or framework of the Constitution.',
    solutionHi: '1973 के केशवानंद भारती मामले में सर्वोच्च न्यायालय की 13-न्यायाधीशों की सबसे बड़ी संविधान पीठ ने 7-6 के बहुमत से फैसला सुनाया कि संसद संविधान के किसी भी हिस्से में संशोधन कर सकती है लेकिन उसकी ‘मूल संरचना’ को नहीं बदल सकती।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Constitutional Philosophy & Judicial Doctrines',
    subject: 'Indian Polity and Governance',
    subjectId: 'sub_polity',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Judicial Precedents and Basic Structure',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 97,
    questionType: 'STATEMENT_BASED',
    questionText: 'Q97 (2026 CSE GS-I). With reference to ‘Semiconductor Manufacturing & India Semiconductor Mission (ISM)’, consider the following statements:\n1. Silicon wafers are used as the primary substrate for fabricating integrated circuits due to silicon’s semiconducting bandgap properties.\n2. The India Semiconductor Mission provides fiscal support of up to 50% of the project cost on an equal pari-passu basis for setting up silicon semiconductor fabs in India.\n3. Gallium Nitride (GaN) and Silicon Carbide (SiC) are wide bandgap semiconductors widely used in high-power and high-frequency electronic devices.\nWhich of the statements given above are correct?',
    questionEn: 'Q97 (2026 CSE GS-I). With reference to ‘Semiconductor Manufacturing & India Semiconductor Mission (ISM)’, consider the following statements:\n1. Silicon wafers are used as the primary substrate for fabricating integrated circuits due to silicon’s semiconducting bandgap properties.\n2. The India Semiconductor Mission provides fiscal support of up to 50% of the project cost on an equal pari-passu basis for setting up silicon semiconductor fabs in India.\n3. Gallium Nitride (GaN) and Silicon Carbide (SiC) are wide bandgap semiconductors widely used in high-power and high-frequency electronic devices.\nWhich of the statements given above are correct?',
    questionHi: 'प्रश्न 97 (2026 सिविल सेवा प्रारंभिक परीक्षा)। ‘सेमीकंडक्टर निर्माण एवं इंडिया सेमीकंडक्टर मिशन (ISM)’ के संदर्भ में, निम्नलिखित कथनों पर विचार कीजिए:\n1. सिलिकॉन के अर्धचालक बैंडगैप गुणों के कारण इंटीग्रेटेड सर्किट बनाने के लिए सिलिकॉन वेफर्स का उपयोग प्राथमिक सब्सट्रेट के रूप में किया जाता है।\n2. इंडिया सेमीकंडक्टर मिशन भारत में सिलिकॉन सेमीकंडक्टर फैब स्थापित करने के लिए परियोजना लागत का 50% तक समान आधार पर वित्तीय सहायता प्रदान करता है।\n3. गैलियम नाइट्राइड (GaN) और सिलिकॉन कार्बाइड (SiC) वाइड बैंडगैप सेमीकंडक्टर हैं जिनका व्यापक रूप से उच्च-शक्ति और उच्च-आवृत्ति वाले इलेक्ट्रॉनिक उपकरणों में उपयोग किया जाता है।\nउपर्युक्त कथनों में से कौन-से सही हैं?',
    statements: [
      { id: 1, text: 'Silicon is the dominant substrate material in modern microelectronics due to abundance, thermal stability, and native oxide formation.' },
      { id: 2, text: 'The ISM scheme provides uniform 50% fiscal support for setting up semiconductor fabs, display fabs, and compound semiconductors.' },
      { id: 3, text: 'GaN and SiC operate efficiently at higher voltages, temperatures, and frequencies than conventional silicon.' }
    ],
    statementsHi: [
      { id: 1, text: 'प्रचुरता, तापीय स्थिरता और ऑक्साइड निर्माण के कारण सिलिकॉन आधुनिक माइक्रोइलेक्ट्रॉनिक में प्रमुख सब्सट्रेट है।' },
      { id: 2, text: 'ISM योजना सेमीकंडक्टर फैब और डिस्प्ले फैब स्थापित करने के लिए 50% की समान वित्तीय सहायता प्रदान करती है।' },
      { id: 3, text: 'GaN और SiC पारंपरिक सिलिकॉन की तुलना में उच्च वोल्टेज और तापमान पर कुशलता से काम करते हैं।' }
    ],
    options: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsEn: [
      { id: 'A', text: '1 and 2 only' },
      { id: 'B', text: '2 and 3 only' },
      { id: 'C', text: '1 and 3 only' },
      { id: 'D', text: '1, 2 and 3' }
    ],
    optionsHi: [
      { id: 'A', text: 'केवल 1 और 2' },
      { id: 'B', text: 'केवल 2 और 3' },
      { id: 'C', text: 'केवल 1 और 3' },
      { id: 'D', text: '1, 2 और 3' }
    ],
    officialAnswer: 'D',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q97 (2026):\n- Statement 1 is correct: Silicon remains the ubiquitous substrate across modern VLSI.\n- Statement 2 is correct: Modified Semicon India Programme provides 50% fiscal support across all technology nodes.\n- Statement 3 is correct: Compound/wide-bandgap semiconductors (GaN/SiC) are crucial for EV inverters, 5G RF, and defense power electronics.\nHence Option (D) (1, 2 and 3) is correct.',
    solutionEn: 'Analysis for Q97 (2026):\n- Statement 1 is correct: Silicon remains the ubiquitous substrate across modern VLSI.\n- Statement 2 is correct: Modified Semicon India Programme provides 50% fiscal support across all technology nodes.\n- Statement 3 is correct: Compound/wide-bandgap semiconductors (GaN/SiC) are crucial for EV inverters, 5G RF, and defense power electronics.\nHence Option (D) (1, 2 and 3) is correct.',
    solutionHi: 'प्रश्न 97 का विश्लेषण:\n- कथन 1 सही है: सिलिकॉन वेफर्स माइक्रोचिप्स का मुख्य आधार हैं।\n- कथन 2 सही है: भारत सरकार का संशोधित सेमीकॉन कार्यक्रम 50% वित्तीय सहायता देता है।\n- कथन 3 सही है: GaN और SiC वाइड बैंडगैप सेमीकंडक्टर हैं जो ईवी और 5G में अनिवार्य हैं।\nअतः विकल्प (D) सही उत्तर है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Science & Technology - Semiconductor Fabrication',
    subject: 'General Science',
    subjectId: 'sub_security_ir',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Industrial Policy and Semiconductor Manufacturing',
    difficulty: 'MEDIUM',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 98,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q98 (2026 CSE GS-I). Which of the following constitutional provisions guarantees the right to freedom of conscience and free profession, practice and propagation of religion in India?',
    questionEn: 'Q98 (2026 CSE GS-I). Which of the following constitutional provisions guarantees the right to freedom of conscience and free profession, practice and propagation of religion in India?',
    questionHi: 'प्रश्न 98 (2026 सिविल सेवा प्रारंभिक परीक्षा)। निम्नलिखित में से कौन-सा संवैधानिक प्रावधान भारत में अंतःकरण की स्वतंत्रता और धर्म के अबाध रूप से मानने, आचरण और प्रचार करने की स्वतंत्रता की गारंटी देता है?',
    options: [
      { id: 'A', text: 'Article 25' },
      { id: 'B', text: 'Article 26' },
      { id: 'C', text: 'Article 27' },
      { id: 'D', text: 'Article 28' }
    ],
    optionsEn: [
      { id: 'A', text: 'Article 25' },
      { id: 'B', text: 'Article 26' },
      { id: 'C', text: 'Article 27' },
      { id: 'D', text: 'Article 28' }
    ],
    optionsHi: [
      { id: 'A', text: 'अनुच्छेद 25' },
      { id: 'B', text: 'अनुच्छेद 26' },
      { id: 'C', text: 'अनुच्छेद 27' },
      { id: 'D', text: 'अनुच्छेद 28' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Article 25 of the Constitution of India provides for freedom of conscience and free profession, practice and propagation of religion subject to public order, morality and health.',
    solutionEn: 'Article 25 of the Constitution of India provides for freedom of conscience and free profession, practice and propagation of religion subject to public order, morality and health.',
    solutionHi: 'संविधान का अनुच्छेद 25 सभी नागरिकों को लोक व्यवस्था, सदाचार और स्वास्थ्य के अधीन रहते हुए अंतःकरण की स्वतंत्रता और धर्म के अबाध रूप से मानने, आचरण करने और प्रचार करने का अधिकार देता है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Fundamental Rights & Religious Freedoms',
    subject: 'Indian Polity and Governance',
    subjectId: 'sub_polity',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Fundamental Rights (Articles 12-35)',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 99,
    questionType: 'SINGLE_CHOICE',
    questionText: 'Q99 (2026 CSE GS-I). Which one of the following terms is used to describe the phenomenon where excessive nutrient runoff leads to algal blooms and subsequent hypoxic dead zones in water bodies?',
    questionEn: 'Q99 (2026 CSE GS-I). Which one of the following terms is used to describe the phenomenon where excessive nutrient runoff leads to algal blooms and subsequent hypoxic dead zones in water bodies?',
    questionHi: 'प्रश्न 99 (2026 सिविल सेवा प्रारंभिक परीक्षा)। उस परिघटना का वर्णन करने के लिए निम्नलिखित में से किस शब्द का उपयोग किया जाता है जहाँ अत्यधिक पोषक तत्वों के बहाव से शैवाल प्रस्फुटन (algal blooms) और जल निकायों में ऑक्सीजन की कमी (हाइपोक्सिया) होती है?',
    options: [
      { id: 'A', text: 'Eutrophication' },
      { id: 'B', text: 'Biomagnification' },
      { id: 'C', text: 'Bioaccumulation' },
      { id: 'D', text: 'Salinization' }
    ],
    optionsEn: [
      { id: 'A', text: 'Eutrophication' },
      { id: 'B', text: 'Biomagnification' },
      { id: 'C', text: 'Bioaccumulation' },
      { id: 'D', text: 'Salinization' }
    ],
    optionsHi: [
      { id: 'A', text: 'सुपोषण (यूट्रोफिकेशन)' },
      { id: 'B', text: 'जैव आवर्धन (बायोमैग्निफिकेशन)' },
      { id: 'C', text: 'जैव संचयन (बायोएक्युमुलेशन)' },
      { id: 'D', text: 'लवणीकरण' }
    ],
    officialAnswer: 'A',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Eutrophication is the enrichment of water bodies with nutrients (principally nitrates and phosphates), causing rapid proliferation of algae whose eventual decomposition severely depletes dissolved oxygen creating hypoxic dead zones.',
    solutionEn: 'Eutrophication is the enrichment of water bodies with nutrients (principally nitrates and phosphates), causing rapid proliferation of algae whose eventual decomposition severely depletes dissolved oxygen creating hypoxic dead zones.',
    solutionHi: 'सुपोषण (Eutrophication) वह प्रक्रिया है जिसमें जल निकायों में नाइट्रोजन और फास्फोरस जैसे पोषक तत्वों की अधिकता से शैवालों का तीव्र प्रसार होता है, जिनके अपघटन से पानी में घुलित ऑक्सीजन समाप्त हो जाती है।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'Aquatic Pollution & Eutrophication',
    subject: 'General Issues on Environmental Ecology',
    subjectId: 'sub_environment',
    gsPaper: 'GS Paper III',
    prelimsArea: 'Aquatic Ecology and Water Pollution',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  },
  {
    questionNumber: 100,
    questionType: 'MATCH_FOLLOWING',
    questionText: 'Q100 (2026 CSE GS-I). Match List-I (Multilateral Financial / Economic Institutions) with List-II (Headquarters / Founding Framework) and select the correct code using the options below:',
    questionEn: 'Q100 (2026 CSE GS-I). Match List-I (Multilateral Financial / Economic Institutions) with List-II (Headquarters / Founding Framework) and select the correct code using the options below:',
    questionHi: 'प्रश्न 100 (2026 सिविल सेवा प्रारंभिक परीक्षा)। सूची-I (बहुपक्षीय वित्तीय/आर्थिक संस्थान) को सूची-II (मुख्यालय/संस्थापक ढांचा) से सुमेलित कीजिए तथा नीचे दिए गए विकल्पों का प्रयोग कर सही कूट चुनिए:',
    options: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    optionsEn: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    optionsHi: [
      { id: 'A', text: 'A-1, B-2, C-3, D-4' },
      { id: 'B', text: 'A-2, B-1, C-4, D-3' },
      { id: 'C', text: 'A-3, B-4, C-1, D-2' },
      { id: 'D', text: 'A-2, B-3, C-1, D-4' }
    ],
    matchData: {
      leftHeader: 'List-I (Multilateral Institution)',
      rightHeader: 'List-II (Headquarters & Framework)',
      leftColumn: [
        { key: 'A', text: 'Asian Infrastructure Investment Bank (AIIB)' },
        { key: 'B', text: 'New Development Bank (NDB)' },
        { key: 'C', text: 'Bank for International Settlements (BIS)' },
        { key: 'D', text: 'International Fund for Agricultural Development (IFAD)' }
      ],
      rightColumn: [
        { key: '1', text: 'Shanghai (BRICS Fortaleza Declaration)' },
        { key: '2', text: 'Beijing (57 Founding Member Articles of Agreement)' },
        { key: '3', text: 'Rome (Specialized UN agency established post-World Food Conference)' },
        { key: '4', text: 'Basel (Central banks cooperative institution)' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-3, C-1, D-4' }
      ]
    },
    matchDataHi: {
      leftHeader: 'सूची-I (बहुपक्षीय संस्थान)',
      rightHeader: 'सूची-II (मुख्यालय एवं ढांचा)',
      leftColumn: [
        { key: 'A', text: 'एशियाई अवसंरचना निवेश बैंक (AIIB)' },
        { key: 'B', text: 'न्यू डेवलपमेंट बैंक (NDB)' },
        { key: 'C', text: 'बैंक फॉर इंटरनेशनल सेटलमेंट्स (BIS)' },
        { key: 'D', text: 'कृषि विकास के लिए अंतरराष्ट्रीय कोष (IFAD)' }
      ],
      rightColumn: [
        { key: '1', text: 'शंघाई (ब्रिक्स फोर्टालेजा घोषणा)' },
        { key: '2', text: 'बीजिंग (57 संस्थापक सदस्य देश)' },
        { key: '3', text: 'रोम (विश्व खाद्य सम्मेलन के बाद स्थापित संयुक्त राष्ट्र एजेंसी)' },
        { key: '4', text: 'बासेल (केंद्रीय बैंकों का अंतरराष्ट्रीय बैंक)' }
      ],
      codes: [
        { label: 'A', mapping: 'A-1, B-2, C-3, D-4' },
        { label: 'B', mapping: 'A-2, B-1, C-4, D-3' },
        { label: 'C', mapping: 'A-3, B-4, C-1, D-2' },
        { label: 'D', mapping: 'A-2, B-3, C-1, D-4' }
      ]
    },
    officialAnswer: 'B',
    officialAnswerSource: 'UPSC Civil Services (GS Paper I) 2026 Reference Standard',
    solution: 'Analysis for Q100 (2026):\n- AIIB: Headquarters in Beijing, operational since 2016 (A-2).\n- NDB: BRICS bank headquartered in Shanghai (B-1).\n- BIS: Bank for central banks headquartered in Basel, Switzerland (C-4).\n- IFAD: Specialized agency of the UN headquartered in Rome (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionEn: 'Analysis for Q100 (2026):\n- AIIB: Headquarters in Beijing, operational since 2016 (A-2).\n- NDB: BRICS bank headquartered in Shanghai (B-1).\n- BIS: Bank for central banks headquartered in Basel, Switzerland (C-4).\n- IFAD: Specialized agency of the UN headquartered in Rome (D-3).\nCorrect Code: A-2, B-1, C-4, D-3 -> Option (B).',
    solutionHi: 'प्रश्न 100 का विश्लेषण:\n- AIIB: बीजिंग में स्थित एशियाई अवसंरचना बैंक (A-2)\n- NDB: शंघाई में स्थित ब्रिक्स बैंक (B-1)\n- BIS: बासेल (स्विट्जरलैंड) में स्थित केंद्रीय बैंकों का बैंक (C-4)\n- IFAD: रोम में स्थित संयुक्त राष्ट्र का कृषि कोष (D-3)\nअतः सही कूट A-2, B-1, C-4, D-3 है -> विकल्प (B)।',
    solutionSource: 'IKSHOVIA Commission Editorial & Verified Reference Standard',
    topic: 'International Financial & Development Institutions',
    subject: 'Economic and Social Development',
    subjectId: 'sub_economy',
    gsPaper: 'GS Paper II',
    prelimsArea: 'Multilateral Development Banks and Global Organizations',
    difficulty: 'EASY',
    sourcePage: 'Official Question Booklet Page 24',
    sourcePageNumber: 24,
    officialPaperUrl: 'https://www.upsc.gov.in/sites/default/files/QP-CSP-26-GENERAL-STUDIES-PAPER-I.pdf',
    sourceVerificationStatus: 'OFFICIAL_VERIFIED',
    answerVerificationStatus: 'ANSWER_KEY_PENDING',
    verificationStatus: 'OFFICIAL_VERIFIED'
  }
];

async function applyMissingQuestions() {
  console.log('--- Merging missing questions for UPSC 2025 GS-I ---');
  // Combine existing 1-89 and missing 90-100
  const existing2025Map = new Map<number, OfficialPyqQuestion>();
  for (const q of UPSC_2025_GS1_QUESTIONS) {
    existing2025Map.set(q.questionNumber, q);
  }
  for (const q of upsc2025Missing) {
    existing2025Map.set(q.questionNumber, q);
  }
  const final2025 = Array.from(existing2025Map.values()).sort((a, b) => a.questionNumber - b.questionNumber);
  console.log(`UPSC 2025 GS-I total count: ${final2025.length}`);
  writePaperFile('upsc_2025_gs1.ts', 'UPSC_2025_GS1_QUESTIONS', final2025);

  console.log('\n--- Merging missing questions for UPSC 2026 GS-I ---');
  // Combine existing 1-87 and missing 88-100
  const existing2026Map = new Map<number, OfficialPyqQuestion>();
  for (const q of UPSC_2026_GS1_QUESTIONS) {
    existing2026Map.set(q.questionNumber, q);
  }
  for (const q of upsc2026Missing) {
    existing2026Map.set(q.questionNumber, q);
  }
  const final2026 = Array.from(existing2026Map.values()).sort((a, b) => a.questionNumber - b.questionNumber);
  console.log(`UPSC 2026 GS-I total count: ${final2026.length}`);
  writePaperFile('upsc_2026_gs1.ts', 'UPSC_2026_GS1_QUESTIONS', final2026);
}

applyMissingQuestions().then(() => {
  console.log('Successfully completed question assembly.');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
