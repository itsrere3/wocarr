const CACHE_NAME = 'rafiqa-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/css/style.css',
  '/assets/js/app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-900.woff2',
  '/assets/img/car-hero.jpg',
  '/assets/img/pattern.svg',
  '/fonts/Asal-Regular.woff2',
  '/fonts/Asal-Bold.woff2',
  '/fonts/Alexandria-Regular.woff2',
  '/fonts/StellaAestiva-Italic.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) {
            console.log('Removing old cache:', k);
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // استبعاد طلبات POST وطلبات التحكم
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // إرجاع الاستجابة المخبأة إذا وجدت
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // جلب من الشبكة
        return fetch(event.request)
          .then(response => {
            // التحقق من أن الاستجابة صالحة للتخزين
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // استنساخ الاستجابة للتخزين
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // عرض صفحة بديلة عند فشل الاتصال
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// دفع الإشعارات
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/assets/img/icon-192x192.png',
    badge: '/assets/img/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: '/assets/img/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/assets/img/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('وكار', options)
  );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// مزامنة البيانات في الخلفية
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // هنا يمكنك إضافة كود لمزامنة البيانات مع الخادم
  console.log('Syncing data...');
}