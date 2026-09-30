import pool from './pool.js';

export interface TaxonomyClassificationInput {
  subjectId?: string | null;
  topicId?: string | null;
  conceptId?: string | null;
  topic?: string | null;
  questionType?: string | null;
  paperId?: string | null;
  paper?: string | null;
  gsPaper?: string | null;
}

export interface ResolvedTaxonomy {
  subjectId: string;
  topicId: string;
  conceptId: string;
}

// Exhaustive verified default mappings matching public.subjects, public.topics, and public.concepts in PostgreSQL
export const CANONICAL_TAXONOMY_BY_SUBJECT: Record<string, { topicId: string; conceptId: string }> = {
  sub_polity: { topicId: 'top_fundamental_rights', conceptId: 'c_art21' },
  sub_economy: { topicId: 'top_monetary_banking', conceptId: 'c_mpc' },
  sub_history: { topicId: 'top_ancient_india', conceptId: 'c_mauryan_empire' },
  sub_geography: { topicId: 'top_physical_geography', conceptId: 'c_indian_monsoon' },
  sub_environment: { topicId: 'top_biodiversity_parks', conceptId: 'c_env_biodiversity' },
  sub_security_ir: { topicId: 'top_internal_security', conceptId: 'c_sec_internal' },
  sub_ethics: { topicId: 'top_probity_governance', conceptId: 'c_probity_governance' },
  sub_bihar: { topicId: 'top_bihar_freedom', conceptId: 'c_bihar_freedom_1857' },
  sub_csat: { topicId: 'top_logical_reasoning', conceptId: 'c_csat_logical_reasoning' },
  sub_ca: { topicId: 'top_national_governance', conceptId: 'c_ca_general' },
  sub_full_length: { topicId: 'top_mixed', conceptId: 'c_mixed' },
};

// Known valid topic IDs in PostgreSQL
export const KNOWN_VALID_TOPICS = new Set([
  'top_const_framework', 'top_fundamental_rights', 'top_union_executive_parl', 'top_judiciary',
  'top_federalism_local', 'top_const_bodies', 'top_const', 'top_federalism', 'top_rights',
  'top_monetary_banking', 'top_fiscal_budget', 'top_agri_food', 'top_external_trade',
  'top_infra_industry', 'top_banking', 'top_fiscal', 'top_monetary',
  'top_ancient_india', 'top_medieval_india', 'top_modern_freedom', 'top_art_culture',
  'top_post_independence', 'top_ancient', 'top_modern',
  'top_physical_geography', 'top_indian_physiography', 'top_resources_minerals',
  'top_human_economic_geo', 'top_phys_geo', 'top_env',
  'top_biodiversity_parks', 'top_climate_change_global', 'top_pollution_laws', 'top_disaster_mgmt',
  'top_internal_security', 'top_cyber_security', 'top_bilateral_ties', 'top_global_groupings',
  'top_ethics_human', 'top_attitude_ei', 'top_probity_governance', 'top_case_studies',
  'top_bihar_ancient_medieval', 'top_bihar_freedom', 'top_bihar_geography', 'top_bihar_economy',
  'top_bihar_polity_panchayat', 'top_bihar_art_culture', 'top_bihar_ca',
  'top_reading_comp', 'top_logical_reasoning', 'top_quant_data',
  'top_national_governance', 'top_science_space', 'top_schemes_welfare',
  'top_mixed'
]);

// Known valid concept IDs in PostgreSQL
export const KNOWN_VALID_CONCEPTS = new Set([
  'c_art21', 'c_art32', 'c_basic_structure', 'c_preamble_values', 'c_fiscal_fed',
  'c_panchayati_raj_73', 'c_collegium_system', 'c_art226',
  'c_mpc', 'c_fin_comm', 'c_msp_agri',
  'c_mauryan_empire', 'c_champaran_1917',
  'c_indian_monsoon',
  'c_env_biodiversity', 'c_env_climate',
  'c_sec_internal', 'c_sec_bilateral',
  'c_probity_governance',
  'c_bihar_freedom_1857', 'c_bihar_ancient_magadha', 'c_patna_kalam',
  'c_bihar_economy_saat_nischay', 'c_bihar_kisan_sabha', 'c_bihar_quit_india_1942',
  'c_bihar_geo_rivers', 'c_bihar_panchayat_2006',
  'c_csat_reading_comp', 'c_csat_logical_reasoning', 'c_csat_quant_data',
  'c_ca_general',
  'c_mixed'
]);

/**
 * Resolves a safe, foreign-key compliant (subject_id, topic_id, concept_id) tuple
 * guaranteed to exist in public.subjects, public.topics, and public.concepts.
 */
export function resolveSafeClassification(input: TaxonomyClassificationInput): ResolvedTaxonomy {
  let sub = (input.subjectId || '').trim();
  const topInput = (input.topicId || '').trim();
  const conInput = (input.conceptId || '').trim();
  const topicTitle = (input.topic || '').trim();
  const paper = (input.paper || '').toUpperCase();
  const paperId = (input.paperId || '').toLowerCase();
  const gsPaper = (input.gsPaper || '').toUpperCase();

  // Detect CSAT papers and CSAT subject prefixes
  const isCsat = paper === 'CSAT' || paperId.includes('csat') || gsPaper.includes('CSAT') || sub.startsWith('sub_csat');

  if (isCsat) {
    sub = 'sub_csat';
  } else if (!CANONICAL_TAXONOMY_BY_SUBJECT[sub]) {
    if (sub === 'sub_science' || sub === 'sub_science_tech') {
      sub = 'sub_environment';
    } else if (sub === 'sub_current' || sub === 'sub_current_affairs') {
      sub = 'sub_ca';
    } else if (sub === 'sub_bihar_special') {
      sub = 'sub_bihar';
    } else {
      sub = 'sub_polity';
    }
  }

  const defaultTax = CANONICAL_TAXONOMY_BY_SUBJECT[sub] || CANONICAL_TAXONOMY_BY_SUBJECT.sub_polity;
  let topicId = defaultTax.topicId;
  let conceptId = defaultTax.conceptId;

  // Specific fine-grained mapping based on subject and topic title / inputs
  if (sub === 'sub_csat') {
    if (input.subjectId === 'sub_csat_comprehension' || input.questionType === 'COMPREHENSION' || /comprehension/i.test(topicTitle)) {
      topicId = 'top_reading_comp';
      conceptId = 'c_csat_reading_comp';
    } else if (input.subjectId === 'sub_csat_quant' || /quant|math|data|arithmetic|number|geometry/i.test(topicTitle)) {
      topicId = 'top_quant_data';
      conceptId = 'c_csat_quant_data';
    } else {
      topicId = 'top_logical_reasoning';
      conceptId = 'c_csat_logical_reasoning';
    }
  } else if (sub === 'sub_history') {
    if (/modern|freedom|1857|gandhi|congress|satyagraha|movement|viceroy|british|partition/i.test(topicTitle)) {
      topicId = 'top_modern_freedom';
      conceptId = 'c_champaran_1917';
    } else if (/art|culture|temple|architecture|paintings|sculpture|dance/i.test(topicTitle)) {
      topicId = 'top_art_culture';
      conceptId = 'c_mauryan_empire';
    } else {
      topicId = 'top_ancient_india';
      conceptId = 'c_mauryan_empire';
    }
  } else if (sub === 'sub_economy') {
    if (/agri|farm|crop|msp|procurement|pds/i.test(topicTitle)) {
      topicId = 'top_agri_food';
      conceptId = 'c_msp_agri';
    } else if (/fiscal|budget|tax|gst|deficit|frbm/i.test(topicTitle)) {
      topicId = 'top_fiscal_budget';
      conceptId = 'c_fin_comm';
    } else {
      topicId = 'top_monetary_banking';
      conceptId = 'c_mpc';
    }
  } else if (sub === 'sub_geography') {
    topicId = 'top_physical_geography';
    conceptId = 'c_indian_monsoon';
  } else if (sub === 'sub_environment') {
    if (/climate|paris|cop|unfccc|carbon|warming/i.test(topicTitle)) {
      topicId = 'top_climate_change_global';
      conceptId = 'c_env_climate';
    } else {
      topicId = 'top_biodiversity_parks';
      conceptId = 'c_env_biodiversity';
    }
  } else if (sub === 'sub_security_ir') {
    if (/bilateral|relation|quad|g20|brics|treaty|foreign|diplomacy/i.test(topicTitle)) {
      topicId = 'top_bilateral_ties';
      conceptId = 'c_sec_bilateral';
    } else {
      topicId = 'top_internal_security';
      conceptId = 'c_sec_internal';
    }
  } else if (sub === 'sub_ethics') {
    topicId = 'top_probity_governance';
    conceptId = 'c_probity_governance';
  } else if (sub === 'sub_bihar') {
    if (/ancient|magadha|maurya|nalanda|vikramshila/i.test(topicTitle)) {
      topicId = 'top_bihar_ancient_medieval';
      conceptId = 'c_bihar_ancient_magadha';
    } else if (/art|painting|kalam|madhubani|manjusha/i.test(topicTitle)) {
      topicId = 'top_bihar_art_culture';
      conceptId = 'c_patna_kalam';
    } else if (/economy|budget|survey|nischay/i.test(topicTitle)) {
      topicId = 'top_bihar_economy';
      conceptId = 'c_bihar_economy_saat_nischay';
    } else {
      topicId = 'top_bihar_freedom';
      conceptId = 'c_bihar_freedom_1857';
    }
  } else if (sub === 'sub_ca') {
    topicId = 'top_national_governance';
    conceptId = 'c_ca_general';
  } else if (sub === 'sub_polity') {
    if (/judic|writ|court|collegium|tribunal/i.test(topicTitle)) {
      topicId = 'top_judiciary';
      conceptId = 'c_art32';
    } else if (/structure|preamble/i.test(topicTitle)) {
      topicId = 'top_const_framework';
      conceptId = 'c_basic_structure';
    } else {
      topicId = 'top_fundamental_rights';
      conceptId = 'c_art21';
    }
  }

  // If the caller provided a valid topicId directly that is in KNOWN_VALID_TOPICS, prefer it
  if (topInput && KNOWN_VALID_TOPICS.has(topInput)) {
    topicId = topInput;
  }

  // If the caller provided a valid conceptId directly that is in KNOWN_VALID_CONCEPTS, prefer it
  if (conInput && KNOWN_VALID_CONCEPTS.has(conInput)) {
    conceptId = conInput;
  }

  // Absolute safety check: ensure the resulting topicId and conceptId are verified
  if (!KNOWN_VALID_TOPICS.has(topicId)) {
    topicId = defaultTax.topicId;
  }
  if (!KNOWN_VALID_CONCEPTS.has(conceptId)) {
    conceptId = defaultTax.conceptId;
  }

  return {
    subjectId: sub,
    topicId,
    conceptId,
  };
}
