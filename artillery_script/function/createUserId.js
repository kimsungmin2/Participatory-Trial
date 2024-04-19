module.exports = {
  setupUserContext: function (context, events, done) {
    // 무작위 사용자 ID 생성
    context.vars.userId = Math.floor(Math.random() * 10000) + 1;

    // 메시지 내용을 랜덤하게 설정할 수도 있음

    // 모든 설정이 완료되면 다음 단계로 넘어갑니다.
    return done();
  },
};
