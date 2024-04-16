// processCookies.js
function extractCookie(requestParams, response, context, ee, next) {
  // 'set-cookie' 헤더에서 쿠키 추출
  const cookie = response.headers['authorization'];
  if (cookie) {
    context.vars.cookie = cookie[0].split(';')[0]; // 쿠키 값을 변수에 저장
  }
  return next(); // 다음 단계로 진행
}

function setCookieHeader(requestParams, context, ee, next) {
  // 저장된 쿠키 값을 요청 헤더에 추가
  if (context.vars.cookie) {
    requestParams.headers.Cookie = context.vars.cookie;
  }
  return next(); // 다음 단계로 진행
}

module.exports = {
  extractCookie,
  setCookieHeader,
};
