import bcrypt from 'bcrypt';
import { loadDataStore, saveDataStore } from '../utils/fileStore.js';

export const mockDb = loadDataStore();

export const persistMockDb = () => saveDataStore(mockDb);

const ensureStoreShape = () => {
  mockDb.users = Array.isArray(mockDb.users) ? mockDb.users : [];
  mockDb.users.forEach(u => {
    if (u.referrals === undefined) u.referrals = 0;
    if (u.isFirstUser === undefined) u.isFirstUser = false;
  });
  mockDb.events = Array.isArray(mockDb.events) ? mockDb.events : [];
  mockDb.events.forEach((e) => {
    if (!e.status) e.status = 'approved';
    if (!e.bannerType) e.bannerType = 'image';
    if (e.latitude === undefined) e.latitude = null;
    if (e.longitude === undefined) e.longitude = null;
    if (!e.ticketTiers) e.ticketTiers = [];
  });
  mockDb.registrations = Array.isArray(mockDb.registrations) ? mockDb.registrations : [];
  mockDb.registrations.forEach(r => {
    if (!r.ticketTier) r.ticketTier = 'general';
  });
  mockDb.feedback = Array.isArray(mockDb.feedback) ? mockDb.feedback : [];
  mockDb.adminApplications = Array.isArray(mockDb.adminApplications) ? mockDb.adminApplications : [];
  mockDb.settings = mockDb.settings || {};
  mockDb.settings.globalBanner = mockDb.settings.globalBanner ?? '';
  mockDb.settings.newsletter = Array.isArray(mockDb.settings.newsletter) ? mockDb.settings.newsletter : [];
  mockDb.newsletterSubscribers = Array.isArray(mockDb.newsletterSubscribers) ? mockDb.newsletterSubscribers : [];
  mockDb.notifications = Array.isArray(mockDb.notifications) ? mockDb.notifications : [];
  mockDb.reviews = Array.isArray(mockDb.reviews) ? mockDb.reviews : [];
  mockDb.supportRequests = Array.isArray(mockDb.supportRequests) ? mockDb.supportRequests : [];
  return mockDb;
};

const generateEvents = () => {
  const categories = ['Tech', 'Music', 'Business', 'Sports', 'Art'];
  const locations = ['San Francisco, CA', 'New York, NY', 'Virtual', 'London, UK', 'Tokyo, Japan', 'Berlin, Germany', 'Sydney, Australia'];
  const adjectives = ['Global', 'Future', 'Advanced', 'Modern', 'International', 'Local', 'Annual', 'Digital'];
  const nouns = ['Summit', 'Conference', 'Workshop', 'Expo', 'Festival', 'Symposium', 'Meetup', 'Bootcamp'];
  
  const generated = [];
  
  for (let i = 0; i < 80; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const title = `${adj} ${category} ${noun} ${2026 + Math.floor(Math.random() * 2)}`;
    
    // Random date between today and 1 year in the future
    const start = Date.now() + (24 * 60 * 60 * 1000); // Start from tomorrow
    const end = start + (365 * 24 * 60 * 60 * 1000); // Up to 1 year from now
    const date = new Date(start + Math.random() * (end - start)).toISOString();

    generated.push({
      _id: `event_gen_${i}`,
      title,
      description: `Join us for the premier ${category.toLowerCase()} event of the year. Featuring top speakers, networking opportunities, and deep dives into the latest trends in ${category}.`,
      date,
      location: locations[Math.floor(Math.random() * locations.length)],
      price: Math.random() > 0.3 ? Math.floor(Math.random() * 200) + 10 : 0, // 30% chance free, else $10-$210
      capacity: Math.floor(Math.random() * 900) + 100,
      organizer: 'admin_123',
      tags: [category, adj],
      thumbnail: `https://picsum.photos/seed/${title.replace(/ /g, '')}/400/300`,
      speaker: `Dr. ${adj} ${category}man`
    });
  }
  return generated;
};

// Seed initial data — users only; events are added manually via admin panel
export const seedMockDb = async () => {
  ensureStoreShape();

  const existing = mockDb.users.find((u) => u.email === 'admin@codesky.com');
  if (!existing) {
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin', salt);

    mockDb.users.push({
      _id: 'admin_123',
      name: 'Admin',
      email: 'admin@codesky.com',
      password: adminPassword,
      role: 'admin',
      credits: 0,
      referrals: 0,
      bookmarks: []
    });
  }

  persistMockDb();
};
