const form = document.getElementById('signinForm');

form.addEventListener('submit', (event) => {
  event.preventDefault(); //이벤트 발생 시 새로고침을 방지하는 메소드.

  const formData = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
  };

  fetch('/login', {
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
      window.location.href = '/';
    })
    .catch((error) => {
      // 요청이 실패했을 때의 처리
      alert(error.message); // 여기서 error.message를 사용하여 좀 더 명확한 정보를 제공
      console.error(error.message);
    });
});
