import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultStorePath = path.resolve(__dirname, '../data/appDatabase.json');

const createDefaultStore = () => ({
  users: [],
  events: [],
  registrations: [],
  feedback: [],
  adminApplications: [],
  settings: { globalBanner: '', newsletter: [] },
  newsletterSubscribers: [],
  notifications: [],
  reviews: [],
  supportRequests: [],
});

export const getDefaultStorePath = () => defaultStorePath;

export const loadDataStore = (filePath = defaultStorePath) => {
  if (!fs.existsSync(filePath)) {
    return saveDataStore(createDefaultStore(), filePath);
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) {
      return saveDataStore(createDefaultStore(), filePath);
    }

    const parsed = JSON.parse(raw);
    return {
      ...createDefaultStore(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [],
      adminApplications: Array.isArray(parsed.adminApplications) ? parsed.adminApplications : [],
      newsletterSubscribers: Array.isArray(parsed.newsletterSubscribers) ? parsed.newsletterSubscribers : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      supportRequests: Array.isArray(parsed.supportRequests) ? parsed.supportRequests : [],
      settings: {
        ...createDefaultStore().settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return saveDataStore(createDefaultStore(), filePath);
  }
};

export const saveDataStore = (storeOrFilePath, maybeStoreOrFilePath = defaultStorePath) => {
  const isFilePathFirst = typeof storeOrFilePath === 'string';
  const filePath = isFilePathFirst ? storeOrFilePath : maybeStoreOrFilePath;
  const store = isFilePathFirst ? maybeStoreOrFilePath : storeOrFilePath;

  const normalized = {
    ...createDefaultStore(),
    ...store,
    users: Array.isArray(store?.users) ? store.users : [],
    events: Array.isArray(store?.events) ? store.events : [],
    registrations: Array.isArray(store?.registrations) ? store.registrations : [],
    feedback: Array.isArray(store?.feedback) ? store.feedback : [],
    adminApplications: Array.isArray(store?.adminApplications) ? store.adminApplications : [],
    newsletterSubscribers: Array.isArray(store?.newsletterSubscribers) ? store.newsletterSubscribers : [],
    notifications: Array.isArray(store?.notifications) ? store.notifications : [],
    reviews: Array.isArray(store?.reviews) ? store.reviews : [],
    supportRequests: Array.isArray(store?.supportRequests) ? store.supportRequests : [],
    settings: {
      ...createDefaultStore().settings,
      ...(store?.settings || {}),
    },
  };

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2));
  return normalized;
};
