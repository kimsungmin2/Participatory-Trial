const form = document.getElementById('signinForm');

form.addEventListener('submit', (event) => {
  event.preventDefault(); //이벤트 발생 시 새로고침을 방지하는 메소드.

  const formData = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
  };

  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      response.json();
    })
    .then((data) => {
      alert('성공적으로 로그인 했습니다. 메인페이지로 이동합니다.');
      window.location.href = 'http://localhost:3000';
    })
    .catch((error) => {
      // 요청이 실패했을 때의 처리
      alert(error);
      console.error(error.message);
    });
});
