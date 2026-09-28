import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with instant background reload and update polling
export function initAutoUpdatePWA() {
  if (typeof window === 'undefined') return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Automatically activate new service worker and reload app seamlessly
      console.log('New app version detected. Updating...');
      updateSW(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline.');
    },
    onRegisteredSW(swUrl, registration) {
      console.log('Service Worker registered:', swUrl);
      if (registration) {
        // Periodically check for application updates in the background every 5 minutes
        setInterval(() => {
          if (navigator.onLine) {
            registration.update().catch((err) => {
              console.debug('Periodic SW update check:', err);
            });
          }
        }, 5 * 60 * 1000);

        // Also check for updates whenever user regains focus or comes back online
        window.addEventListener('focus', () => {
          if (navigator.onLine) {
            registration.update().catch(() => {});
          }
        });
        window.addEventListener('online', () => {
          registration.update().catch(() => {});
        });
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });
}
