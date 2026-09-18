import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { mockDb, persistMockDb, seedMockDb } from '../data/mockDb.js';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'codesky_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 1500,
};

const pool = mysql.createPool(dbConfig);
let dbReady = false;
let dbError = null;

const parseJson = (value) => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const deriveThumbnailFromMedia = (bannerType, bannerMedia) => {
  if (!bannerMedia) return '';
  const first = bannerMedia.split(',')[0]?.trim() || '';
  if (!first || first.startsWith('data:video')) return '';
  if (bannerType === 'image' || bannerType === 'slideshow') return first;
  return '';
};

const toUserPayload = (row) => ({
  _id: row.uuid,
  id: row.id,
  name: row.name,
  email: row.email,
  password: row.password,
  role: row.role,
  status: row.status,
  credits: row.credits,
  referrals: row.referrals || 0,
  bio: row.bio,
  profilePicture: row.profilePicture || null,
  phone: row.phone || null,
  bookmarks: parseJson(row.bookmarks),
  isFirstUser: Boolean(row.is_first_user),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toEventPayload = (row) => ({
  _id: row.uuid,
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.date,
  location: row.location,
  price: Number(row.price),
  capacity: Number(row.capacity),
  organizer: row.organizer_id,
  tags: parseJson(row.tags),
  speaker: row.speaker || '',
  thumbnail: row.thumbnail || '',
  bannerType: row.banner_type || 'image',
  bannerMedia: row.banner_media || '',
  status: row.status || 'approved',
  latitude: row.latitude ? Number(row.latitude) : null,
  longitude: row.longitude ? Number(row.longitude) : null,
  ticketTiers: parseJson(row.ticket_tiers),
  mapLink: row.map_link || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRegistrationPayload = (row) => ({
  _id: row.uuid,
  id: row.id,
  user: row.user_id,
  event: row.event_id,
  status: row.status,
  paymentStatus: row.payment_status,
  attended: Boolean(row.attended),
  ticketTier: row.ticket_tier || 'general',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRegistrationWithDetails = (row) => {
  const base = toRegistrationPayload(row);
  return {
    ...base,
    user: row.user_uuid ? {
      _id: row.user_uuid,
      name: row.user_name,
      email: row.user_email,
      role: row.user_role,
      status: row.user_status,
    } : null,
    eventDetails: row.event_uuid ? {
      _id: row.event_uuid,
      title: row.event_title,
      date: row.event_date,
      location: row.event_location,
      price: Number(row.event_price),
      capacity: Number(row.event_capacity),
      organizer: row.event_organizer || null,
    } : null,
  };
};

export const initializeDatabase = async () => {
  try {
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      connectTimeout: 2000,
    });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    const connection = await pool.getConnection();
    await connection.query(`USE \`${dbConfig.database}\``);
    await connection.release();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') DEFAULT 'user',
        status ENUM('active','suspended','blocked') DEFAULT 'active',
        credits INT DEFAULT 0,
        bio TEXT,
        profilePicture LONGTEXT,
        bookmarks JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query('ALTER TABLE users ADD COLUMN profilePicture LONGTEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN referrals INT DEFAULT 0'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN is_first_user BOOLEAN DEFAULT FALSE'); } catch (e) {}
    try { await pool.query('ALTER TABLE users ADD COLUMN phone VARCHAR(50) DEFAULT NULL'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        price DECIMAL(10,2) DEFAULT 0,
        capacity INT DEFAULT 100,
        organizer_id VARCHAR(255),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query('ALTER TABLE events ADD COLUMN thumbnail VARCHAR(500)'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN speaker VARCHAR(255)'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN banner_type VARCHAR(50) DEFAULT "image"'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN banner_media TEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE events MODIFY COLUMN banner_media LONGTEXT'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN status ENUM("pending","approved","rejected") DEFAULT "approved"'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN latitude DECIMAL(10, 8) DEFAULT NULL'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN longitude DECIMAL(11, 8) DEFAULT NULL'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN ticket_tiers TEXT DEFAULT NULL'); } catch (e) {}
    try { await pool.query('ALTER TABLE events ADD COLUMN map_link VARCHAR(1000) DEFAULT NULL'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(255) NOT NULL,
        event_id VARCHAR(255) NOT NULL,
        status ENUM('confirmed','cancelled') DEFAULT 'confirmed',
        payment_status VARCHAR(255) DEFAULT 'unpaid',
        attended BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query('ALTER TABLE registrations ADD COLUMN ticket_tier VARCHAR(50) DEFAULT "general"'); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(255) NOT NULL UNIQUE,
        event_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        reply TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        email VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    dbReady = true;
    dbError = null;
    await ensureAdminApplicationsTable();
    await ensureSupportRequestsTable();
    await seedInitialData();
    return true;
  } catch (error) {
    dbReady = false;
    dbError = error;
    console.warn('MySQL not available, using in-memory storage for now.', error.message);
    await seedMockDb();
    return false;
  }
};

export const isDatabaseReady = () => dbReady;
export const getDatabaseError = () => dbError;

export const seedInitialData = async () => {
  if (!dbReady) return;

  const [adminRows] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@codesky.com']);
  if (adminRows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin', salt);
    const adminId = `admin_${Date.now()}`;
    await pool.query(
      'INSERT INTO users (uuid, name, email, password, role, status, credits, bookmarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [adminId, 'Admin', 'admin@codesky.com', adminPassword, 'admin', 'active', 0, JSON.stringify([])]
    );
  }

  const [settingsRows] = await pool.query('SELECT setting_key FROM settings WHERE setting_key = ?', ['globalBanner']);
  if (!settingsRows.length) {
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', ['globalBanner', '']);
  }
};

export const findUserByEmail = async (email) => {
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!dbReady) {
    return mockDb.users.find((u) => u.email.toLowerCase().trim() === cleanEmail) || null;
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
  return rows[0] ? toUserPayload(rows[0]) : null;
};

export const findUserById = async (id) => {
  if (!dbReady) {
    return mockDb.users.find((u) => u._id === id) || null;
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE uuid = ? LIMIT 1', [id]);
  return rows[0] ? toUserPayload(rows[0]) : null;
};

export const listUsers = async () => {
  if (!dbReady) {
    return mockDb.users.map((u) => ({ ...u, password: undefined }));
  }

  const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(toUserPayload);
};

export const createUser = async ({ name, email, password, role = 'user', status = 'active', phone = null, bio = null, profilePicture = null }) => {
  const isFirst = !dbReady
    ? mockDb.users.filter((u) => u.email !== 'admin@codesky.com').length === 0
    : (await pool.query('SELECT COUNT(*) AS count FROM users WHERE email <> ?', ['admin@codesky.com']))[0][0].count === 0;

  const actualRole = (isFirst || email.toLowerCase() === 'admin@codesky.com') ? 'admin' : role;
  const isFirstUserFlag = isFirst;
  const initialCredits = email.toLowerCase() === 'admin@codesky.com' ? 0 : 50;

  if (!dbReady) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: `user_${Date.now()}`,
      name,
      email,
      password: hashedPassword,
      role: actualRole,
      status,
      credits: initialCredits,
      referrals: 0,
      bio,
      profilePicture,
      phone,
      bookmarks: [],
      isFirstUser: isFirstUserFlag,
    };
    mockDb.users.push(user);

    if (!mockDb.notifications) mockDb.notifications = [];
    mockDb.notifications.push({
      _id: `notify_${Date.now()}`,
      userId: user._id,
      title: isFirstUserFlag ? '🎉 Superuser Administrative Access Granted!' : '👋 Welcome to Codesky Events!',
      message: isFirstUserFlag
        ? 'Welcome! As our very first user, you have been promoted to Superuser Administrator and given a ₹1,000 credit bonus!'
        : email.toLowerCase() === 'admin@codesky.com'
        ? 'Welcome back to your administration dashboard! Management credentials successfully initialized.'
        : 'Thank you for joining Codesky! We have credited ₹50 to your digital wallet to help get you started.',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    persistMockDb();
    return user;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const uuid = `user_${Date.now()}`;
  await pool.query(
    'INSERT INTO users (uuid, name, email, password, role, status, credits, referrals, bookmarks, is_first_user, phone, bio, profilePicture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [uuid, name, email, hashedPassword, actualRole, status, initialCredits, 0, JSON.stringify([]), isFirstUserFlag ? 1 : 0, phone, bio, profilePicture]
  );

  const notifyUuid = `notify_${Date.now()}`;
  const title = isFirstUserFlag ? '🎉 Superuser Administrative Access Granted!' : '👋 Welcome to Codesky Events!';
  const msgText = isFirstUserFlag
    ? 'Welcome! As our very first user, you have been promoted to Superuser Administrator and given a ₹1,005 credit bonus!'
    : email.toLowerCase() === 'admin@codesky.com'
    ? 'Welcome back to your administration dashboard! Management credentials successfully initialized.'
    : 'Thank you for joining Codesky! We have credited ₹50 to your digital wallet to help get you started.';
  await pool.query(
    'INSERT INTO notifications (uuid, user_id, title, message, is_read) VALUES (?, ?, ?, ?, FALSE)',
    [notifyUuid, uuid, title, msgText]
  );

  const [rows] = await pool.query('SELECT * FROM users WHERE uuid = ? LIMIT 1', [uuid]);
  return rows[0] ? toUserPayload(rows[0]) : null;
};

export const updateUserProfile = async (userId, updates) => {
  if (!dbReady) {
    const user = mockDb.users.find((u) => u._id === userId);
    if (!user) return null;
    Object.assign(user, updates);
    persistMockDb();
    return user;
  }

  const fields = [];
  const values = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.email !== undefined) { fields.push('email = ?'); values.push(updates.email); }
  if (updates.bio !== undefined) { fields.push('bio = ?'); values.push(updates.bio); }
  if (updates.profilePicture !== undefined) { fields.push('profilePicture = ?'); values.push(updates.profilePicture); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.password) { fields.push('password = ?'); values.push(await bcrypt.hash(updates.password, 10)); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.credits !== undefined) { fields.push('credits = ?'); values.push(Number(updates.credits)); }
  if (updates.referrals !== undefined) { fields.push('referrals = ?'); values.push(Number(updates.referrals)); }
  if (updates.bookmarks !== undefined) { fields.push('bookmarks = ?'); values.push(JSON.stringify(updates.bookmarks)); }
  if (!fields.length) return findUserById(userId);
  values.push(userId);
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE uuid = ?`, values);
  return findUserById(userId);
};

export const setUserStatus = async (userId, status) => {
  if (!dbReady) {
    const user = mockDb.users.find((u) => u._id === userId);
    if (!user) return null;
    user.status = status;
    persistMockDb();
    return user;
  }

  await pool.query('UPDATE users SET status = ? WHERE uuid = ?', [status, userId]);
  return findUserById(userId);
};

export const deleteUser = async (userId) => {
  if (!dbReady) {
    const index = mockDb.users.findIndex((u) => u._id === userId);
    if (index === -1) return false;
    mockDb.users.splice(index, 1);
    
    // clean up registrations
    mockDb.registrations = mockDb.registrations.filter((r) => r.user !== userId);
    
    // clean up admin applications
    if (mockDb.adminApplications) {
      mockDb.adminApplications = mockDb.adminApplications.filter((a) => a.userId !== userId);
    }
    
    persistMockDb();
    return true;
  }

  await pool.query('DELETE FROM registrations WHERE user_id = ?', [userId]);
  await pool.query('DELETE FROM admin_applications WHERE user_uuid = ?', [userId]);
  await pool.query('DELETE FROM users WHERE uuid = ?', [userId]);
  return true;
};

export const listEvents = async ({ search, isFree, includeAll = false } = {}) => {
  if (!dbReady) {
    let events = [...mockDb.events];
    if (!includeAll) {
      events = events.filter((e) => !e.status || e.status === 'approved');
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter((e) =>
        e.title?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
      );
    }
    if (isFree === 'true') events = events.filter((e) => e.price === 0);
    if (isFree === 'false') events = events.filter((e) => e.price > 0);
    return events;
  }

  let query = 'SELECT * FROM events';
  const values = [];
  const conditions = [];

  if (!includeAll) {
    conditions.push('status = ?');
    values.push('approved');
  }

  if (search) {
    conditions.push('(title LIKE ? OR description LIKE ?)');
    values.push(`%${search}%`, `%${search}%`);
  }

  if (isFree === 'true') {
    conditions.push('price = 0');
  } else if (isFree === 'false') {
    conditions.push('price > 0');
  }

  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`;
  query += ' ORDER BY created_at DESC';

  const [rows] = await pool.query(query, values);
  return rows.map(toEventPayload);
};

export const createEvent = async ({ title, description, date, location, price, capacity, organizer, tags, speaker, thumbnail, bannerType, bannerMedia, status = 'approved', latitude = null, longitude = null, ticketTiers = [], mapLink = null }) => {
  const derivedThumb = thumbnail || deriveThumbnailFromMedia(bannerType, bannerMedia);
  const lat = latitude !== undefined ? latitude : null;
  const lng = longitude !== undefined ? longitude : null;
  const tiers = ticketTiers ? JSON.stringify(ticketTiers) : JSON.stringify([]);

  if (!dbReady) {
    const event = { 
      _id: `event_${Date.now()}`, 
      title, 
      description, 
      date, 
      location, 
      price, 
      capacity, 
      organizer, 
      tags,
      speaker: speaker || '',
      thumbnail: derivedThumb || '',
      bannerType: bannerType || 'image',
      bannerMedia: bannerMedia || '',
      status: status || 'approved',
      latitude: lat,
      longitude: lng,
      ticketTiers: ticketTiers || [],
      mapLink: mapLink || null
    };
    mockDb.events.push(event);
    persistMockDb();
    return event;
  }

  const uuid = `event_${Date.now()}`;
  await pool.query(
    'INSERT INTO events (uuid, title, description, date, location, price, capacity, organizer_id, tags, speaker, thumbnail, banner_type, banner_media, status, latitude, longitude, ticket_tiers, map_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [uuid, title, description, date, location, Number(price), Number(capacity), organizer, JSON.stringify(tags || []), speaker || '', derivedThumb || '', bannerType || 'image', bannerMedia || '', status || 'approved', lat, lng, tiers, mapLink || null]
  );
  const [rows] = await pool.query('SELECT * FROM events WHERE uuid = ? LIMIT 1', [uuid]);
  return rows[0] ? toEventPayload(rows[0]) : null;
};

export const updateEvent = async (eventId, updates) => {
  if (!dbReady) {
    const event = mockDb.events.find((e) => e._id === eventId);
    if (!event) return null;
    Object.assign(event, updates);
    persistMockDb();
    return event;
  }

  const fields = [];
  const values = [];
  if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
  if (updates.date !== undefined) { fields.push('date = ?'); values.push(updates.date); }
  if (updates.location !== undefined) { fields.push('location = ?'); values.push(updates.location); }
  if (updates.price !== undefined) { fields.push('price = ?'); values.push(Number(updates.price)); }
  if (updates.capacity !== undefined) { fields.push('capacity = ?'); values.push(Number(updates.capacity)); }
  if (updates.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(updates.tags)); }
  if (updates.speaker !== undefined) { fields.push('speaker = ?'); values.push(updates.speaker); }
  if (updates.thumbnail !== undefined) { fields.push('thumbnail = ?'); values.push(updates.thumbnail); }
  if (updates.bannerType !== undefined) { fields.push('banner_type = ?'); values.push(updates.bannerType); }
  if (updates.bannerMedia !== undefined) { fields.push('banner_media = ?'); values.push(updates.bannerMedia); }
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.latitude !== undefined) { fields.push('latitude = ?'); values.push(updates.latitude); }
  if (updates.longitude !== undefined) { fields.push('longitude = ?'); values.push(updates.longitude); }
  if (updates.ticketTiers !== undefined) { fields.push('ticket_tiers = ?'); values.push(JSON.stringify(updates.ticketTiers)); }
  if (updates.mapLink !== undefined) { fields.push('map_link = ?'); values.push(updates.mapLink); }
  if (!fields.length) return findEventById(eventId);
  values.push(eventId);
  await pool.query(`UPDATE events SET ${fields.join(', ')} WHERE uuid = ?`, values);
  return findEventById(eventId);
};

export const deleteEvent = async (eventId) => {
  if (!dbReady) {
    const index = mockDb.events.findIndex((e) => e._id === eventId);
    if (index === -1) return false;
    mockDb.events.splice(index, 1);
    persistMockDb();
    return true;
  }

  await pool.query('DELETE FROM events WHERE uuid = ?', [eventId]);
  await pool.query('DELETE FROM registrations WHERE event_id = ?', [eventId]);
  return true;
};

export const findEventById = async (eventId) => {
  if (!dbReady) {
    return mockDb.events.find((e) => e._id === eventId) || null;
  }

  const [rows] = await pool.query('SELECT * FROM events WHERE uuid = ? LIMIT 1', [eventId]);
  return rows[0] ? toEventPayload(rows[0]) : null;
};

export const listRegistrations = async () => {
  if (!dbReady) {
    return mockDb.registrations.map((r) => ({
      ...r,
      user: mockDb.users.find((u) => u._id === r.user),
      eventDetails: mockDb.events.find((e) => e._id === r.event),
    }));
  }

  const [rows] = await pool.query(`
    SELECT r.*, u.uuid AS user_uuid, u.name AS user_name, u.email AS user_email, u.role AS user_role, u.status AS user_status,
           e.uuid AS event_uuid, e.title AS event_title, e.date AS event_date, e.location AS event_location, e.price AS event_price, e.capacity AS event_capacity, e.organizer_id AS event_organizer
    FROM registrations r
    LEFT JOIN users u ON r.user_id = u.uuid
    LEFT JOIN events e ON r.event_id = e.uuid
    ORDER BY r.created_at DESC
  `);
  return rows.map(toRegistrationWithDetails);
};

export const findRegistrationsByUser = async (userId) => {
  if (!dbReady) {
    return mockDb.registrations.filter((r) => r.user === userId);
  }

  const [rows] = await pool.query(`
    SELECT r.*, u.uuid AS user_uuid, u.name AS user_name, u.email AS user_email, u.role AS user_role, u.status AS user_status,
           e.uuid AS event_uuid, e.title AS event_title, e.date AS event_date, e.location AS event_location, e.price AS event_price, e.capacity AS event_capacity, e.organizer_id AS event_organizer
    FROM registrations r
    LEFT JOIN users u ON r.user_id = u.uuid
    LEFT JOIN events e ON r.event_id = e.uuid
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `, [userId]);
  return rows.map(toRegistrationWithDetails);
};

export const createRegistration = async ({ userId, eventId, paymentStatus = 'unpaid', ticketTier = 'general' }) => {
  if (!dbReady) {
    const reg = {
      _id: `reg_${Date.now()}`,
      user: userId,
      event: eventId,
      status: 'confirmed',
      paymentStatus,
      attended: false,
      ticketTier,
      createdAt: new Date().toISOString(),
    };
    mockDb.registrations.push(reg);
    persistMockDb();
    return reg;
  }

  const event = await findEventById(eventId);
  if (!event) return null;

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status <> ?',
    [eventId, 'cancelled']
  );
  if (Number(countRows[0].count) >= Number(event.capacity)) {
    return { error: 'Event is full' };
  }

  const uuid = `reg_${Date.now()}`;
  await pool.query(
    'INSERT INTO registrations (uuid, user_id, event_id, status, payment_status, attended, ticket_tier) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuid, userId, eventId, 'confirmed', paymentStatus, false, ticketTier]
  );
  const [rows] = await pool.query('SELECT * FROM registrations WHERE uuid = ? LIMIT 1', [uuid]);
  return rows[0] ? toRegistrationPayload(rows[0]) : null;
};

export const updateRegistrationStatus = async (registrationId, updates) => {
  if (!dbReady) {
    const reg = mockDb.registrations.find((r) => r._id === registrationId);
    if (!reg) return null;
    Object.assign(reg, updates);
    persistMockDb();
    return reg;
  }

  const fields = [];
  const values = [];
  if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
  if (updates.paymentStatus !== undefined) { fields.push('payment_status = ?'); values.push(updates.paymentStatus); }
  if (updates.attended !== undefined) { fields.push('attended = ?'); values.push(updates.attended ? 1 : 0); }
  if (updates.ticketTier !== undefined) { fields.push('ticket_tier = ?'); values.push(updates.ticketTier); }
  if (!fields.length) return null;
  values.push(registrationId);
  await pool.query(`UPDATE registrations SET ${fields.join(', ')} WHERE uuid = ?`, values);
  const [rows] = await pool.query('SELECT * FROM registrations WHERE uuid = ? LIMIT 1', [registrationId]);
  return rows[0] ? toRegistrationPayload(rows[0]) : null;
};

export const findRegistrationById = async (registrationId) => {
  if (!dbReady) {
    return mockDb.registrations.find((r) => r._id === registrationId) || null;
  }

  const [rows] = await pool.query('SELECT * FROM registrations WHERE uuid = ? LIMIT 1', [registrationId]);
  return rows[0] ? toRegistrationPayload(rows[0]) : null;
};

export const getSetting = async (key, fallback = '') => {
  if (!dbReady) {
    return mockDb.settings?.[key] ?? fallback;
  }

  const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows[0] ? rows[0].setting_value : fallback;
};

export const setSetting = async (key, value) => {
  if (!dbReady) {
    if (!mockDb.settings) mockDb.settings = {};
    mockDb.settings[key] = value;
    persistMockDb();
    return value;
  }

  const [rows] = await pool.query('SELECT setting_key FROM settings WHERE setting_key = ? LIMIT 1', [key]);
  if (rows.length) {
    await pool.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
  } else {
    await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
  }
  return value;
};

export const addNewsletterSubscriber = async (email) => {
  if (!dbReady) {
    if (!mockDb.settings.newsletter) mockDb.settings.newsletter = [];
    if (!mockDb.newsletterSubscribers) mockDb.newsletterSubscribers = [];
    if (!mockDb.settings.newsletter.includes(email)) {
      mockDb.settings.newsletter.push(email);
    }
    if (!mockDb.newsletterSubscribers.includes(email)) {
      mockDb.newsletterSubscribers.push(email);
    }
    persistMockDb();
    return true;
  }

  await pool.query('INSERT IGNORE INTO newsletter_subscribers (email) VALUES (?)', [email]);
  return true;
};

export const getNewsletterSubscribers = async () => {
  if (!dbReady) return mockDb.newsletterSubscribers || mockDb.settings.newsletter || [];
  const [rows] = await pool.query('SELECT email FROM newsletter_subscribers');
  return rows.map((row) => row.email);
};

const ensureAdminApplicationsTable = async () => {
  if (!dbReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    user_uuid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reason TEXT,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    decided_at TIMESTAMP NULL,
    admin_email VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
};

export const createAdminApplication = async ({ userId, name, email, reason }) => {
  // JSON-file mode
  if (!dbReady) {
    // Ensure admin applications store exists
    if (!mockDb.adminApplications) mockDb.adminApplications = [];

    const application = {
      _id: `adminapp_${Date.now()}`,
      userId,
      name,
      email,
      reason: reason || '',
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      decidedAt: null,
      adminEmail: null,
    };

    mockDb.adminApplications.push(application);
    persistMockDb();
    return application;
  }

  // MySQL mode
  await ensureAdminApplicationsTable();

  const uuid = `adminapp_${Date.now()}`;
  await pool.query(
    'INSERT INTO admin_applications (uuid, user_uuid, name, email, reason, status, admin_email) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuid, userId, name, email, reason || '', 'pending', null]
  );
  const [rows] = await pool.query('SELECT * FROM admin_applications WHERE uuid = ? LIMIT 1', [uuid]);
  const r = rows[0];
  return {
    _id: r.uuid,
    userId: r.user_uuid,
    name: r.name,
    email: r.email,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    adminEmail: r.admin_email,
  };
};

export const listAdminApplications = async () => {
  if (!dbReady) {
    return mockDb.adminApplications || [];
  }
  await ensureAdminApplicationsTable();
  const [rows] = await pool.query(
    'SELECT uuid,user_uuid,name,email,reason,status,created_at,decided_at,admin_email FROM admin_applications ORDER BY created_at DESC'
  );
  return rows.map((r) => ({
    _id: r.uuid,
    userId: r.user_uuid,
    name: r.name,
    email: r.email,
    reason: r.reason,
    status: r.status,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    adminEmail: r.admin_email,
  }));
};

export const setAdminApplicationDecision = async ({ applicationId, status, adminEmail }) => {
  if (!dbReady) {
    const app = (mockDb.adminApplications || []).find((a) => a._id === applicationId);
    if (!app) return null;
    app.status = status;
    app.decidedAt = new Date().toISOString();
    app.adminEmail = adminEmail || null;
    persistMockDb();
    return app;
  }

  await ensureAdminApplicationsTable();
  const [rows] = await pool.query(
    'UPDATE admin_applications SET status = ?, decided_at = CURRENT_TIMESTAMP, admin_email = ? WHERE uuid = ? LIMIT 1',
    [status, adminEmail || null, applicationId]
  );
  // MySQL returns affectedRows; fetch updated record
  const [fetchRows] = await pool.query('SELECT uuid,user_uuid,name,email,reason,status,created_at,decided_at,admin_email FROM admin_applications WHERE uuid = ? LIMIT 1', [applicationId]);
  return fetchRows[0]
    ? {
        _id: fetchRows[0].uuid,
        userId: fetchRows[0].user_uuid,
        name: fetchRows[0].name,
        email: fetchRows[0].email,
        reason: fetchRows[0].reason,
        status: fetchRows[0].status,
        createdAt: fetchRows[0].created_at,
        decidedAt: fetchRows[0].decided_at,
        adminEmail: fetchRows[0].admin_email,
      }
    : null;
};

export const createAdminUserForEmail = async ({ adminEmail, tempPassword }) => {
  // JSON-file mode
  if (!dbReady) {
    const existing = mockDb.users.find((u) => u.email === adminEmail);
    if (!existing) return null;

    // Switch role and update password
    existing.role = 'admin';
    existing.status = existing.status || 'active';
    existing.password = await bcrypt.hash(tempPassword, 10);
    persistMockDb();
    return existing;
  }

  const saltRounds = 10;
  const hashed = await bcrypt.hash(tempPassword, saltRounds);

  await pool.query('UPDATE users SET role = ?, password = ? WHERE email = ? LIMIT 1', ['admin', hashed, adminEmail]);
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [adminEmail]);
  return rows[0] ? toUserPayload(rows[0]) : null;
};

export const revokeAdminAccess = async (userId) => {
  if (!dbReady) {
    const user = mockDb.users.find((u) => u._id === userId);
    if (!user) return null;
    user.role = 'user';
    user.status = 'blocked';
    persistMockDb();
    return user;
  }
  await pool.query('UPDATE users SET role = ?, status = ? WHERE uuid = ?', ['user', 'blocked', userId]);
  return findUserById(userId);
};

export const deleteAdminApplication = async (applicationId) => {
  if (!dbReady) {
    if (!mockDb.adminApplications) return false;
    const index = mockDb.adminApplications.findIndex((a) => a._id === applicationId);
    if (index === -1) return false;
    mockDb.adminApplications.splice(index, 1);
    persistMockDb();
    return true;
  }
  await ensureAdminApplicationsTable();
  const [result] = await pool.query('DELETE FROM admin_applications WHERE uuid = ?', [applicationId]);
  return result.affectedRows > 0;
};

export const setEventStatus = async (eventId, status) => {
  return updateEvent(eventId, { status });
};

export const getPool = () => pool;

// --- Notification Helpers ---
export const createNotification = async ({ userId, title, message }) => {
  const uuid = `notify_${Date.now()}`;
  if (!dbReady) {
    if (!mockDb.notifications) mockDb.notifications = [];
    const notification = { _id: uuid, userId, title, message, isRead: false, createdAt: new Date().toISOString() };
    mockDb.notifications.unshift(notification);
    persistMockDb();
    return notification;
  }
  await pool.query(
    'INSERT INTO notifications (uuid, user_id, title, message, is_read) VALUES (?, ?, ?, ?, FALSE)',
    [uuid, userId, title, message]
  );
  return { _id: uuid, userId, title, message, isRead: false, createdAt: new Date() };
};

export const listNotifications = async (userId) => {
  if (!dbReady) {
    return (mockDb.notifications || []).filter(n => n.userId === userId);
  }
  const [rows] = await pool.query(
    'SELECT uuid AS _id, user_id AS userId, title, message, is_read AS isRead, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows.map(r => ({ ...r, isRead: Boolean(r.isRead) }));
};

export const markNotificationRead = async (notificationId) => {
  if (!dbReady) {
    const note = (mockDb.notifications || []).find(n => n._id === notificationId);
    if (note) {
      note.isRead = true;
      persistMockDb();
    }
    return true;
  }
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE uuid = ?', [notificationId]);
  return true;
};

// --- Event Review Helpers ---
export const createReview = async ({ eventId, userId, userName, rating, comment }) => {
  const uuid = `review_${Date.now()}`;
  if (!dbReady) {
    if (!mockDb.reviews) mockDb.reviews = [];
    const review = { _id: uuid, eventId, userId, userName, rating: Number(rating), comment, reply: null, createdAt: new Date().toISOString() };
    mockDb.reviews.unshift(review);
    persistMockDb();
    return review;
  }
  await pool.query(
    'INSERT INTO event_reviews (uuid, event_id, user_id, user_name, rating, comment, reply) VALUES (?, ?, ?, ?, ?, ?, NULL)',
    [uuid, eventId, userId, userName, Number(rating), comment]
  );
  return { _id: uuid, eventId, userId, userName, rating: Number(rating), comment, reply: null, createdAt: new Date() };
};

export const listReviewsByEvent = async (eventId) => {
  if (!dbReady) {
    return (mockDb.reviews || []).filter(r => r.eventId === eventId);
  }
  const [rows] = await pool.query(
    'SELECT uuid AS _id, event_id AS eventId, user_id AS userId, user_name AS userName, rating, comment, reply, created_at AS createdAt FROM event_reviews WHERE event_id = ? ORDER BY created_at DESC',
    [eventId]
  );
  return rows;
};

export const replyToReview = async (reviewId, reply) => {
  if (!dbReady) {
    const rev = (mockDb.reviews || []).find(r => r._id === reviewId);
    if (rev) {
      rev.reply = reply;
      persistMockDb();
    }
    return rev;
  }
  await pool.query('UPDATE event_reviews SET reply = ? WHERE uuid = ?', [reply, reviewId]);
  const [rows] = await pool.query('SELECT uuid AS _id, event_id AS eventId, user_id AS userId, user_name AS userName, rating, comment, reply, created_at AS createdAt FROM event_reviews WHERE uuid = ? LIMIT 1', [reviewId]);
  return rows[0] || null;
};

// --- Support Request Helpers ---
export const ensureSupportRequestsTable = async () => {
  if (!dbReady) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS support_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL,
    user_phone VARCHAR(255) NOT NULL,
    conversation LONGTEXT NOT NULL,
    status ENUM('pending','resolved') DEFAULT 'pending',
    rating INT DEFAULT NULL,
    review_comment TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL DEFAULT NULL
  )`);
};

export const createSupportRequest = async ({ userEmail, userPhone, conversation }) => {
  const uuid = `support_${Date.now()}`;
  const conversationStr = typeof conversation === 'string' ? conversation : JSON.stringify(conversation || []);
  if (!dbReady) {
    if (!mockDb.supportRequests) mockDb.supportRequests = [];
    const request = {
      _id: uuid,
      userEmail,
      userPhone,
      conversation: JSON.parse(conversationStr),
      status: 'pending',
      rating: null,
      reviewComment: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    };
    mockDb.supportRequests.unshift(request);
    persistMockDb();
    return request;
  }
  await ensureSupportRequestsTable();
  await pool.query(
    'INSERT INTO support_requests (uuid, user_email, user_phone, conversation, status) VALUES (?, ?, ?, ?, ?)',
    [uuid, userEmail, userPhone, conversationStr, 'pending']
  );
  return {
    _id: uuid,
    userEmail,
    userPhone,
    conversation: JSON.parse(conversationStr),
    status: 'pending',
    rating: null,
    reviewComment: null,
    createdAt: new Date(),
    resolvedAt: null,
  };
};

export const listSupportRequests = async () => {
  if (!dbReady) {
    return mockDb.supportRequests || [];
  }
  await ensureSupportRequestsTable();
  const [rows] = await pool.query(
    'SELECT uuid AS _id, user_email AS userEmail, user_phone AS userPhone, conversation, status, rating, review_comment AS reviewComment, created_at AS createdAt, resolved_at AS resolvedAt FROM support_requests ORDER BY created_at DESC'
  );
  return rows.map(r => ({
    ...r,
    conversation: typeof r.conversation === 'string' ? JSON.parse(r.conversation) : r.conversation
  }));
};

export const resolveSupportRequest = async (id) => {
  if (!dbReady) {
    const req = (mockDb.supportRequests || []).find(r => r._id === id);
    if (req) {
      req.status = 'resolved';
      req.resolvedAt = new Date().toISOString();
      persistMockDb();
    }
    return req;
  }
  await ensureSupportRequestsTable();
  const now = new Date();
  await pool.query(
    'UPDATE support_requests SET status = ?, resolved_at = ? WHERE uuid = ?',
    ['resolved', now, id]
  );
  const [rows] = await pool.query(
    'SELECT uuid AS _id, user_email AS userEmail, user_phone AS userPhone, conversation, status, rating, review_comment AS reviewComment, created_at AS createdAt, resolved_at AS resolvedAt FROM support_requests WHERE uuid = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    conversation: typeof rows[0].conversation === 'string' ? JSON.parse(rows[0].conversation) : rows[0].conversation
  };
};

export const submitSupportReview = async (id, { rating, reviewComment, conversation }) => {
  const conversationStr = typeof conversation === 'string' ? conversation : JSON.stringify(conversation || []);
  if (!dbReady) {
    const req = (mockDb.supportRequests || []).find(r => r._id === id);
    if (req) {
      req.rating = Number(rating);
      req.reviewComment = reviewComment || '';
      req.status = 'resolved';
      if (!req.resolvedAt) req.resolvedAt = new Date().toISOString();
      if (conversation) req.conversation = conversation;
      persistMockDb();
    }
    return req;
  }
  await ensureSupportRequestsTable();
  await pool.query(
    'UPDATE support_requests SET rating = ?, review_comment = ?, conversation = ?, status = ?, resolved_at = IFNULL(resolved_at, CURRENT_TIMESTAMP) WHERE uuid = ?',
    [Number(rating), reviewComment || '', conversationStr, 'resolved', id]
  );
  const [rows] = await pool.query(
    'SELECT uuid AS _id, user_email AS userEmail, user_phone AS userPhone, conversation, status, rating, review_comment AS reviewComment, created_at AS createdAt, resolved_at AS resolvedAt FROM support_requests WHERE uuid = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    conversation: typeof rows[0].conversation === 'string' ? JSON.parse(rows[0].conversation) : rows[0].conversation
  };
};

export const findSupportRequestById = async (id) => {
  if (!dbReady) {
    return (mockDb.supportRequests || []).find((r) => r._id === id) || null;
  }
  await ensureSupportRequestsTable();
  const [rows] = await pool.query(
    'SELECT uuid AS _id, user_email AS userEmail, user_phone AS userPhone, conversation, status, rating, review_comment AS reviewComment, created_at AS createdAt, resolved_at AS resolvedAt FROM support_requests WHERE uuid = ? LIMIT 1',
    [id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    conversation: typeof rows[0].conversation === 'string' ? JSON.parse(rows[0].conversation) : rows[0].conversation
  };
};
