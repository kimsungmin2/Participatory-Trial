const form = document.getElementById('verifyEmail');

form.addEventListener('submit', (event) => {
  // 폼의 기본 동작을 중지합니다.
  event.preventDefault();
  const formData = {
    email: document.getElementById('email').value,
    code: document.getElementById('code').value,
  };

  fetch('http://localhost:3000/sign-up/verification', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('네트워크 응답이 올바르지 않습니다.');
      }
      return response.json();
    })
    .then((data) => {
      alert('이메일이 인증되었습니다. 로그인 페이지로 이동합니다.');
      console.log(data);
      window.location.href = 'http://localhost:3000/sign-in';
    })
    .catch((error) => {
      alert('인증 중 오류가 발생했습니다: ' + error.message);
      console.error(error);
    });
});
