# TODO - Event Management Website

## Step 1: Repo understanding / baseline checks
- [x] Read key files: App.jsx, Dashboard.jsx, AdminDashboard.jsx, AuthContext.jsx, UserProfileNav.jsx, authRoutes.js, userRoutes.js, mysql.js, fileStore.js, mockDb.js

## Step 2: Wire profile bar across the site
- [ ] Update `client/src/App.jsx` to render `UserProfileNav` globally (consistent profile bar on every page)
- [ ] Remove duplicate profile UI in `client/src/pages/Dashboard.jsx` so one consistent profile bar exists.

## Step 3: Ensure JSON database visibility in Admin panel
- [ ] Implement `GET /api/settings/storage` to return: backend mode + JSON file path + counts + lastModified.
- [ ] Update `client/src/pages/AdminDashboard.jsx` to render these stats correctly.
- [ ] Add optional admin “view database JSON” modal.

## Step 4: Verify auth/admin correctness
- [x] Review `server/middleware/authMiddleware.js` and ensure JWT sets `req.user.role` properly.
- [ ] Fix any mismatched endpoint URLs used by frontend.

## Step 5: Add 20 additional real features
- [ ] Bookmarks persistence + UI
- [ ] Persistent wallet/credits + ledger
- [ ] Pagination for events + registrations
- [ ] Advanced event search (tags, price, date)
- [ ] Notifications system
- [ ] Admin audit log
- [ ] Newsletter subscribe + admin newsletter send
- [ ] Real QR scan endpoint to mark attendance
- [ ] Backend certificate generation + download + storage
- [ ] Event publish/unpublish state
- [ ] Admin export reports
- [ ] Rate limiting for auth endpoints
- [ ] Security headers middleware
- [ ] Theme preference persistence
- [ ] Profile activity/history
- [ ] Cancel reason capture + admin visibility
- [ ] Refund processing state machine (simulated)
- [ ] Health/status endpoint
- [ ] Organizer/admin role permissions
- [ ] Ticket status timeline (created/confirmed/cancelled/attended)

## Step 6: Testing
- [ ] Run server and client
- [ ] Verify: signup/login → profile bar shows
- [ ] Verify: user dashboard works
- [ ] Verify: admin panel loads and shows DB stats
- [ ] Verify: at least a subset of new features end-to-end

