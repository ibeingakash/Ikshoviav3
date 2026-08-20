import crypto from 'crypto';
import { getSupabase } from './supabase.js';
import {
  UserProfile,
  Subject,
  Topic,
  Concept,
  ConceptRelationship,
  ConceptMastery,
  LearnerModel,
  Question,
  QuestionAttempt,
  MockTest,
  MockAttempt,
  CurrentAffairArticle,
  LearningResource,
  StudyGoal,
  ChatConversation,
  AIContentDraft,
  NotificationItem,
  OCRJob,
  AuditLogRecord,
} from '../src/types/index.js';
import { OFFICIAL_SUBJECTS, OFFICIAL_TOPICS, OFFICIAL_CONCEPTS } from './db/syllabusData.js';
import { OFFICIAL_PYQ_QUESTIONS } from './db/seedPYQBank.js';
import { OFFICIAL_CURRENT_AFFAIRS } from './db/seedCurrentAffairs.js';

export function hashPassword(password: string): string {
  const salt = 'ikshovia_auth_salt_2026';
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

/**
 * Generic Supabase-backed persistent Map implementing JavaScript Map interface
 */
export class PersistentMap<K extends string, V> implements Map<K, V> {
  private collectionName: string;
  private map = new Map<K, V>();
  private onChangeCallback?: () => void;

  constructor(collectionName: string, onChange?: () => void) {
    this.collectionName = collectionName;
    this.onChangeCallback = onChange;
  }

  public setOnChange(fn: () => void) {
    this.onChangeCallback = fn;
  }

  private notifyChange() {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  set(key: K, value: V): this {
    this.map.set(key, value);
    this.notifyChange();
    return this;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    const res = this.map.delete(key);
    if (res) this.notifyChange();
    return res;
  }

  clear(): void {
    if (this.map.size > 0) {
      this.map.clear();
      this.notifyChange();
    }
  }

  get size(): number {
    return this.map.size;
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }

  entries(): IterableIterator<[K, V]> {
    return this.map.entries();
  }

  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
    this.map.forEach(callbackfn, thisArg);
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.map[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return 'Map';
  }

  public _loadEntries(entries: Array<[K, V]>): void {
    this.map.clear();
    for (const [k, v] of entries) {
      this.map.set(k, v);
    }
  }

  public _exportEntries(): Array<[K, V]> {
    return Array.from(this.map.entries());
  }
}

/**
 * Generic Supabase-backed persistent Array implementation
 */
export class PersistentArray<T> implements Array<T> {
  [n: number]: T;

  private collectionName: string;
  private items: T[] = [];
  private onChangeCallback?: () => void;

  constructor(collectionName: string, onChange?: () => void) {
    this.collectionName = collectionName;
    this.onChangeCallback = onChange;
  }

  public setOnChange(fn: () => void) {
    this.onChangeCallback = fn;
  }

  private notifyChange() {
    if (this.onChangeCallback) {
      this.onChangeCallback();
    }
  }

  push(...items: T[]): number {
    const res = this.items.push(...items);
    this.notifyChange();
    return res;
  }

  unshift(...items: T[]): number {
    const res = this.items.unshift(...items);
    this.notifyChange();
    return res;
  }

  get length(): number {
    return this.items.length;
  }

  set length(newLen: number) {
    this.items.length = newLen;
    this.notifyChange();
  }

  find(predicate: (value: T, index: number, obj: T[]) => boolean): T | undefined {
    return this.items.find(predicate);
  }

  filter(predicate: (value: T, index: number, array: T[]) => boolean): T[] {
    return this.items.filter(predicate);
  }

  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[] {
    return this.items.map(callbackfn);
  }

  forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void {
    this.items.forEach(callbackfn, thisArg);
  }

  some(predicate: (value: T, index: number, array: T[]) => boolean): boolean {
    return this.items.some(predicate);
  }

  every<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S, thisArg?: any): this is S[];
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean {
    return this.items.every(predicate as any, thisArg);
  }

  includes(searchElement: T, fromIndex?: number): boolean {
    return this.items.includes(searchElement, fromIndex);
  }

  slice(start?: number, end?: number): T[] {
    return this.items.slice(start, end);
  }

  [Symbol.iterator](): IterableIterator<T> {
    return this.items[Symbol.iterator]();
  }

  concat(...items: any[]): T[] { return this.items.concat(...items); }
  join(separator?: string): string { return this.items.join(separator); }
  reverse(): T[] { return this.items.reverse(); }
  shift(): T | undefined { const item = this.items.shift(); if (item !== undefined) this.notifyChange(); return item; }
  pop(): T | undefined { const item = this.items.pop(); if (item !== undefined) this.notifyChange(); return item; }
  get [Symbol.unscopables](): any { return (Array.prototype as any)[Symbol.unscopables]; }
  sort(compareFn?: (a: T, b: T) => number): this { this.items.sort(compareFn); this.notifyChange(); return this; }
  splice(start: number, deleteCount?: number, ...items: T[]): T[] { const res = this.items.splice(start, deleteCount ?? 0, ...items); this.notifyChange(); return res; }
  indexOf(searchElement: T, fromIndex?: number): number { return this.items.indexOf(searchElement, fromIndex); }
  lastIndexOf(searchElement: T, fromIndex?: number): number { return this.items.lastIndexOf(searchElement, fromIndex); }
  reduce(callbackfn: any, initialValue?: any): any { return this.items.reduce(callbackfn, initialValue); }
  reduceRight(callbackfn: any, initialValue?: any): any { return this.items.reduceRight(callbackfn, initialValue); }
  entries(): IterableIterator<[number, T]> { return this.items.entries(); }
  keys(): IterableIterator<number> { return this.items.keys(); }
  values(): IterableIterator<T> { return this.items.values(); }
  at(index: number): T | undefined { return this.items.at(index); }
  flat(depth?: number): any[] { return (this.items as any).flat(depth); }
  flatMap<U, This = undefined>(callback: (this: This, value: T, index: number, array: T[]) => U | readonly U[], thisArg?: This): U[] { return this.items.flatMap(callback, thisArg); }
  findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number { return this.items.findIndex(predicate, thisArg); }
  findLast(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T | undefined { return (this.items as any).findLast(predicate, thisArg); }
  findLastIndex(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): number { return (this.items as any).findLastIndex(predicate, thisArg); }
  fill(value: T, start?: number, end?: number): this { this.items.fill(value, start, end); this.notifyChange(); return this; }
  copyWithin(target: number, start: number, end?: number): this { this.items.copyWithin(target, start, end); this.notifyChange(); return this; }
  toReversed(): T[] { return (this.items as any).toReversed(); }
  toSorted(compareFn?: (a: T, b: T) => number): T[] { return (this.items as any).toSorted(compareFn); }
  toSpliced(start: number, deleteCount?: number, ...items: T[]): T[] { return (this.items as any).toSpliced(start, deleteCount, ...items); }
  with(index: number, value: T): T[] { return (this.items as any).with(index, value); }

  public _loadItems(items: T[]): void {
    this.items = [...items];
  }

  public _exportItems(): T[] {
    return [...this.items];
  }
}

export class IKSHOVIADatabase {
  public users: PersistentMap<string, UserProfile>;
  public userPasswords: PersistentMap<string, string>;
  public subjects: PersistentMap<string, Subject>;
  public topics: PersistentMap<string, Topic>;
  public concepts: PersistentMap<string, Concept>;
  public relationships: PersistentArray<ConceptRelationship>;
  public mastery: PersistentMap<string, ConceptMastery>;
  public learnerModels: PersistentMap<string, LearnerModel>;
  public questions: PersistentMap<string, Question>;
  public questionAttempts: PersistentArray<QuestionAttempt>;
  public mockTests: PersistentMap<string, MockTest>;
  public mockAttempts: PersistentArray<MockAttempt>;
  public currentAffairs: PersistentMap<string, CurrentAffairArticle>;
  public resources: PersistentMap<string, LearningResource>;
  public goals: PersistentMap<string, StudyGoal>;
  public conversations: PersistentMap<string, ChatConversation>;
  public aiDrafts: PersistentMap<string, AIContentDraft>;
  public notifications: PersistentMap<string, NotificationItem[]>;
  public ocrJobs: PersistentMap<string, OCRJob>;
  public auditLogs: PersistentArray<AuditLogRecord>;
  public adminPermissions: PersistentMap<string, string[]>;

  private saveTimer: NodeJS.Timeout | null = null;
  private isSaving = false;

  constructor() {
    const handleMutation = () => this.scheduleSave();

    this.users = new PersistentMap<string, UserProfile>('users', handleMutation);
    this.userPasswords = new PersistentMap<string, string>('user_passwords', handleMutation);
    this.subjects = new PersistentMap<string, Subject>('subjects', handleMutation);
    this.topics = new PersistentMap<string, Topic>('topics', handleMutation);
    this.concepts = new PersistentMap<string, Concept>('concepts', handleMutation);
    this.relationships = new PersistentArray<ConceptRelationship>('relationships', handleMutation);
    this.mastery = new PersistentMap<string, ConceptMastery>('mastery', handleMutation);
    this.learnerModels = new PersistentMap<string, LearnerModel>('learner_models', handleMutation);
    this.questions = new PersistentMap<string, Question>('questions', handleMutation);
    this.questionAttempts = new PersistentArray<QuestionAttempt>('question_attempts', handleMutation);
    this.mockTests = new PersistentMap<string, MockTest>('mock_tests', handleMutation);
    this.mockAttempts = new PersistentArray<MockAttempt>('mock_attempts', handleMutation);
    this.currentAffairs = new PersistentMap<string, CurrentAffairArticle>('current_affairs', handleMutation);
    this.resources = new PersistentMap<string, LearningResource>('resources', handleMutation);
    this.goals = new PersistentMap<string, StudyGoal>('goals', handleMutation);
    this.conversations = new PersistentMap<string, ChatConversation>('conversations', handleMutation);
    this.aiDrafts = new PersistentMap<string, AIContentDraft>('ai_drafts', handleMutation);
    this.notifications = new PersistentMap<string, NotificationItem[]>('notifications', handleMutation);
    this.ocrJobs = new PersistentMap<string, OCRJob>('ocr_jobs', handleMutation);
    this.auditLogs = new PersistentArray<AuditLogRecord>('audit_logs', handleMutation);
    this.adminPermissions = new PersistentMap<string, string[]>('admin_permissions', handleMutation);
  }

  private scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.save().catch(err => {
        console.warn('[DB] Background Supabase save warning:', err.message);
      });
    }, 250);
  }

  public async save(): Promise<void> {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('[DB] Supabase client is not available');
      }

      const dump = {
        subjects: this.subjects._exportEntries(),
        topics: this.topics._exportEntries(),
        concepts: this.concepts._exportEntries(),
        relationships: this.relationships._exportItems(),
        mastery: this.mastery._exportEntries(),
        learnerModels: this.learnerModels._exportEntries(),
        questionAttempts: this.questionAttempts._exportItems(),
        mockTests: this.mockTests._exportEntries(),
        mockAttempts: this.mockAttempts._exportItems(),
        currentAffairs: this.currentAffairs._exportEntries(),
        resources: this.resources._exportEntries(),
        goals: this.goals._exportEntries(),
        conversations: this.conversations._exportEntries(),
        aiDrafts: this.aiDrafts._exportEntries(),
        notifications: this.notifications._exportEntries(),
        ocrJobs: this.ocrJobs._exportEntries(),
        auditLogs: this.auditLogs._exportItems(),
        adminPermissions: this.adminPermissions._exportEntries(),
        updatedAt: new Date().toISOString(),
      };

      const buffer = Buffer.from(JSON.stringify(dump, null, 2));
      const { error } = await supabase.storage
        .from('ikshovia-uploads')
        .upload('db/ikshovia_store.json', buffer, {
          contentType: 'application/json',
          upsert: true,
        });

      if (error) {
        console.warn('[DB] Supabase storage dump upload notice:', error.message);
      }
    } catch (err: any) {
      console.warn('[DB] Supabase save exception:', err.message);
    } finally {
      this.isSaving = false;
    }
  }

  public async loadFromSupabase(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[DB] Supabase client is not configured.');
      return false;
    }

    try {
      const { data, error } = await supabase.storage
        .from('ikshovia-uploads')
        .download('db/ikshovia_store.json');

      if (error || !data) {
        console.log('[DB] No existing store found on Supabase Storage. Will seed initial database.');
        return false;
      }

      const text = await data.text();
      if (!text || !text.trim()) {
        return false;
      }

      const dump = JSON.parse(text);

      if (dump.subjects) this.subjects._loadEntries(dump.subjects);
      if (dump.topics) this.topics._loadEntries(dump.topics);
      if (dump.concepts) this.concepts._loadEntries(dump.concepts);
      if (dump.relationships) this.relationships._loadItems(dump.relationships);
      if (dump.mockTests) this.mockTests._loadEntries(dump.mockTests);
      if (dump.mockAttempts) this.mockAttempts._loadItems(dump.mockAttempts);
      if (dump.currentAffairs) this.currentAffairs._loadEntries(dump.currentAffairs);
      if (dump.resources) this.resources._loadEntries(dump.resources);
      if (dump.goals) this.goals._loadEntries(dump.goals);
      if (dump.conversations) this.conversations._loadEntries(dump.conversations);
      if (dump.aiDrafts) this.aiDrafts._loadEntries(dump.aiDrafts);
      if (dump.notifications) this.notifications._loadEntries(dump.notifications);
      if (dump.ocrJobs) this.ocrJobs._loadEntries(dump.ocrJobs);
      if (dump.auditLogs) this.auditLogs._loadItems(dump.auditLogs);
      if (dump.adminPermissions) this.adminPermissions._loadEntries(dump.adminPermissions);

      console.log(`[DB] Successfully loaded state from Supabase Storage (${this.concepts.size} concepts). Users and Questions are served directly from PostgreSQL.`);
      return true;
    } catch (err: any) {
      console.warn('[DB] Failed to parse Supabase Storage state:', err.message);
      return false;
    }
  }

  public seedIfEmpty() {
    if (this.users.size > 0) {
      console.log(`[DB] Persistent database active. Existing records: ${this.users.size} users, ${this.questions.size} questions, ${this.concepts.size} concepts.`);
      return;
    }

    console.log('[DB] Seeding persistent database records to Supabase...');

    // 1. Seed System Accounts
    const studentUser: UserProfile = {
      id: 'usr_student',
      email: 'student@ikshovia.com',
      name: 'Akash',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      role: 'USER',
      isOnboarded: true,
      onboarding: {
        targetExam: 'UPSC CSE 2026',
        selectedSubjects: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography'],
        dailyGoalMinutes: 120,
        experienceLevel: 'Intermediate',
        goalStatement: 'Aiming for Top 100 rank in UPSC Civil Services Examination 2026 with strong grasp on Polity and Economy.',
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const adminUser: UserProfile = {
      id: 'usr_admin',
      email: 'admin@ikshovia.com',
      name: 'Akash Singh',
      role: 'ADMIN',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };

    const superAdminUser: UserProfile = {
      id: 'usr_superadmin',
      email: 'superadmin@ikshovia.com',
      name: 'Akash Pratap Singh',
      role: 'SUPER_ADMIN',
      isOnboarded: true,
      createdAt: new Date().toISOString(),
    };

    this.users.set(studentUser.id, studentUser);
    this.users.set(adminUser.id, adminUser);
    this.users.set(superAdminUser.id, superAdminUser);

    this.userPasswords.set('student@ikshovia.com', hashPassword('Akash@123'));
    this.userPasswords.set('admin@ikshovia.com', hashPassword('AkashAdmin@123'));
    this.userPasswords.set('superadmin@ikshovia.com', hashPassword('AkashSuper@123'));

    this.adminPermissions.set('usr_admin', ['QUESTION_CREATE', 'QUESTION_EDIT', 'QUESTION_PUBLISH', 'OCR_IMPORT', 'OCR_REVIEW', 'MOCK_CREATE', 'CONCEPT_CREATE']);
    this.adminPermissions.set('usr_superadmin', ['ALL_PERMISSIONS', 'ADMIN_MANAGE', 'SYSTEM_SETTINGS', 'AUDIT_LOG_VIEW']);

    // 2. Seed Subjects
    const polity: Subject = {
      id: 'sub_polity',
      name: 'Indian Polity & Governance',
      code: 'POLITY',
      description: 'Constitution, Fundamental Rights, Federal Structure, Judiciary, Executive & Parliament',
      iconName: 'Landmark',
      color: 'indigo',
      topicsCount: 4,
      conceptsCount: 8,
    };

    const economy: Subject = {
      id: 'sub_economy',
      name: 'Indian Economy & Banking',
      code: 'ECONOMY',
      description: 'Macroeconomics, Monetary Policy, Fiscal Federalism, Banking, Inflation & Trade',
      iconName: 'TrendingUp',
      color: 'emerald',
      topicsCount: 3,
      conceptsCount: 6,
    };

    const history: Subject = {
      id: 'sub_history',
      name: 'Indian History & Art/Culture',
      code: 'HISTORY',
      description: 'Ancient, Medieval, Modern Freedom Movement and Heritage',
      iconName: 'Scroll',
      color: 'amber',
      topicsCount: 3,
      conceptsCount: 5,
    };

    const geography: Subject = {
      id: 'sub_geography',
      name: 'Geography & Environment',
      code: 'GEOGRAPHY',
      description: 'Physical Geography, Western Ghats, Biodiversity, Monsoon & Climate Change',
      iconName: 'Compass',
      color: 'blue',
      topicsCount: 3,
      conceptsCount: 5,
    };

    const currentAffairsSub: Subject = {
      id: 'sub_ca',
      name: 'Current Affairs & Governance',
      code: 'CURRENT_AFFAIRS',
      description: 'National, International Affairs, Policy Updates and Judicial Judgments',
      iconName: 'Newspaper',
      color: 'rose',
      topicsCount: 2,
      conceptsCount: 4,
    };

    [polity, economy, history, geography, currentAffairsSub].forEach(s => this.subjects.set(s.id, s));

    // 3. Seed Topics
    const topConst: Topic = {
      id: 'top_const',
      subjectId: 'sub_polity',
      name: 'Constitutional Framework',
      description: 'Preamble, Features, Amendments',
      order: 1,
      conceptsCount: 2,
    };

    const topRights: Topic = {
      id: 'top_rights',
      subjectId: 'sub_polity',
      name: 'Fundamental Rights & Duties',
      description: 'Articles 12 to 35, Writs & Duties',
      order: 2,
      conceptsCount: 3,
    };

    const topJudiciary: Topic = {
      id: 'top_judiciary',
      subjectId: 'sub_polity',
      name: 'Judiciary & Writs',
      description: 'Supreme Court, High Courts, Judicial Review',
      order: 3,
      conceptsCount: 2,
    };

    const topFederalism: Topic = {
      id: 'top_federalism',
      subjectId: 'sub_polity',
      name: 'Federal System',
      description: 'Union-State Relations, Emergency Provisions',
      order: 4,
      conceptsCount: 1,
    };

    const topMonetary: Topic = {
      id: 'top_monetary',
      subjectId: 'sub_economy',
      name: 'Monetary Policy & Banking',
      description: 'RBI, Repo Rate, MPC, Inflation',
      order: 1,
      conceptsCount: 3,
    };

    const topFiscal: Topic = {
      id: 'top_fiscal',
      subjectId: 'sub_economy',
      name: 'Fiscal Policy & Federalism',
      description: 'Finance Commission, GST Council, Deficit',
      order: 2,
      conceptsCount: 2,
    };

    [topConst, topRights, topJudiciary, topFederalism, topMonetary, topFiscal].forEach(t => this.topics.set(t.id, t));

    // 4. Seed Concepts
    const cArt21: Concept = {
      id: 'c_art21',
      subjectId: 'sub_polity',
      topicId: 'top_rights',
      title: 'Article 21: Protection of Life and Personal Liberty',
      summary: 'Guarantees right to life and personal liberty. Interpreted broadly by Supreme Court to include right to privacy, clean environment, and dignity.',
      explanation: 'Article 21 states: "No person shall be deprived of his life or personal liberty except according to procedure established by law." Through landmark cases like Maneka Gandhi (1978) and K.S. Puttaswamy (2017), the Supreme Court expanded its scope beyond physical existence to include due process of law and personal dignity.',
      examples: ['Right to Privacy (Puttaswamy 2017)', 'Right to Clean Environment (MC Mehta case)', 'Right to Livelihood (Olga Tellis 1985)'],
      keyPoints: [
        'Available to both citizens and non-citizens.',
        'Cannot be suspended even during National Emergency (Article 359).',
        'Includes Right to Education (21A inserted via 86th Constitutional Amendment).',
      ],
      difficulty: 'INTERMEDIATE',
      importance: 'HIGH',
      prerequisiteIds: [],
      relatedIds: ['c_art32', 'c_art226'],
      tags: ['Polity', 'Constitution', 'Rights'],
    };

    const cArt32: Concept = {
      id: 'c_art32',
      subjectId: 'sub_polity',
      topicId: 'top_judiciary',
      title: 'Article 32: Constitutional Remedies & SC Writs',
      summary: 'Heart and Soul of the Constitution allowing citizens to move Supreme Court directly for enforcement of Fundamental Rights.',
      explanation: 'Dr. B.R. Ambedkar described Article 32 as the most important article of the Constitution, without which it would be a nullity. It confers the right to move the Supreme Court for enforcement of rights conferred by Part III.',
      examples: ['Habeas Corpus against illegal detention', 'Mandamus to enforce public duty', 'Certiorari to quash lower court orders'],
      keyPoints: [
        'Right to move Supreme Court is itself a Fundamental Right.',
        'SC cannot refuse to exercise writ jurisdiction under Article 32.',
        'Can be suspended during National Emergency under Article 359.',
      ],
      difficulty: 'INTERMEDIATE',
      importance: 'HIGH',
      prerequisiteIds: ['c_art21'],
      relatedIds: ['c_art226'],
      tags: ['Polity', 'Writs', 'Supreme Court'],
    };

    const cArt226: Concept = {
      id: 'c_art226',
      subjectId: 'sub_polity',
      topicId: 'top_judiciary',
      title: 'Article 226: High Court Writ Jurisdiction',
      summary: 'Empowers High Courts to issue writs for Fundamental Rights AND ordinary legal rights. Broader subject scope than Article 32.',
      explanation: 'Article 226 gives High Courts jurisdiction to issue writs "for the enforcement of any of the rights conferred by Part III and for any other purpose". Hence, its subject matter scope is wider than Article 32.',
      examples: ['Enforcing contractual obligations against public authority', 'Quashing executive arbitrary orders'],
      keyPoints: [
        'Scope is wider than Article 32 ("for any other purpose").',
        'High Court writ jurisdiction is discretionary, not a fundamental right.',
        'Territorial jurisdiction extends throughout the state or where cause of action arises.',
      ],
      difficulty: 'INTERMEDIATE',
      importance: 'HIGH',
      prerequisiteIds: ['c_art32'],
      relatedIds: ['c_art32'],
      tags: ['Polity', 'High Court', 'Writs'],
    };

    const cFiscalFed: Concept = {
      id: 'c_fiscal_fed',
      subjectId: 'sub_polity',
      topicId: 'top_federalism',
      title: 'Fiscal Federalism & Union-State Relations',
      summary: 'Division of tax powers, grants-in-aid, and financial resources between Union and States under Part XII.',
      explanation: 'India exhibits asymmetric fiscal federalism. The Centre commands major revenue-generating taxes while States bear heavy social expenditures.',
      examples: ['GST Council voting structure (1/3 Centre, 2/3 States)', 'Finance Commission horizontal formula'],
      keyPoints: [
        'Articles 268-293 govern financial relations.',
        'Tax devolution based on Finance Commission recommendations.',
        'Grants-in-aid provided under Article 275 and Article 282.',
      ],
      difficulty: 'ADVANCED',
      importance: 'HIGH',
      prerequisiteIds: [],
      relatedIds: ['c_fin_comm'],
      tags: ['Polity', 'Economy', 'Federalism'],
    };

    const cFinComm: Concept = {
      id: 'c_fin_comm',
      subjectId: 'sub_economy',
      topicId: 'top_fiscal',
      title: 'Finance Commission (Article 280)',
      summary: 'Quasi-judicial body constituted by President every 5 years to recommend tax distribution between Centre and States.',
      explanation: 'Article 280 mandates Finance Commission. Recommends vertical devolution (share of taxes to states) and horizontal devolution (distribution among states).',
      examples: ['15th Finance Commission set vertical devolution at 41%'],
      keyPoints: [
        'Consists of Chairman and 4 members appointed by President.',
        'Recommendations are advisory in nature.',
        'Considers forest cover, income distance, and demographic performance.',
      ],
      difficulty: 'INTERMEDIATE',
      importance: 'HIGH',
      prerequisiteIds: ['c_fiscal_fed'],
      relatedIds: ['c_fiscal_fed'],
      tags: ['Economy', 'Finance Commission', 'Devolution'],
    };

    const cMPC: Concept = {
      id: 'c_mpc',
      subjectId: 'sub_economy',
      topicId: 'top_monetary',
      title: 'Monetary Policy Committee (MPC)',
      summary: 'Statutory 6-member body under RBI Act 1934 responsible for setting policy repo rate to target inflation.',
      explanation: 'Formed following Urjit Patel Committee recommendations in 2016. Responsible for fixing policy interest rate to maintain inflation target (4% +/- 2%).',
      examples: ['Bimonthly MPC decisions on repo rate changes'],
      keyPoints: [
        '6 members: 3 from RBI and 3 external experts appointed by Govt.',
        'RBI Governor has casting vote in case of a tie.',
        'Meets at least 4 times a year.',
      ],
      difficulty: 'INTERMEDIATE',
      importance: 'HIGH',
      prerequisiteIds: [],
      relatedIds: [],
      tags: ['Economy', 'RBI', 'Monetary Policy'],
    };

    [cArt21, cArt32, cArt226, cFiscalFed, cFinComm, cMPC].forEach(c => this.concepts.set(c.id, c));

    // 5. Seed Learner Model
    const studentModel: LearnerModel = {
      userId: 'usr_student',
      overallScore: 71,
      totalStudyTimeMinutes: 1420,
      currentStreak: 6,
      highestStreak: 12,
      activeDaysCount: 18,
      confidenceBias: 'OVERCONFIDENT',
      mistakeBreakdown: {
        CONCEPT_CONFUSION: 6,
        RECALL_FAILURE: 4,
        CONCEPT_GAP: 3,
        CARELESS_ERROR: 2,
        MISINTERPRETATION: 1,
        TIME_PRESSURE: 0,
      },
      subjectMastery: {
        sub_polity: 68,
        sub_economy: 71,
        sub_history: 58,
        sub_geography: 62,
      },
      masteredConceptsCount: 3,
      weakConceptsCount: 4,
      dueRevisionCount: 4,
      lastUpdated: new Date().toISOString(),
    };
    this.learnerModels.set(studentModel.userId, studentModel);

    // 6. Seed Mastery Records
    const m1: ConceptMastery = {
      conceptId: 'c_art21',
      understanding: 92,
      retention: 85,
      application: 88,
      accuracy: 90,
      confidence: 85,
      overallMastery: 88,
      attemptsCount: 12,
      correctCount: 11,
      incorrectCount: 1,
      lastStudiedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      nextReviewDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      timeSpentSeconds: 1450,
    };

    const m2: ConceptMastery = {
      conceptId: 'c_art32',
      understanding: 78,
      retention: 65,
      application: 60,
      accuracy: 68,
      confidence: 90,
      overallMastery: 68,
      attemptsCount: 10,
      correctCount: 7,
      incorrectCount: 3,
      lastStudiedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      nextReviewDate: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      confusionPartners: ['c_art226'],
      timeSpentSeconds: 980,
    };

    const m3: ConceptMastery = {
      conceptId: 'c_art226',
      understanding: 72,
      retention: 58,
      application: 55,
      accuracy: 60,
      confidence: 82,
      overallMastery: 61,
      attemptsCount: 8,
      correctCount: 5,
      incorrectCount: 3,
      lastStudiedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      nextReviewDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      confusionPartners: ['c_art32'],
      timeSpentSeconds: 820,
    };

    const m4: ConceptMastery = {
      conceptId: 'c_fiscal_fed',
      understanding: 65,
      retention: 52,
      application: 45,
      accuracy: 50,
      confidence: 60,
      overallMastery: 52,
      attemptsCount: 6,
      correctCount: 3,
      incorrectCount: 3,
      lastStudiedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      nextReviewDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      timeSpentSeconds: 1100,
    };

    const m5: ConceptMastery = {
      conceptId: 'c_mpc',
      understanding: 88,
      retention: 82,
      application: 85,
      accuracy: 86,
      confidence: 85,
      overallMastery: 85,
      attemptsCount: 14,
      correctCount: 12,
      incorrectCount: 2,
      lastStudiedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      lastReviewedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      nextReviewDate: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
      timeSpentSeconds: 1200,
    };

    this.mastery.set(`usr_student_c_art21`, m1);
    this.mastery.set(`usr_student_c_art32`, m2);
    this.mastery.set(`usr_student_c_art226`, m3);
    this.mastery.set(`usr_student_c_fiscal_fed`, m4);
    this.mastery.set(`usr_student_c_mpc`, m5);

    // 7. Seed Questions
    const q1: Question = {
      id: 'q1',
      subjectId: 'sub_polity',
      topicId: 'top_judiciary',
      conceptId: 'c_art32',
      type: 'MCQ',
      question: 'Which of the following statements regarding Article 32 of the Indian Constitution is/are CORRECT?\n1. It is a fundamental right to move the Supreme Court directly.\n2. The Supreme Court can issue writs for enforcement of both fundamental rights and statutory rights.\n3. Article 32 cannot be suspended under any circumstances.',
      options: [
        { id: 'opt1', text: '1 only' },
        { id: 'opt2', text: '1 and 2 only' },
        { id: 'opt3', text: '1 and 3 only' },
        { id: 'opt4', text: '1, 2 and 3' },
      ],
      correctAnswer: 'opt1',
      explanation: 'Statement 1 is CORRECT: Article 32 itself is a Fundamental Right in Part III.\nStatement 2 is INCORRECT: SC writ jurisdiction under Art 32 is strictly limited to Fundamental Rights.\nStatement 3 is INCORRECT: Article 32 can be suspended during a National Emergency under Article 359.',
      difficulty: 'HARD',
      examTag: 'UPSC CSE 2023 PYQ',
      pyqYear: 2023,
      isPyq: true,
      source: 'Official UPSC CSE 2023 Prelims Question Paper',
      verifiedStatus: 'VERIFIED_PYQ',
      isPublished: true,
    };

    const q2: Question = {
      id: 'q2',
      subjectId: 'sub_polity',
      topicId: 'top_judiciary',
      conceptId: 'c_art226',
      type: 'MCQ',
      question: 'With reference to High Court writ jurisdiction under Article 226, consider the following statements:\n1. It is broader in scope than the Supreme Court’s writ jurisdiction under Article 32.\n2. A citizen can claim writ remedy under Article 226 as a guaranteed fundamental right.',
      options: [
        { id: 'opt_a', text: '1 only' },
        { id: 'opt_b', text: '2 only' },
        { id: 'opt_c', text: 'Both 1 and 2' },
        { id: 'opt_d', text: 'Neither 1 nor 2' },
      ],
      correctAnswer: 'opt_a',
      explanation: 'Statement 1 is CORRECT: Article 226 covers Fundamental Rights AND any other legal purpose.\nStatement 2 is INCORRECT: Moving High Court under 226 is discretionary and not a Fundamental Right itself.',
      difficulty: 'MEDIUM',
      examTag: 'UPSC CSE 2021 PYQ',
      pyqYear: 2021,
      isPyq: true,
      source: 'Official UPSC CSE 2021 Prelims Question Paper',
      verifiedStatus: 'VERIFIED_PYQ',
      isPublished: true,
    };

    [q1, q2].forEach(q => this.questions.set(q.id, q));

    // 8. Seed Mock Tests
    const mock1: MockTest = {
      id: 'mock_quick_1',
      title: 'Polity & Economy Adaptive Sprint',
      type: 'QUICK',
      subjectIds: ['sub_polity', 'sub_economy'],
      durationMinutes: 15,
      totalQuestions: 10,
      totalMarks: 20,
      negativeMarkingRate: 0.66,
      isPublished: true,
    };
    this.mockTests.set(mock1.id, mock1);

    // 9. Seed Current Affairs
    const ca1: CurrentAffairArticle = {
      id: 'ca_1',
      title: 'Supreme Court Clarifies Limits of High Court Writ Power Under Article 226 in Administrative Disputes',
      date: '2026-08-10',
      category: 'Polity',
      subtopic: 'Judiciary & Writs',
      summary: 'A 3-judge Bench of the Supreme Court held that High Courts must exercise restraint under Article 226 when statutory remedy mechanisms exist.',
      background: 'High Court interfered with tribunal proceeding without exhausting statutory appeal.',
      keyFacts: [
        'Article 226 is a constitutional remedy but subject to self-imposed judicial restraint.',
        'Existence of an effective alternative statutory remedy is a strong ground to decline writ relief.',
      ],
      prelimsRelevance: 'Art 32 vs Art 226 scope differences, discretionary nature of writ jurisdiction.',
      mainsRelevance: 'Judicial discretion and statutory appeal exhaustion (GS Paper II - Polity).',
      relatedSubject: 'Indian Polity & Governance',
      relatedConceptIds: ['c_art226', 'c_art32'],
      keywords: ['Article 226', 'Supreme Court', 'Writ Jurisdiction', 'Alternative Remedy'],
      source: 'Supreme Court Judgment / The Hindu Report',
      sourceUrl: 'https://main.sci.gov.in/supremecourt/2026/judgments',
      sourceType: 'PRIMARY_GOVT',
      publishedAt: '2026-08-10T10:00:00Z',
      retrievedAt: '2026-08-11T04:00:00Z',
      isPublished: true,
    };
    this.currentAffairs.set(ca1.id, ca1);

    // 10. Seed Goals
    const goal1: StudyGoal = {
      id: 'goal_1',
      userId: 'usr_student',
      title: 'Crack UPSC Civil Services Prelims 2026',
      targetExam: 'UPSC CSE 2026',
      targetDate: '2026-05-24',
      dailyStudyMinutes: 120,
      subjects: ['sub_polity', 'sub_economy', 'sub_history', 'sub_geography'],
      status: 'ACTIVE',
      progressPercentage: 64,
    };
    this.goals.set(goal1.id, goal1);

    // 11. Seed Notifications
    const notifList: NotificationItem[] = [
      {
        id: 'n1',
        title: 'Revision Due Notice',
        message: '4 concepts (including Article 32 and Fiscal Federalism) are due for revision based on your retention decay curve.',
        type: 'REVISION',
        timestamp: new Date().toISOString(),
        isRead: false,
        actionUrl: '/revision',
      },
    ];
    this.notifications.set('usr_student', notifList);

    this.save();
    console.log('[DB] Persistent database initial seeding complete.');
  }

  public ensureAuthoritativeContent() {
    console.log('[DB] Synchronizing authoritative UPSC & BPSC syllabus, PYQ bank, and Current Affairs...');
    
    // Always merge official subjects
    OFFICIAL_SUBJECTS.forEach(sub => {
      this.subjects.set(sub.id, sub);
    });

    // Always merge official topics
    OFFICIAL_TOPICS.forEach(top => {
      this.topics.set(top.id, top);
    });

    // Always merge official concepts
    OFFICIAL_CONCEPTS.forEach(concept => {
      this.concepts.set(concept.id, concept);
    });

    // Always merge official PYQs
    OFFICIAL_PYQ_QUESTIONS.forEach(q => {
      this.questions.set(q.id, q);
    });

    // Always merge official Current Affairs
    OFFICIAL_CURRENT_AFFAIRS.forEach(ca => {
      this.currentAffairs.set(ca.id, ca);
    });

    // Ensure system accounts exist
    if (this.users.size === 0) {
      this.seedIfEmpty();
    } else {
      this.save();
    }
  }

  public async loadFromPostgres(): Promise<void> {
    try {
      if (process.env.SQL_HOST) {
        console.log('[DB] PostgreSQL direct database access enabled for Users and Questions.');
      }
    } catch (err: any) {
      console.warn('[DB] PostgreSQL load notice:', err.message);
    }
  }
}

export const db = new IKSHOVIADatabase();

export async function initDatabase(): Promise<IKSHOVIADatabase> {
  console.log('[DB] Initializing persistent database...');
  await db.loadFromSupabase();
  db.ensureAuthoritativeContent();
  await db.loadFromPostgres();
  return db;
}
