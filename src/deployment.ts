declare const __DEPLOYMENT_VERSION__: string;

// No polling: check on return to a tab, including restoration from bfcache.
export function watchDeployment() {
  if (!import.meta.env.PROD) return;
  let checking = false;
  let lastCheck = 0;
  let editing = false;
  document.addEventListener('input', event => {
    if (event.target instanceof Element && event.target.closest('form, input, textarea, select, [contenteditable]')) editing = true;
  });
  const safe = () => document.visibilityState === 'visible' && !editing
    && !document.activeElement?.closest('form, input, textarea, select, [contenteditable]')
    && !document.querySelector('dialog[open]');
  const check = async () => {
    if (checking || !safe() || Date.now() - lastCheck < 30_000) return;
    checking = true;
    lastCheck = Date.now();
    try {
      const response = await fetch('/version.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!response.ok) return;
      const { version } = await response.json();
      if (typeof version !== 'string' || !/^[a-f0-9-]{36}$/.test(version) || version === __DEPLOYMENT_VERSION__ || !safe()) return;
      // At most one automatic reload per running version per tab, even if an
      // intermediary incorrectly keeps serving old HTML. Storage failure skips it.
      const key = `deployment-reload:${__DEPLOYMENT_VERSION__}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, version);
      window.location.reload();
    } catch {
      // Offline, invalid responses or unavailable storage: retry on next return.
    } finally {
      checking = false;
    }
  };
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', check);
}
