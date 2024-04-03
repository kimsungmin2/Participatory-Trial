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
  console.log(formData.birth, formData.confirmPassword);
  console.log(JSON.stringify(formData));
  console.log(formData.email);
  fetch('http://localhost:3000/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),
  })
    .then((response) => {
      console.log(response);
      // if (!response.ok) {
      //   throw new Error('요청이 잘못되었습니다.');
      // }
      response.json();
    })
    .then((data) => {
      alert('Verification successful');
      console.log(data);
      window.location.href = 'http://localhost:3000/signup/verifiCation';
    })
    .catch((error) => {
      // 요청이 실패했을 때의 처리
      alert(error);
      console.error('Error:', error.stack);
      console.error(error.message);
    });
});
