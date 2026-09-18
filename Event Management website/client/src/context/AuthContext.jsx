import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const storedUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(storedUser);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data._id) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));

      const timeout = setTimeout(() => {
        logout();
        alert('Session expired. Please log in again.');
      }, 3600000);
      return () => clearTimeout(timeout);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, role: data.role, isFirstUser: data.isFirstUser };
    }
    return { success: false, message: data.message, notFound: data.notFound, exists: data.exists };
  };

  const register = async (name, email, password, extraData = {}) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, ...extraData })
    });
    const data = await res.json();

    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, isFirstUser: data.isFirstUser };
    }
    return { success: false, message: data.message, exists: data.exists };
  };

  const googleAuth = async (name, email) => {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, role: data.role, isFirstUser: data.isFirstUser };
    }
    return { success: false, message: data.message };
  };

  const sendOtp = async (email, name, purpose, authData) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, purpose, authData })
    });
    const data = await res.json();
    return { success: res.ok, message: data.message, notFound: data.notFound, exists: data.exists, devOtp: data.devOtp };
  };

  const finishSession = (data) => {
    if (data && data.token) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
  };

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const newData = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(newData));
      return newData;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, googleAuth, sendOtp, finishSession, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
