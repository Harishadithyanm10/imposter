import { Navigate, Route, Routes } from 'react-router-dom';
import AppLoader from './components/common/AppLoader.jsx';
import WelcomePage from './pages/WelcomePage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { isApp } from './native.js';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import CreateRoomPage from './pages/CreateRoomPage.jsx';
import JoinRoomPage from './pages/JoinRoomPage.jsx';
import RoomPage from './pages/RoomPage.jsx';
import GameHistoryPage from './pages/GameHistoryPage.jsx';
import LeaderboardPage from './pages/LeaderboardPage.jsx';
import PassAndPlayPage from './pages/PassAndPlayPage.jsx';
import HowToPlayPage from './pages/HowToPlayPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

/** Website: marketing page. Phone app: straight to your home screen, or the welcome screen when signed out. */
function Entry() {
  const { user, profile, loading } = useAuth();
  if (!isApp) return <LandingPage />;
  if (loading) return <AppLoader />;
  return user && profile ? <Navigate to="/dashboard" replace /> : <WelcomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Entry />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/pass-and-play" element={<PassAndPlayPage />} />
      <Route path="/how-to-play" element={<HowToPlayPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/join/:code" element={<JoinRoomPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/history" element={<GameHistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
