import { createClient } from '@supabase/supabase-js';
import { userRepository } from '../server/repositories/UserRepository.js';
import { questionRepository } from '../server/repositories/QuestionRepository.js';
import pool from '../server/db/pool.js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('--- STARTING DATA MIGRATION FROM JSON DUMP TO POSTGRESQL ---');
  try {
    const { data, error } = await supabase.storage
      .from('ikshovia-uploads')
      .download('db/ikshovia_store.json');

    if (error || !data) {
      console.log('No JSON store found in Supabase Storage or error:', error?.message);
      return;
    }

    const text = await data.text();
    const json = JSON.parse(text);

    if (json.users && Array.isArray(json.users)) {
      console.log(`Found ${json.users.length} users in JSON store.`);
      const passwordsMap = new Map<string, string>();
      if (json.userPasswords && Array.isArray(json.userPasswords)) {
        for (const entry of json.userPasswords) {
          const [email, hash] = Array.isArray(entry) ? entry : [entry.k, entry.v];
          if (email && hash) passwordsMap.set(String(email).toLowerCase(), hash);
        }
      }

      for (const entry of json.users) {
        const u = Array.isArray(entry) ? entry[1] : (entry.v || entry);
        if (!u || !u.id || !u.email) continue;

        const storedHash = passwordsMap.get(u.email.toLowerCase()) || 'ikshovia_auth_salt_2026';
        try {
          await userRepository.createUser({
            id: u.id,
            email: u.email,
            name: u.name || 'User',
            avatarUrl: u.avatarUrl,
            role: u.role || 'USER',
            isOnboarded: u.isOnboarded || false,
            passwordHash: storedHash,
            onboarding: u.onboarding,
          });
          console.log(`Successfully migrated user: ${u.email} (${u.id})`);
        } catch (e: any) {
          console.log(`User ${u.email} already exists or error:`, e.message);
        }
      }
    }

    if (json.questions && Array.isArray(json.questions)) {
      console.log(`Found ${json.questions.length} questions in JSON store.`);
      let count = 0;
      for (const entry of json.questions) {
        const q = Array.isArray(entry) ? entry[1] : (entry.v || entry);
        if (!q || !q.id || !q.question) continue;
        try {
          await questionRepository.create(q);
          count++;
        } catch (e: any) {
          console.log(`Failed to migrate question ${q.id}:`, e.message);
        }
      }
      console.log(`Successfully migrated ${count} questions to PostgreSQL.`);
    }

    console.log('--- MIGRATION COMPLETE ---');
  } catch (err: any) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
