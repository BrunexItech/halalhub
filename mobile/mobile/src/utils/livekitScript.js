export const LIVEKIT_SCRIPT = `
(function() {
  function loadScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/livekit-client@1.15.0/dist/livekit-client.umd.min.js';
      script.onload = () => resolve(window.LiveKit);
      script.onerror = () => reject(new Error('Failed to load LiveKit'));
      document.head.appendChild(script);
    });
  }

  window.getLiveKit = async function() {
    if (window.LiveKit) return window.LiveKit;
    try {
      return await loadScript();
    } catch (e) {
      console.error('LiveKit load failed:', e);
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/livekit-client@1.15.0/dist/livekit-client.umd.min.js';
        script.onload = () => resolve(window.LiveKit);
        script.onerror = () => reject(new Error('All CDN attempts failed'));
        document.head.appendChild(script);
      });
    }
  };

  console.log('[LiveKit Loader] Ready');
})();
`;
