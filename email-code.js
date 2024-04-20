const Redis = require('ioredis');
const cluster = new Redis.Cluster([
  {
    port: 6380,
    host: '127.0.0.1',
  },
  {
    port: 6381,
    host: '127.0.0.1',
  },
  {
    port: 6382,
    host: '127.0.0.1',
  },
]);
cluster.on('connect', function () {
  console.log('Redis client connected');
});
cluster.on('error', function (err) {
  console.error('Something went wrong with the Redis client: ', err);
});
process.on('exit', () => {
  cluster.quit(); // 애플리케이션이 종료될 때 Redis 클라이언트 연결을 정상적으로 종료합니다.
  console.log('Redis client connection is closed');
});
module.exports = {
  fetchCodeByEmail: function (context, events, done) {
    const email = context.vars.email;
    // Redis 클라이언트 연결 상태 확인
    if (cluster.isOpen) {
      cluster.get(email, function (err, code) {
        console.log(code);
        if (err) {
          console.error('Error retrieving code from Redis: ', err);
          return done(err);
        }
        context.vars.code = code;
        return done();
      });
    } else {
      console.error('Redis client is not connected.');
      return done(new Error('Redis client is not connected.'));
    }
  },
};
