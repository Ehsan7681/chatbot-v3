// نام کش
const CACHE_NAME = 'ai-assistant-cache-v1';

// فایل‌هایی که باید ذخیره شوند
const urlsToCache = [
  '/',
  '/index.html',
  '/styles-new.css',
  '/script.js',
  '/images/logo-small.png',
  '/images/logo-large.png',
  '/images/ai-avatar.png',
  '/images/user-avatar.png'
];

// نصب سرویس ورکر و ذخیره فایل‌ها در کش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کش باز شد');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی سرویس ورکر و حذف کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف کش قدیمی:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// استراتژی کش: ابتدا شبکه، سپس کش
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // کپی پاسخ برای ذخیره در کش
        const responseToCache = response.clone();
        
        // فقط درخواست‌های GET را کش کن
        if (event.request.method === 'GET') {
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // اگر شبکه در دسترس نبود، از کش استفاده کن
        return caches.match(event.request);
      })
  );
}); 