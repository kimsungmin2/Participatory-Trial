const { date } = require('joi');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'database-1.cxgaygw2ostf.ap-northeast-2.rds.amazonaws.com',
  database: 'TEAM3DB',
  password: 'lol940620',
  port: 5432,
});

async function createUsers() {
  const client = await pool.connect();
  try {
        console.log(1)
      for (let i = 0; i < 10000; i++) {
        const id = i;
        const userId = 1;
        const title = `${i}번째입니다.`
        const content = `${i}번째입니다.`
        const total = 1000 + i;
        const createdAt = new Date();
        const updatedAt = new Date();
        const userInsertQuery = `
  INSERT INTO trial_view_hall_of_fames (id, "userId", title, content, total, "createdAt", "updatedAt")
  VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
  RETURNING id;`;
  const result = await client.query(userInsertQuery, [id, userId, title, content, total]);
}
} catch (err) {
    console.error('error', err);
  } finally {
    client.release();
  }
}
createUsers();