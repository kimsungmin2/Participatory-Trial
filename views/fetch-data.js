window.onload = () => {
  const listContainer = document.getElementById('data-list');
  fetch('http://localhost:3000/humors')
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      data.data.forEach((item) => {
        console.log(item.title);
        const listItem = document.createElement('li');
        listItem.textContent = item.title; // 예시: 받아온 데이터에서 text 필드를 표시
        listContainer.appendChild(listItem);
      });
    })
    .catch((error) => console.error('Error fetching data:', error));
};
