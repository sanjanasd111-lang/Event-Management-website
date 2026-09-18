import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import EventAppLayout from './EventAppLayout.jsx';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ExploreEvents from './pages/ExploreEvents';
import EventDetails from './pages/EventDetails';
import DeveloperCredits from './pages/DeveloperCredits';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Features from './pages/Features';
import CustomCursor from './components/CustomCursor';
import ScrollProgress from './components/ScrollProgress';
import GlobalSearch from './components/GlobalSearch';
import GlobalBanner from './components/GlobalBanner';
import HelpdeskWidget from './components/HelpdeskWidget';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <GlobalBanner />
        <ScrollProgress />
        <CustomCursor />
        <GlobalSearch />
        <HelpdeskWidget />
        <div className="min-h-screen font-sans bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
          <Routes>
            <Route element={<EventAppLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/events" element={<ExploreEvents />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/features" element={<Features />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/credits" element={<DeveloperCredits />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
