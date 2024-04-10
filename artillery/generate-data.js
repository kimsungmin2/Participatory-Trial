module.exports = {
  generateRandomData: function (userContext, events, done) {
    // 랜덤 컨텐트 생성
    userContext.vars.content =
      'Content ' + Math.random().toString(36).substring(7);
    return done();
  },
};
