'use client';

import { useApp } from '@/lib/store';
import LoginPage from '@/components/auth/LoginPage';
import Navbar from '@/components/layout/Navbar';
import DemoBar from '@/components/layout/DemoBar';
import DonorDashboard from '@/components/donor/DonorDashboard';
import NgoDashboard from '@/components/ngo/NgoDashboard';
import VolunteerDashboard from '@/components/volunteer/VolunteerDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function Home() {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'donor': return <DonorDashboard />;
      case 'ngo': return <NgoDashboard />;
      case 'volunteer': return <VolunteerDashboard />;
      case 'admin': return <AdminDashboard />;
      default: return <DonorDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-rescue-bg">
      <Navbar />
      <DemoBar />
      <main className="pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}
