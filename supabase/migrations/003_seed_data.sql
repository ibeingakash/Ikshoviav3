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
  ('student@ikshovia.com', 'a30366eb4b857dc4ceea1ec9f1f0a28f7fb7058becc2a35ae75be79ef5709ee09be374ea3d4dbe927a4e69b59b1285e68ec68bfe86ce294028ec1f99cddb6e2f'),
  ('admin@ikshovia.com', 'a726ea72477174e99ef3ec0d69ef997edba1fbdc2ecbe11c34914a2a1bd71cc56d5cd4a22eeb38eb6ddbf5a88eec2e6c1df8aeaa15cd4b5b76eb154bb314fb50'),
  ('superadmin@ikshovia.com', '7d4715f33ea4840d8aa536bca482c3f9ff7e9a8f4cfa189c45037d4f9bfefbe5332fcecb6390a78cb1be85aeefcdedef2cb2b429074b7c62bb9fb811aeb2b13b')
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

-- 7. LEARNER MODEL SEED
INSERT INTO public.learner_models (user_id, overall_score, total_study_time_minutes, current_streak, highest_streak, active_days_count, confidence_bias, mistake_breakdown, subject_mastery, mastered_concepts_count, weak_concepts_count, due_revision_count)
VALUES
  ('usr_student', 71, 1420, 6, 12, 18, 'OVERCONFIDENT', '{"CONCEPT_CONFUSION": 6, "RECALL_FAILURE": 4, "CONCEPT_GAP": 3}'::jsonb, '{"sub_polity": 68, "sub_economy": 71}'::jsonb, 3, 4, 4)
ON CONFLICT (user_id) DO NOTHING;

-- 8. CONCEPT MASTERY SEED
INSERT INTO public.concept_mastery (user_id, concept_id, understanding, retention, application, accuracy, confidence, overall_mastery, attempts_count, correct_count, incorrect_count, time_spent_seconds, next_review_date)
VALUES
  ('usr_student', 'c_art21', 92, 85, 88, 90, 85, 88, 12, 11, 1, 1450, NOW() + INTERVAL '5 days'),
  ('usr_student', 'c_art32', 78, 65, 60, 68, 90, 68, 10, 7, 3, 980, NOW() - INTERVAL '1 day'),
  ('usr_student', 'c_art226', 72, 58, 55, 60, 82, 61, 8, 5, 3, 820, NOW() - INTERVAL '2 days'),
  ('usr_student', 'c_fiscal_fed', 65, 52, 45, 50, 60, 52, 6, 3, 3, 1100, NOW() - INTERVAL '3 days'),
  ('usr_student', 'c_mpc', 88, 82, 85, 86, 85, 85, 14, 12, 2, 1200, NOW() + INTERVAL '6 days')
ON CONFLICT (user_id, concept_id) DO NOTHING;

-- 9. QUESTIONS SEED
INSERT INTO public.questions (id, subject_id, topic_id, concept_id, type, question, options, correct_answer, explanation, difficulty, exam_tag, pyq_year, is_pyq, source, verified_status, is_published)
VALUES
  ('q1', 'sub_polity', 'top_judiciary', 'c_art32', 'MCQ', 'Which of the following statements regarding Article 32 of the Indian Constitution is/are CORRECT?\n1. It is a fundamental right to move the Supreme Court directly.\n2. The Supreme Court can issue writs for enforcement of both fundamental rights and statutory rights.\n3. Article 32 cannot be suspended under any circumstances.', '[{"id": "opt1", "text": "1 only"}, {"id": "opt2", "text": "1 and 2 only"}, {"id": "opt3", "text": "1 and 3 only"}, {"id": "opt4", "text": "1, 2 and 3"}]'::jsonb, 'opt1', 'Statement 1 is CORRECT: Article 32 itself is a Fundamental Right in Part III.\nStatement 2 is INCORRECT: SC writ jurisdiction under Art 32 is strictly limited to Fundamental Rights.\nStatement 3 is INCORRECT: Article 32 can be suspended during a National Emergency.', 'HARD', 'UPSC CSE 2023 PYQ', 2023, true, 'Official UPSC CSE 2023 Prelims Question Paper', 'VERIFIED_PYQ', true),
  ('q2', 'sub_polity', 'top_judiciary', 'c_art226', 'MCQ', 'With reference to High Court writ jurisdiction under Article 226, consider the following statements:\n1. It is broader in scope than the Supreme Court’s writ jurisdiction under Article 32.\n2. A citizen can claim writ remedy under Article 226 as a guaranteed fundamental right.', '[{"id": "opt_a", "text": "1 only"}, {"id": "opt_b", "text": "2 only"}, {"id": "opt_c", "text": "Both 1 and 2"}, {"id": "opt_d", "text": "Neither 1 nor 2"}]'::jsonb, 'opt_a', 'Statement 1 is CORRECT: Article 226 covers Fundamental Rights AND any other legal purpose.\nStatement 2 is INCORRECT: Moving High Court under 226 is not a Fundamental Right itself.', 'MEDIUM', 'UPSC CSE 2021 PYQ', 2021, true, 'Official UPSC CSE 2021 Prelims Question Paper', 'VERIFIED_PYQ', true)
ON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question;

-- 10. MOCK TESTS SEED
INSERT INTO public.mock_tests (id, title, type, subject_ids, duration_minutes, total_questions, total_marks, negative_marking_rate, is_published)
VALUES
  ('mock_quick_1', 'Polity & Economy Adaptive Sprint', 'QUICK', '["sub_polity", "sub_economy"]'::jsonb, 15, 10, 20, 0.66, true),
  ('mock_subj_polity', 'Indian Polity Sectional Mock Test', 'SUBJECT', '["sub_polity"]'::jsonb, 45, 30, 60, 0.66, true),
  ('mock_full_upsc', 'UPSC General Studies Paper-I Full Length Mock', 'FULL', '["sub_polity", "sub_economy", "sub_history", "sub_geography", "sub_ca"]'::jsonb, 120, 100, 200, 0.66, true)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- 11. GOALS SEED
INSERT INTO public.goals (id, user_id, title, target_exam, target_date, daily_study_minutes, subjects, status, progress_percentage)
VALUES
  ('goal_1', 'usr_student', 'Crack UPSC Civil Services Prelims 2026', 'UPSC CSE 2026', '2026-05-24', 120, '["sub_polity", "sub_economy", "sub_history", "sub_geography"]'::jsonb, 'ACTIVE', 64)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;
