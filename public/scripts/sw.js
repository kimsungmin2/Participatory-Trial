// 서비스 워커 설치
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('v1').then(function (cache) {
      return cache.addAll([
        '/index.html',
        '/css/main-style.css',
        '/scripts/main.js',
      ]);
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  const { channelType, boardId } = event.data.json();

  const targetUrl = `/${channelType}/${boardId}`;

  event.notification.close(); // 알림 닫기

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function (windowClients) {
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
// self.addEventListener('notificationclick', function (event) {
//   event.notification.close(); // 알림을 닫습니다.
//   event.waitUntil(
//     clients.openWindow('http://localhost:3000'), // 사용자를 특정 URL로 이동시킵니다.
//   );
// });

// 서비스 워커 활성화 및 구 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== 'v1') {
            return caches.delete(key);
          }
        }),
      );
    }),
  );
});

// 푸시 알림 수신
self.addEventListener('push', function (event) {
  const payload = event.data.json();

  const options = {
    title: payload.title,
    body: payload.body,
    data: {
      channelType,
      boardId,
    },
  };

  event.waitUntil(self.registration.showNotification(options));
});
