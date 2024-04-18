// saveResultsToElasticsearch.js
import fs from 'fs';
import { Client } from '@elastic/elasticsearch';

const esClient = new Client({ node: 'http://localhost:9200' });

const indexName = 'artillery-results';

async function createIndex(indexName) {
  const { body: exists } = await esClient.indices.exists({ index: indexName });
  if (!exists) {
    await esClient.indices.create({ index: indexName });
  }
}

async function saveResults() {
  await createIndex(indexName);

  const results = JSON.parse(fs.readFileSync('result.json', 'utf8'));

  for (let entry of results.aggregate) {
    // 여기에 Elasticsearch에 저장할 데이터 형식을 정의합니다.
    await esClient.index({
      index: indexName,
      body: entry,
    });
  }
}

saveResults().catch(console.log);
