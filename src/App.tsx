import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';

type Page = 'login' | 'admin' | 'member';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');

  const handleLogin = (role: 'admin' | 'member') => {
    setCurrentPage(role === 'admin' ? 'admin' : 'member');
  };

  const handleLogout = () => {
    setCurrentPage('login');
  };

  switch (currentPage) {
    case 'login':
      return <LoginPage onLogin={handleLogin} />;
    case 'admin':
      return <AdminDashboard onLogout={handleLogout} />;
    case 'member':
      return <MemberDashboard onLogout={handleLogout} />;
    default:
      return <LoginPage onLogin={handleLogin} />;
  }
}
