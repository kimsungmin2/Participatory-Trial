//email-validation-check.js

const form = document.getElementById('verifyEmail');

form.addEventListener('submit', (event) => {
  // 폼의 기본 동작을 중지합니다.
  event.preventDefault();
  const formData = {
    email: document.getElementById('email').value,
    code: document.getElementById('code').value,
  };

  fetch('/sign-up/verification', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      response.json();
    })
    .then((data) => {
      alert('이메일이 인증되었습니다. 로그인 페이지로 이동합니다.');
      window.location.href = '/sign-in';
    })
    .catch((error) => {
      alert(error);
      console.error(error.message);
    });
});
