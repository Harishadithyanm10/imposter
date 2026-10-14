import { Navigate, Route, Routes } from 'react-router-dom';
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
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/create" element={<CreateRoomPage />} />
          <Route path="/join" element={<JoinRoomPage />} />
          <Route path="/join/:code" element={<JoinRoomPage />} />
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
