import { useEffect, useState } from 'react';
import { User } from './lib/supabase';
import { onAuthStateChange } from './lib/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ManagerDashboard from './pages/ManagerDashboard';

type Page = 'landing' | 'login' | 'register' | 'customer' | 'staff' | 'manager';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((profile) => {
      setUser(profile);
      setLoading(false);

      if (profile) {
        if (profile.role === 'customer') {
          setCurrentPage('customer');
        } else if (profile.role === 'staff') {
          setCurrentPage('staff');
        } else if (profile.role === 'manager') {
          setCurrentPage('manager');
        }
      } else {
        setCurrentPage('landing');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan mx-auto"></div>
          <p className="mt-4 text-[#444] font-medium">Loading TableTime...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={setCurrentPage} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'register':
        return <RegisterPage onNavigate={setCurrentPage} />;
      case 'customer':
        return <CustomerDashboard user={user!} onNavigate={(page) => setCurrentPage(page as Page)} />;
      case 'staff':
        return <StaffDashboard user={user!} onNavigate={(page) => setCurrentPage(page as Page)} />;
      case 'manager':
        return <ManagerDashboard user={user!} onNavigate={(page) => setCurrentPage(page as Page)} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };

  return <div className="min-h-screen bg-cream">{renderPage()}</div>;
}

export default App;
