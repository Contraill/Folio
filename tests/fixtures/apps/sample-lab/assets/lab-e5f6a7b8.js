// A stand-in lab app for Folio's tests: it saves a run in IndexedDB, in a database named after its own address.
const ns = (location.pathname.match(/^\/(play|lab)\/([a-z0-9-]+)\/app\//) ?? []).slice(1, 3).join(':');
const req = indexedDB.open(`${ns}:runs`, 1);
req.onupgradeneeded = () => req.result.createObjectStore('runs', { autoIncrement: true });
req.onsuccess = () => {
  const tx = req.result.transaction('runs', 'readwrite');
  tx.objectStore('runs').add({ at: Date.now() });
  const count = tx.objectStore('runs').count();
  count.onsuccess = () => { document.getElementById('out').textContent = `running ${ns} runs=${count.result}`; };
};
req.onerror = () => { document.getElementById('out').textContent = `storage refused: ${req.error?.name}`; };
