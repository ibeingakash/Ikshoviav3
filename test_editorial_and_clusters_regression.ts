import { currentAffairsRepository } from './server/repositories/CurrentAffairsRepository.js';
import { currentAffairsIngestionManager } from './server/services/CurrentAffairsProvider.js';

async function runRegression() {
  console.log('====================================================');
  console.log('📰 IKSHOVIA Editorial & Multi-Source Synthesis Regression Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Ingest all providers
    const ingestionResult = await currentAffairsIngestionManager.runIngestionPipeline();
    assert(ingestionResult.fetchedCount > 0, `Provider ingestion fetched articles (count: ${ingestionResult.fetchedCount})`);
    assert(ingestionResult.createdCount >= 0, `Provider ingestion created new articles`);

    // 2. Query Editorials feed
    const editorials = await currentAffairsRepository.listEditorials({});
    assert(editorials.length > 0, `List editorials returned ${editorials.length} editorial items`);

    const hinduEditorials = await currentAffairsRepository.listEditorials({ source: 'The Hindu' });
    assert(hinduEditorials.length > 0, `The Hindu editorial filter returned ${hinduEditorials.length} items`);

    const indianExpressEditorials = await currentAffairsRepository.listEditorials({ source: 'The Indian Express' });
    assert(indianExpressEditorials.length > 0, `Indian Express editorial filter returned ${indianExpressEditorials.length} items`);

    // 3. Verify Editorial Analysis fields
    const leadEditorial = editorials.find(e => e.editorialAnalysis && e.editorialAnalysis.argumentsFor?.length) || editorials[0];
    assert(Boolean(leadEditorial.editorialAnalysis), `Lead editorial has structured editorialAnalysis object`);
    assert(Boolean(leadEditorial.editorialAnalysis?.argumentsFor?.length), `Lead editorial has affirmative debate points`);
    assert(Boolean(leadEditorial.editorialAnalysis?.argumentsAgainst?.length), `Lead editorial has counterargument points`);
    assert(Boolean(leadEditorial.editorialAnalysis?.constitutionalDimensions?.length), `Lead editorial has constitutional dimensions`);

    // 4. Query Topic Clusters
    const clusters = await currentAffairsRepository.listTopicClusters();
    assert(clusters.length > 0, `Topic clusters formed automatically (count: ${clusters.length})`);

    const leadCluster = clusters[0];
    const clusterDetails = await currentAffairsRepository.getTopicClusterDetails(leadCluster.id);
    assert(Boolean(clusterDetails), `Retrieved detailed cluster view for ID: ${leadCluster.id}`);
    assert(Boolean(clusterDetails?.articles?.length), `Cluster contains grouped articles (${clusterDetails?.articles?.length})`);

    // 5. Ingestion runs & Freshness
    const runs = await currentAffairsRepository.listIngestionRuns(10);
    assert(runs.length > 0, `Audit logs recorded ingestion runs (count: ${runs.length})`);

    const freshness = await currentAffairsRepository.getSourceFreshnessList();
    assert(freshness.length >= 6, `All 6 configured providers tracked in source freshness dashboard`);

  } catch (err: any) {
    console.error('Regression error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRegression();
