import './globals.css';
import { Toaster } from 'react-hot-toast';
import AdminNav from '@/components/AdminNav';

export const metadata = {
  title: 'Daily Paisa - Admin',
  description: 'Admin Management Console',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">

        {/* Main Content Area - pb-24 ensures content isn't hidden behind the bottom nav */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
          {children}
        </main>

        {/* Bottom Navigation */}
        <AdminNav />

        {/* Toast Notifications */}
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }} 
        />
      </body>
    </html>
  );
              }
