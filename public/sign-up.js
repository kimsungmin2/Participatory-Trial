// 모달
const modal = document.getElementById('emailModal');

// 모달 닫기 버튼
const closeModalBtn = document.getElementById('closeBtn');

// 모달 열기 이벤트 리스너
document
  .getElementById('openModalBtn')
  .addEventListener('click', function (event) {
    event.preventDefault(); // 이벤트의 기본 동작(여기서는 폼 제출)을 방지
    document.getElementById('emailModal').style.display = 'block'; // 모달을 보여주는 코드
  });

// 모달 닫기 이벤트 리스너
closeModalBtn.addEventListener('click', () => {
  modal.style.display = 'none';
});

// 모달 외부 클릭 시 닫기 이벤트 리스너
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// 모달 내부 클릭 시 닫기 이벤트 전파 방지
modal.addEventListener('click', (event) => {
  event.stopPropagation();
});
