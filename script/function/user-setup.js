const { date } = require('joi');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'testdb',
  password: 'postgres',
  port: 5432,
});
console.log(pool);

async function createUsers() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT COUNT(*) AS count FROM users');
    const userCount = Number(res.rows[0].count);

    if (userCount < 1000) {
      const needToCreate = 1000 - userCount;
      for (let i = 0; i < needToCreate; i++) {
        const email = `user${Date.now() + i}@example.com`;
        const password = `password123`;
        const nickName = `${Math.floor(Math.random(1000)) + i}`;
        const hashedPassword = await bcrypt.hash(password, 10);
        const provider = 'local';
        const role = 'User';
        const emailVerified = true;
        const birth = '1997-10-08';
        const userInsertQuery = `
  INSERT INTO users (role)
  VALUES ($1)
  RETURNING id;
`;
        const result = await client.query(userInsertQuery, [role]);
        const userId = result.rows[0].id;
        const userInfoInsertQuery = `
        INSERT INTO "userInfos" (id, email, password, "nickName", birth, provider, "emailVerified", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());
      `;
        await client.query(userInfoInsertQuery, [
          userId,
          email,
          hashedPassword,
          nickName,
          birth,
          provider,
          emailVerified,
        ]);
      }
    }
    console.log(userCount);
  } catch (err) {
    console.error('error', err);
  } finally {
    client.release();
  }
}
createUsers();
module.exports = {
  setupUserContext: function (context, events, done) {
    // 무작위 사용자 ID 생성
    context.vars.userId = Math.floor(Math.random() * 10000) + 1;

    // 메시지 내용을 랜덤하게 설정할 수도 있음

    // 모든 설정이 완료되면 다음 단계로 넘어갑니다.
    return done();
  },
};
