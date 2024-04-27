const { date } = require('joi');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'database-1.cxgaygw2ostf.ap-northeast-2.rds.amazonaws.com',
  database: 'team3dbs',
  password: 'lol940620',
  port: 5432,
});
console.log(pool);

async function createUsers() {
  const client = await pool.connect();
  try {
    if (true) {
      const needToCreate = 40;
      for (let i = 0; i < needToCreate; i++) {
        const id = 170 + i;
        const voteId = 105;
        const userId = null;
        const ip = '133.333.333.11';
        let voteFor;
        if (i % 2 === 0) {
          voteFor = true;
        } else {
          voteFor = false;
        }

        const userInsertQuery = `
  INSERT INTO each_vote (id, "voteId", "userId", ip, "voteFor", "createdAt")
  VALUES ($1, $2, $3, $4, $5, NOW())
`;
        const result = await client.query(userInsertQuery, [
          id,
          voteId,
          userId,
          ip,
          voteFor,
        ]);
        console.log(`${i}번째 투표 입력`);
      }
    }
  } catch (err) {
    console.error('error', err);
  } finally {
    client.release();
  }
}
createUsers();
