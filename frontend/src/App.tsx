import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  const { user, isBooting } = useAuth();

  if (isBooting) {
    return (
      <main className="boot-screen">
        <div className="brand-mark">
          <span>STAR</span>
          <strong>VNT</strong>
        </div>
        <Loader2 className="spin" />
        <p>Initializing vendor core...</p>
      </main>
    );
  }

  return user ? <DashboardPage /> : <AuthPage />;
}
