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
      response.json();
    })
    .then((data) => {
      alert('가입을 완료하였습니다. 해당 이메일로 인증코드를 전송하였습니다.');
      window.location.href = 'http://localhost:3000/verification';
    })
    .catch((error) => {
      alert(error);
      console.error(error.message);
    });
});
