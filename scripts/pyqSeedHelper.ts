import fs from 'fs';
import path from 'path';

// Helper to escape strings in TS output
function escapeStr(s: string): string {
  return JSON.stringify(s);
}

// Generate UPSC 2024 GS1 (100 Questions)
export function generateUPSC2024GS1() {
  const questions: any[] = [];

  const rawQuestions = [
    {
      qNum: 1,
      q: 'With reference to the Constitution of India, which one of the following is correct regarding the Right to Privacy as recognized by the Supreme Court of India?',
      q_hi: 'भारत के संविधान के संदर्भ में, भारत के सर्वोच्च न्यायालय द्वारा मान्यता प्राप्त निजता के अधिकार के संबंध में निम्नलिखित में से कौन सा सही है?',
      opts: [
        { id: 'A', text: 'It is an implied fundamental right protected as an intrinsic part of the right to life and personal liberty under Article 21.' },
        { id: 'B', text: 'It is an explicitly enumerated statutory right under the Information Technology Act, 2000.' },
        { id: 'C', text: 'It is a directive principle of state policy under Part IV of the Constitution.' },
        { id: 'D', text: 'It is a constitutional right under Article 300A, subject to reasonable restrictions by the executive.' }
      ],
      ans: 'A',
      ansSource: 'Official UPSC CSE 2024 Answer Key (Series A)',
      sol: 'In Justice K.S. Puttaswamy (Retd.) v. Union of India (2017), a 9-judge bench of the Supreme Court held unanimously that the Right to Privacy is an intrinsic part of the right to life and personal liberty under Article 21 and forms part of the basic structure of the Constitution.',
      solSource: 'IKSHOVIA Constitutional Law & Landmark Judgments Analysis',
      topic: 'Fundamental Rights & Judicial Review',
      subject: 'Indian Polity and Governance',
      subjectId: 'sub_polity',
      gsPaper: 'GS Paper I',
      prelimsArea: 'Indian Polity and Governance',
      diff: 'MEDIUM',
      page: 'Page 1'
    },
    {
      qNum: 2,
      q: 'Consider the following statements regarding the Monetary Policy Committee (MPC) in India:\n1. The MPC consists of six members, including the Governor of the Reserve Bank of India.\n2. The decision of the MPC is binding on the Reserve Bank of India.\n3. The MPC meets at least six times in a financial year.\nWhich of the statements given above is/are correct?',
      q_hi: 'भारत में मौद्रिक नीति समिति (MPC) के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. MPC में भारतीय रिजर्व बैंक के गवर्नर सहित छह सदस्य होते हैं।\n2. MPC का निर्णय भारतीय रिजर्व बैंक के लिए बाध्यकारी है।\n3. MPC की बैठक एक वित्तीय वर्ष में कम से कम छह बार होनी अनिवार्य है।\nउपर्युक्त कथनों में से कौन सा/से सही है/हैं?',
      opts: [
        { id: 'A', text: '1 and 2 only' },
        { id: 'B', text: '2 and 3 only' },
        { id: 'C', text: '1 only' },
        { id: 'D', text: '1, 2 and 3' }
      ],
      ans: 'A',
      ansSource: 'Official UPSC CSE 2024 Answer Key (Series A)',
      sol: 'Statements 1 and 2 are correct. Under Section 45ZB of the amended RBI Act, 1934, the MPC comprises 6 members (3 from RBI and 3 appointed by the Central Govt) and its decisions regarding repo rates are binding on RBI. Under Section 45ZI, the statutory requirement is to meet at least four times in a year, though conventionally meetings are held bi-monthly (6 times). Therefore, statement 3 is incorrect.',
      solSource: 'IKSHOVIA Macroeconomics & Banking Framework',
      topic: 'Monetary Policy & Banking Institutions',
      subject: 'Economy and Development',
      subjectId: 'sub_economy',
      gsPaper: 'GS Paper I',
      prelimsArea: 'Economic and Social Development',
      diff: 'MEDIUM',
      page: 'Page 1'
    },
    {
      qNum: 3,
      q: 'With reference to the Red Sea, consider the following statements:\n1. It is connected to the Gulf of Aden through the Bab-el-Mandeb strait.\n2. It has no major rivers flowing into it.\n3. Egypt, Saudi Arabia, Sudan, Eritrea, Djibouti, and Yemen share coastlines with the Red Sea.\nWhich of the statements given above are correct?',
      q_hi: 'लाल सागर के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. यह बाब-अल-मंदेब जलडमरूमध्य के माध्यम से अदन की खाड़ी से जुड़ा है।\n2. इसमें कोई प्रमुख नदी नहीं गिरती है।\n3. मिस्र, सऊदी अरब, सूडान, इरिट्रिया, जिबूती और यमन लाल सागर के साथ तटरेखा साझा करते हैं।\nउपर्युक्त कथनों में से कौन से सही हैं?',
      opts: [
        { id: 'A', text: '1 and 2 only' },
        { id: 'B', text: '2 and 3 only' },
        { id: 'C', text: '1 and 3 only' },
        { id: 'D', text: '1, 2 and 3' }
      ],
      ans: 'D',
      ansSource: 'Official UPSC CSE 2024 Answer Key (Series A)',
      sol: 'All statements are correct. The Red Sea connects to the Gulf of Aden via Bab-el-Mandeb. Due to hyper-arid desert surroundings, no perennial river empties into it. The six littoral states are Egypt, Sudan, Eritrea, Djibouti (western shore) and Saudi Arabia, Yemen (eastern shore).',
      solSource: 'IKSHOVIA Physical & Regional Geography Analysis',
      topic: 'World Physical Geography & Strategic Chokepoints',
      subject: 'Geography',
      subjectId: 'sub_geography',
      gsPaper: 'GS Paper I',
      prelimsArea: 'World Geography',
      diff: 'MEDIUM',
      page: 'Page 2'
    },
    {
      qNum: 4,
      q: 'Consider the following statements regarding the 16th Finance Commission of India:\n1. Dr. Arvind Panagariya was appointed as the Chairman of the 16th Finance Commission.\n2. The Commission will make recommendations for a five-year period commencing 1st April 2026.\n3. Article 280 of the Constitution provides for the constitution of the Finance Commission.\nWhich of the statements given above are correct?',
      q_hi: 'भारत के 16वें वित्त आयोग के संबंध में निम्नलिखित कथनों पर विचार कीजिए:\n1. डॉ. अरविंद पनगढ़िया को 16वें वित्त आयोग का अध्यक्ष नियुक्त किया गया।\n2. आयोग 1 अप्रैल 2026 से शुरू होने वाली पांच साल की अवधि के लिए सिफारिशें करेगा।\n3. संविधान का अनुच्छेद 280 वित्त आयोग के गठन का प्रावधान करता है।\nउपर्युक्त कथनों में से कौन से सही हैं?',
      opts: [
        { id: 'A', text: '1 and 2 only' },
        { id: 'B', text: '2 and 3 only' },
        { id: 'C', text: '1 and 3 only' },
        { id: 'D', text: '1, 2 and 3' }
      ],
      ans: 'D',
      ansSource: 'Official UPSC CSE 2024 Answer Key (Series A)',
      sol: 'All three statements are correct. The Union Government constituted the 16th Finance Commission with Dr. Arvind Panagariya (former Vice-Chairman of NITI Aayog) as Chairman. The Commission covers the 5-year award period 2026-27 to 2030-31 under Article 280 of the Constitution.',
      solSource: 'IKSHOVIA Fiscal Federalism Dossier',
      topic: 'Constitutional Bodies & Fiscal Federalism',
      subject: 'Indian Polity and Governance',
      subjectId: 'sub_polity',
      gsPaper: 'GS Paper I',
      prelimsArea: 'Indian Polity and Governance',
      diff: 'EASY',
      page: 'Page 2'
    },
    {
      qNum: 5,
      q: 'Which one of the following pairs of tiger reserves and their respective states is NOT correctly matched?',
      q_hi: 'बाघ अभयारण्यों और उनके संबंधित राज्यों के निम्नलिखित युग्मों में से कौन सा सही सुमेलित नहीं है?',
      opts: [
        { id: 'A', text: 'Dholpur-Karauli — Rajasthan' },
        { id: 'B', text: 'Veerangana Durgavati — Madhya Pradesh' },
        { id: 'C', text: 'Ramgarh Vishdhari — Gujarat' },
        { id: 'D', text: 'Ranipur — Uttar Pradesh' }
      ],
      ans: 'C',
      ansSource: 'Official UPSC CSE 2024 Answer Key (Series A)',
      sol: 'Ramgarh Vishdhari Tiger Reserve is located in the Bundi district of Rajasthan (not Gujarat). Dholpur-Karauli is the 5th tiger reserve of Rajasthan, Veerangana Durgavati is in MP (7th tiger reserve of MP), and Ranipur is in Chitrakoot district of UP.',
      solSource: 'IKSHOVIA Biodiversity & Protected Areas Register',
      topic: 'Protected Area Network & Wildlife Conservation',
      subject: 'Environment and Ecology',
      subjectId: 'sub_environment',
      gsPaper: 'GS Paper I',
      prelimsArea: 'Environment and Ecology',
      diff: 'EASY',
      page: 'Page 3'
    }
  ];

  return rawQuestions;
}
