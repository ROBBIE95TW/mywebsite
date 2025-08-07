const CACHE_NAME = 'todolist-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './favicon.svg',
  './manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('快取已開啟');
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果快取中有資源，直接返回
        if (response) {
          return response;
        }
        
        // 否則從網路獲取
        return fetch(event.request).then(response => {
          // 檢查是否為有效回應
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 複製回應
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 處理推送通知（可選）
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '您有新的待辦事項提醒',
    icon: './favicon.svg',
    badge: './favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看詳情',
        icon: './favicon.svg'
      },
      {
        action: 'close',
        title: '關閉',
        icon: './favicon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('待辦事項提醒', options)
  );
});

// 處理通知點擊
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // 打開應用
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});