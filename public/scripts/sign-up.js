const form = document.getElementById('signupForm');

form.addEventListener('submit', (event) => {
  event.preventDefault(); //이벤트 발생 시 새로고침을 방지하는 메소드.

  const formData = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    passwordConfirm: document.getElementById('passwordConfirm').value,
    nickName: document.getElementById('nickName').value,
    birth: document.getElementById('birth').value,
  };
  fetch('/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        // 응답이 성공적이지 않을 경우 에러를 처리합니다.
        return response.json().then((data) => {
          throw new Error(data.message || '로그인에 실패했습니다.');
        });
      }
    })
    .then((data) => {
      alert('가입을 완료하였습니다. 해당 이메일로 인증코드를 전송하였습니다.');
      window.location.href = '/verification';
    })
    .catch((error) => {
      alert(error);
      console.error(error.message);
    });
});
