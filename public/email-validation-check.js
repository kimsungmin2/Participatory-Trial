//email-validation-check.js

const form = document.getElementById('verifyEmail');

form.addEventListener('submit', (event) => {
  // 폼의 기본 동작을 중지합니다.
  event.preventDefault();

  const email = document.getElementById('email').value;
  const code = document.getElementById('code').value;

  fetch('/signup/verifiCation', {
    method: 'Patch',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to verify email');
      }
      return response.json();
    })
    .then((data) => {
      alert('Verification successful');
      console.log(data);
    })
    .catch((error) => {
      alert('Verification failed: ' + error.message);
      console.error('Error:', error);
    });

  window.location.href = '/sign-in';
});
