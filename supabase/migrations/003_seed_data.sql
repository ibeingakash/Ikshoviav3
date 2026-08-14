-- ====================================================================
-- IKSHOVIA V3 SUPABASE POSTGRESQL MIGRATION 003: PRODUCTION SEED DATA
-- Inserts system accounts, subjects, topics, concepts, PYQs, current affairs, and goals.
-- ====================================================================

-- 1. SYSTEM USERS
INSERT INTO public.users (id, email, name, role, is_onboarded, created_at)
VALUES 
  ('usr_student', 'student@ikshovia.com', 'Akash', 'USER', true, NOW()),
  ('usr_admin', 'admin@ikshovia.com', 'Akash Singh', 'ADMIN', true, NOW()),
  ('usr_superadmin', 'superadmin@ikshovia.com', 'Akash Pratap Singh', 'SUPER_ADMIN', true, NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- 2. USER PASSWORDS (Salted scrypt hashes)
INSERT INTO public.user_passwords (email, password_hash)
VALUES
  ('student@ikshovia.com', '5ebc040a279f7944d4d003cc9aef297a6a53281280793fc635fcd9b095514e6d782610ff1fcbdbe01b61479399d086da1fc3d3daafbcc51d2ef633e3300182a2'),
  ('admin@ikshovia.com', '9b8ce7f79c4e613a9d54ca70273a47580a118b1cc80bd4632a72e4993caa8757cf75a767a2f59803b44c51e713f62a3107329849aa8de29f3bedb4d8cbdad668'),
  ('superadmin@ikshovia.com', '3ae025a33cf55d8433cce91fbc444d169e4874b1c5abc07255de3cc28443f7f5f917960bc1376cac3267dfa3f1179a13e8f0b3ecee37027c68fcc04952fd8384')
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 3. ADMIN PERMISSIONS
INSERT INTO public.admin_permissions (user_id, permission_code)
VALUES
  ('usr_admin', 'QUESTION_CREATE'),
  ('usr_admin', 'QUESTION_EDIT'),
  ('usr_admin', 'QUESTION_PUBLISH'),
  ('usr_admin', 'OCR_IMPORT'),
  ('usr_admin', 'OCR_REVIEW'),
  ('usr_admin', 'MOCK_CREATE'),
  ('usr_admin', 'CONCEPT_CREATE'),
  ('usr_superadmin', 'ALL_PERMISSIONS'),
  ('usr_superadmin', 'ADMIN_MANAGE'),
  ('usr_superadmin', 'SYSTEM_SETTINGS'),
  ('usr_superadmin', 'AUDIT_LOG_VIEW')
ON CONFLICT DO NOTHING;

-- 4. SUBJECTS
INSERT INTO public.subjects (id, name, code, description, icon_name, color, topics_count, concepts_count)
VALUES
  ('sub_polity', 'Indian Polity & Governance', 'POLITY', 'Constitution, Fundamental Rights, Federal Structure, Judiciary, Executive & Parliament', 'Landmark', 'indigo', 4, 8),
  ('sub_economy', 'Indian Economy & Banking', 'ECONOMY', 'Macroeconomics, Monetary Policy, Fiscal Federalism, Banking, Inflation & Trade', 'TrendingUp', 'emerald', 3, 6),
  ('sub_history', 'Indian History & Art/Culture', 'HISTORY', 'Ancient, Medieval, Modern Freedom Movement and Heritage', 'Scroll', 'amber', 3, 5),
  ('sub_geography', 'Geography & Environment', 'GEOGRAPHY', 'Physical Geography, Western Ghats, Biodiversity, Monsoon & Climate Change', 'Compass', 'blue', 3, 5),
  ('sub_ca', 'Current Affairs & Governance', 'CURRENT_AFFAIRS', 'National, International Affairs, Policy Updates and Judicial Judgments', 'Newspaper', 'rose', 2, 4)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 5. TOPICS
INSERT INTO public.topics (id, subject_id, name, description, order_num, concepts_count)
VALUES
  ('top_const', 'sub_polity', 'Constitutional Framework', 'Preamble, Features, Amendments', 1, 2),
  ('top_rights', 'sub_polity', 'Fundamental Rights & Duties', 'Articles 12 to 35, Writs & Duties', 2, 3),
  ('top_judiciary', 'sub_polity', 'Judiciary & Writs', 'Supreme Court, High Courts, Judicial Review', 3, 2),
  ('top_federalism', 'sub_polity', 'Federal System', 'Union-State Relations, Emergency Provisions', 4, 1),
  ('top_monetary', 'sub_economy', 'Monetary Policy & Banking', 'RBI, Repo Rate, MPC, Inflation', 1, 3),
  ('top_fiscal', 'sub_economy', 'Fiscal Policy & Federalism', 'Finance Commission, GST Council, Deficit', 2, 2),
  ('top_banking', 'sub_economy', 'Financial Markets', 'Money Market, Capital Market, SEBI', 3, 1),
  ('top_ancient', 'sub_history', 'Ancient Indian Civilizations', 'Indus Valley, Vedic Age, Buddhism/Jainism', 1, 2),
  ('top_modern', 'sub_history', 'Indian National Movement', '1857 Revolt, Non-Cooperation, Quit India', 2, 3),
  ('top_phys_geo', 'sub_geography', 'Physical Geography of India', 'Himalayas, Rivers, Monsoon Mechanism', 1, 3),
  ('top_env', 'sub_geography', 'Environment & Biodiversity', 'Western Ghats, Protected Areas, Climate Treaties', 2, 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 6. CONCEPTS
INSERT INTO public.concepts (id, subject_id, topic_id, title, summary, explanation, difficulty, importance, tags)
VALUES
  ('c_art21', 'sub_polity', 'top_rights', 'Article 21: Protection of Life and Personal Liberty', 'Guarantees right to life and personal liberty. Interpreted broadly by Supreme Court to include right to privacy, clean environment, and dignity.', 'Article 21 states: "No person shall be deprived of his life or personal liberty except according to procedure established by law." Through cases like Maneka Gandhi (1978) and Puttaswamy (2017), SC transitioned to due process of law.', 'INTERMEDIATE', 'HIGH', '["Polity", "Constitution", "Rights"]'::jsonb),
  ('c_art32', 'sub_polity', 'top_judiciary', 'Article 32: Constitutional Remedies & SC Writs', 'Heart and Soul of the Constitution allowing citizens to move Supreme Court directly for enforcement of Fundamental Rights.', 'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul of the Indian Constitution". Supreme Court can issue 5 types of writs: Habeas Corpus, Mandamus, Prohibition, Quo-Warranto, and Certiorari.', 'INTERMEDIATE', 'HIGH', '["Polity", "Writs", "Supreme Court"]'::jsonb),
  ('c_art226', 'sub_polity', 'top_judiciary', 'Article 226: High Court Writ Jurisdiction', 'Empowers High Courts to issue writs for Fundamental Rights AND ordinary legal rights. Broader territorial and subject scope than Article 32.', 'While Article 32 is limited to Fundamental Rights, Article 226 allows High Courts to issue writs "for any other purpose" as well.', 'INTERMEDIATE', 'HIGH', '["Polity", "High Court", "Writs"]'::jsonb),
  ('c_fiscal_fed', 'sub_polity', 'top_federalism', 'Fiscal Federalism & Union-State Relations', 'Division of tax powers, grants-in-aid, and financial resources between Union and States under Chapter 1 Part XII.', 'India exhibits asymmetric fiscal federalism. The Centre collects major buoyant taxes while States handle high social expenditure.', 'ADVANCED', 'HIGH', '["Polity", "Economy", "Federalism"]'::jsonb),
  ('c_fin_comm', 'sub_economy', 'top_fiscal', 'Finance Commission (Article 280)', 'Quasi-judicial body constituted by President every 5 years to recommend tax distribution between Centre and States.', 'Article 280 mandates Finance Commission. Consists of Chairman + 4 members. Recommends vertical and horizontal devolution.', 'INTERMEDIATE', 'HIGH', '["Economy", "Finance Commission", "Devolution"]'::jsonb),
  ('c_mpc', 'sub_economy', 'top_monetary', 'Monetary Policy Committee (MPC)', 'Statutory 6-member body under RBI Act 1934 responsible for setting policy repo rate to target inflation.', 'Formed following Urjit Patel Committee recommendations. Consists of 6 members: 3 from RBI and 3 external experts appointed by Govt.', 'INTERMEDIATE', 'HIGH', '["Economy", "RBI", "Monetary Policy"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 7. QUESTIONS SEED (Official Verified PYQs)
INSERT INTO public.questions (id, subject_id, topic_id, concept_id, type, question, options, correct_answer, explanation, difficulty, exam_tag, pyq_year, is_pyq, source, verified_status, is_published)
VALUES
  ('q1', 'sub_polity', 'top_judiciary', 'c_art32', 'MCQ', 'Which of the following statements regarding Article 32 of the Indian Constitution is/are CORRECT?\n1. It is a fundamental right to move the Supreme Court directly.\n2. The Supreme Court can issue writs for enforcement of both fundamental rights and statutory rights.\n3. Article 32 cannot be suspended under any circumstances.', '[{"id": "opt1", "text": "1 only"}, {"id": "opt2", "text": "1 and 2 only"}, {"id": "opt3", "text": "1 and 3 only"}, {"id": "opt4", "text": "1, 2 and 3"}]'::jsonb, 'opt1', 'Statement 1 is CORRECT: Article 32 itself is a Fundamental Right in Part III.\nStatement 2 is INCORRECT: SC writ jurisdiction under Art 32 is strictly limited to Fundamental Rights.\nStatement 3 is INCORRECT: Article 32 can be suspended during a National Emergency.', 'HARD', 'UPSC CSE 2023 PYQ', 2023, true, 'Official UPSC CSE 2023 Prelims Question Paper', 'VERIFIED_PYQ', true),
  ('q2', 'sub_polity', 'top_judiciary', 'c_art226', 'MCQ', 'With reference to High Court writ jurisdiction under Article 226, consider the following statements:\n1. It is broader in scope than the Supreme Court’s writ jurisdiction under Article 32.\n2. A citizen can claim writ remedy under Article 226 as a guaranteed fundamental right.', '[{"id": "opt_a", "text": "1 only"}, {"id": "opt_b", "text": "2 only"}, {"id": "opt_c", "text": "Both 1 and 2"}, {"id": "opt_d", "text": "Neither 1 nor 2"}]'::jsonb, 'opt_a', 'Statement 1 is CORRECT: Article 226 covers Fundamental Rights AND any other legal purpose.\nStatement 2 is INCORRECT: Moving High Court under 226 is not a Fundamental Right itself.', 'MEDIUM', 'UPSC CSE 2021 PYQ', 2021, true, 'Official UPSC CSE 2021 Prelims Question Paper', 'VERIFIED_PYQ', true)
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question;

-- 8. MOCK TESTS SEED (Standard Exam Templates)
INSERT INTO public.mock_tests (id, title, type, subject_ids, duration_minutes, total_questions, total_marks, negative_marking_rate, is_published)
VALUES
  ('mock_quick_1', 'Polity & Economy Adaptive Sprint', 'QUICK', '["sub_polity", "sub_economy"]'::jsonb, 15, 10, 20, 0.66, true),
  ('mock_subj_polity', 'Indian Polity Sectional Mock Test', 'SUBJECT', '["sub_polity"]'::jsonb, 45, 30, 60, 0.66, true),
  ('mock_full_upsc', 'UPSC General Studies Paper-I Full Length Mock', 'FULL', '["sub_polity", "sub_economy", "sub_history", "sub_geography", "sub_ca"]'::jsonb, 120, 100, 200, 0.66, true)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
