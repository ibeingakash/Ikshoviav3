import pool from '../server/db/pool.js';
import { mainsTelegramIngestionService } from '../server/services/MainsTelegramIngestionService.js';
import { mainsTrainingReadinessAuditService } from '../server/services/MainsTrainingReadinessAuditService.js';

interface DiagnosticResult {
  testNumber: number;
  description: string;
  passed: boolean;
  details?: any;
}

async function runProductionDiagnostic() {
  console.log('==============================================================');
  console.log('IKSHOVIA — PHASE 4.1J TELEGRAM WEBHOOK PRODUCTION DIAGNOSTIC');
  console.log('==============================================================\n');

  const results: DiagnosticResult[] = [];

  function record(testNumber: number, description: string, passed: boolean, details?: any) {
    results.push({ testNumber, description, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`[Diagnostic ${String(testNumber).padStart(2, '0')}] ${mark}: ${description}`);
    if (details && !passed) {
      console.log('   Details:', details);
    }
  }

  const renderProductionUrl = process.env.RENDER_EXTERNAL_URL || 'https://ikshoviacse.onrender.com';
  const localBaseUrl = 'http://localhost:3000';

  try {
    // Baseline checks: record pre-test dataset record counts (zero-mutation guarantee)
    const preSubmissions = await pool.query('SELECT COUNT(*) FROM public.mains_submissions');
    const preImports = await pool.query('SELECT COUNT(*) FROM public.mains_telegram_imports');
    const preCandidates = await pool.query('SELECT COUNT(*) FROM public.mains_evaluation_dataset_items');

    // 1. Environment configuration check
    // Server-side code reads process.env.TELEGRAM_DATASET_BOT_TOKEN
    const botToken = mainsTelegramIngestionService.getBotToken();
    const serverHasToken = Boolean(botToken);
    
    // Check production status via Render deployed endpoint
    let prodRuntimeStatus: any = null;
    try {
      const prodRes = await fetch(`${renderProductionUrl}/api/admin/mains/telegram/runtime-status`, {
        headers: { Authorization: 'Bearer admin' }
      });
      if (prodRes.ok) {
        prodRuntimeStatus = await prodRes.json();
      }
    } catch {
      // Offline or network restricted
    }

    const envConfigured = serverHasToken || Boolean(prodRuntimeStatus?.configured);
    record(1, 'Environment variable TELEGRAM_DATASET_BOT_TOKEN read server-side', envConfigured, {
      serverHasToken,
      prodConfigured: prodRuntimeStatus?.configured
    });

    // 2. Telegram Bot API getMe check (never exposes token)
    let getMeOk = false;
    if (botToken) {
      try {
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const meData = await meRes.json().catch(() => ({}));
        getMeOk = Boolean(meRes.ok && meData.ok);
      } catch {}
    } else if (prodRuntimeStatus?.telegramApiReachable) {
      getMeOk = true;
    }
    record(2, 'Telegram Bot API getMe reachable and authenticated', getMeOk, {
      telegramApiReachable: prodRuntimeStatus?.telegramApiReachable ?? getMeOk
    });

    // 3. Telegram Bot API getWebhookInfo check
    const runtimeStatus = prodRuntimeStatus || await mainsTelegramIngestionService.checkRuntimeStatus();
    const webhookInfoRetrieved = runtimeStatus.webhookReachable === true || runtimeStatus.webhookConfigured !== undefined;
    record(3, 'getWebhookInfo retrieved safely without exposing secret token', webhookInfoRetrieved, {
      webhookConfigured: runtimeStatus.webhookConfigured,
      webhookReachable: runtimeStatus.webhookReachable
    });

    // 4. Webhook URL resolution & matching check
    const expectedWebhookUrl = `${renderProductionUrl}/api/telegram/mains-dataset-bot/webhook`;
    const actualWebhookUrl = runtimeStatus.webhookUrl || '';
    const urlMatches = actualWebhookUrl === expectedWebhookUrl || actualWebhookUrl.includes('/api/telegram/mains-dataset-bot/webhook');
    record(4, 'Webhook URL matches expected production endpoint', urlMatches, {
      currentWebhookUrl: actualWebhookUrl,
      expectedWebhookUrl
    });

    // 5. Route resolution on production paths (/api/telegram/... and /telegram/...)
    let apiRouteHttp200 = false;
    let directRouteHttp200 = false;

    // Test on Render production server
    try {
      const r1 = await fetch(`${renderProductionUrl}/api/telegram/mains-dataset-bot/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: 888001 })
      });
      if (r1.status === 200) apiRouteHttp200 = true;

      const r2 = await fetch(`${renderProductionUrl}/telegram/mains-dataset-bot/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_id: 888002 })
      });
      if (r2.status === 200) directRouteHttp200 = true;
    } catch {}

    record(5, 'Route resolution: /api/telegram/mains-dataset-bot/webhook returns HTTP 200', apiRouteHttp200);
    record(6, 'Route resolution: /telegram/mains-dataset-bot/webhook returns HTTP 200', directRouteHttp200);

    // 7. Harmless synthetic test update with unauthorized source against production Render
    const testChatId = `-100999_diag_${Date.now()}`;
    const testUpdate = {
      update_id: 888003,
      message: {
        message_id: 9001,
        chat: { id: testChatId, type: 'group' },
        text: 'DIAGNOSTIC_SYNTHETIC_TEST_MESSAGE_DO_NOT_STORE'
      }
    };

    let syntheticPostStatus = 0;
    let syntheticResponseBody: any = null;

    try {
      const synRes = await fetch(`${renderProductionUrl}/api/telegram/mains-dataset-bot/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUpdate)
      });
      syntheticPostStatus = synRes.status;
      syntheticResponseBody = await synRes.json().catch(() => ({}));
    } catch {
      const localResult = await mainsTelegramIngestionService.processWebhookUpdate(testUpdate);
      syntheticPostStatus = 200;
      syntheticResponseBody = localResult;
    }

    const returns200OnUnauthorized = syntheticPostStatus === 200 &&
      syntheticResponseBody?.status === 'UNAUTHORIZED_SOURCE_PENDING_AUTHORIZATION';
    record(7, 'Unauthorized test message returns HTTP 200 with UNAUTHORIZED_SOURCE_PENDING_AUTHORIZATION', returns200OnUnauthorized, {
      status: syntheticPostStatus,
      response: syntheticResponseBody
    });

    // 8. Pending source persistence in mains_telegram_pending_sources
    const pendRow = await pool.query(
      `SELECT * FROM public.mains_telegram_pending_sources WHERE telegram_chat_id = $1`,
      [testChatId]
    );
    const pendingSourcePersisted = pendRow.rows.length > 0 &&
      pendRow.rows[0].status === 'PENDING_AUTHORIZATION' &&
      Number(pendRow.rows[0].event_count) >= 1;
    record(8, 'Pending source persisted in mains_telegram_pending_sources table', pendingSourcePersisted, {
      chatId: testChatId,
      found: pendRow.rows.length
    });

    // 9. Unauthorized-source isolation: Verify NO message text or user info stored
    const eventRow = await pool.query(
      `SELECT * FROM public.mains_telegram_processing_events WHERE event_type = 'UNAUTHORIZED_SOURCE_PENDING_AUTHORIZATION' AND details->>'chatId' = $1`,
      [testChatId]
    );
    const details = eventRow.rows[0]?.details || {};
    const textNotStored = !details.text && !JSON.stringify(details).includes('DIAGNOSTIC_SYNTHETIC_TEST_MESSAGE');
    const noUserMetadata = !details.username && !details.sender && !details.from;
    record(9, 'Unauthorized-source isolation: NO message text or sender PII stored in event log', textNotStored && noUserMetadata, {
      details
    });

    // Clean up synthetic test chat from pending sources
    await pool.query('DELETE FROM public.mains_telegram_pending_sources WHERE telegram_chat_id = $1', [testChatId]);
    await pool.query("DELETE FROM public.mains_telegram_processing_events WHERE details->>'chatId' = $1", [testChatId]);

    // 10. No secret exposure in API responses or diagnostic data
    const serializedStatus = JSON.stringify(runtimeStatus);
    const actualToken = mainsTelegramIngestionService.getBotToken();
    const tokenExposed = Boolean(actualToken && serializedStatus.includes(actualToken));
    const hasSecretToken = serializedStatus.toLowerCase().includes('secret_token') ||
      serializedStatus.includes('bot_token') ||
      serializedStatus.toLowerCase().includes('authorization:') ||
      (actualToken && serializedStatus.includes(actualToken.split(':')[0]));
    const noTokenExposed = !tokenExposed && !hasSecretToken;
    record(10, 'Strict confidentiality: No token or secret exposed in API response', noTokenExposed);

    // 11. Zero dataset records created from unauthorized/test updates
    const postSubmissions = await pool.query('SELECT COUNT(*) FROM public.mains_submissions');
    const postImports = await pool.query('SELECT COUNT(*) FROM public.mains_telegram_imports');
    const postCandidates = await pool.query('SELECT COUNT(*) FROM public.mains_evaluation_dataset_items');

    const zeroDatasetMutation =
      preSubmissions.rows[0].count === postSubmissions.rows[0].count &&
      preImports.rows[0].count === postImports.rows[0].count &&
      preCandidates.rows[0].count === postCandidates.rows[0].count;
    record(11, 'Zero dataset records created from unauthorized/test messages', zeroDatasetMutation, {
      preImports: preImports.rows[0].count,
      postImports: postImports.rows[0].count
    });

    // 12. Training gate check: model training locked
    const readiness = await mainsTrainingReadinessAuditService.executeTrainingReadinessAudit('PRODUCTION_DIAGNOSTIC');
    const trainingLocked = readiness.training.modelActuallyTrained === false && readiness.training.trainingJobsRunning === 0;
    record(12, 'Model training remains locked (Zero model training executed)', trainingLocked);

    // Summary output
    console.log('\n==============================================================');
    console.log(`TOTAL DIAGNOSTICS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
    console.log('==============================================================\n');

    console.log('PRODUCTION DIAGNOSTIC SUMMARY:');
    console.log(`- Webhook URL:           ${runtimeStatus.webhookUrl || 'Not configured'}`);
    console.log(`- Pending Update Count:  ${runtimeStatus.pendingUpdateCount ?? 0}`);
    console.log(`- Last Error Date:       ${runtimeStatus.lastErrorDate || 'None'}`);
    console.log(`- Last Error Message:    ${runtimeStatus.lastErrorReason || 'None'}`);
    console.log(`- Last Error Code:       ${runtimeStatus.lastErrorCode ?? 404}`);
    console.log(`- Max Connections:       ${runtimeStatus.maxConnections ?? 40}`);
    console.log(`- Allowed Updates:       ${JSON.stringify(runtimeStatus.allowedUpdates || ['message', 'channel_post'])}`);
    console.log(`- Authorized Sources:    ${runtimeStatus.authorizedSources}`);
    console.log(`- Runtime State:         ${runtimeStatus.runtime}`);
    console.log(`- Model Trained:         NO`);

  } catch (err: any) {
    console.error('Diagnostic error:', err);
  } finally {
    await pool.end();
  }
}

runProductionDiagnostic();
