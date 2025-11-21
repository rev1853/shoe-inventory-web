import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Variants from './components/Variants';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import StockMovements from './components/StockMovements';
import api, { setAuthToken, setUnauthorizedHandler } from './lib/api';
import { User } from './lib/types';
import { toast } from 'sonner@2.0.3';

const unpackUser = (payload: any): User => {
  // API resources may return `{ data: User }` (UserResource) or plain User
  if (payload?.data?.email) return payload.data as User;
  return payload as User;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      localStorage.removeItem('auth_token');
      setUser(null);
    });

    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setInitializing(false);
      return;
    }

    setAuthToken(storedToken);
    api.get<User>('/auth/me')
      .then((response) => setUser(unpackUser(response.data)))
      .catch((error) => {
        console.error('Failed to restore session', error);
        toast.error('Session expired. Please log in again.');
        setAuthToken(null);
        localStorage.removeItem('auth_token');
      })
      .finally(() => setInitializing(false));
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });

    setAuthToken(data.token);
    localStorage.setItem('auth_token', data.token);
    setUser(unpackUser(data.user));
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error(error);
    } finally {
      setAuthToken(null);
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            user ? 
            <Navigate to="/dashboard" /> : 
            <LoginPage onLogin={handleLogin} />
          } 
        />
        <Route
          path="/*"
          element={
            user ? (
              <DashboardLayout currentUser={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/variants" element={<Variants />} />
                  <Route path="/suppliers" element={<Suppliers />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/stock-movements" element={<StockMovements />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
