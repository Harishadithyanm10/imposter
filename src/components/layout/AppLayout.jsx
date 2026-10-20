import { Outlet } from 'react-router-dom';
import AppShell from './AppShell.jsx';
import Navbar from './Navbar.jsx';
import { isApp } from '../../native.js';

export default function AppLayout() {
  if (isApp) return <AppShell />; // phone-app interface (tab bar, app bar, transitions)
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
