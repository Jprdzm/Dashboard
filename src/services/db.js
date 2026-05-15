import localforage from 'localforage';

const db = localforage.createInstance({
  name: 'second-brain',
  storeName: 'app_data',
});

export default db;
