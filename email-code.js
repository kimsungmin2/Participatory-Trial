const Redis = require('ioredis');
const cluster = new Redis.Cluster(
  [
    {
      host: 'localhost',
      port: 6380,
    },
    {
      host: 'localhost',
      port: 6381,
    },
    {
      host: 'localhost',
      port: 6382,
    },
  ],
  {
    natMap: {
      '172.23.0.7:6380': {
        host: 'localhost',
        port: 6380,
      },
      '172.23.0.3:6381': {
        host: 'localhost',
        port: 6381,
      },
      '172.23.0.6:6382': {
        host: 'localhost',
        port: 6382,
      },
      '172.23.0.4:6383': {
        host: 'localhost',
        port: 6383,
      },
      '172.23.0.5:6384': {
        host: 'localhost',
        port: 6384,
      },
      '172.23.0.2:6385': {
        host: 'localhost',
        port: 6385,
      },
    },
    scaleReads: 'slave',
  },
);
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
    if (cluster.status === 'ready') {
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
