import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';

export default function AppLayout() {
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
