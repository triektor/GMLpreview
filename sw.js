self.addEventListener('install', event => {
    console.log('Service Worker zainstalowany');
    self.skipWaiting();
  });
  
  self.addEventListener('fetch', event => {
    // Możesz tu dodać cacheowanie
  });
  