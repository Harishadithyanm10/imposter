import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import GoogleButton from '../components/auth/GoogleButton.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { errMsg } from '../utils/errors.js';
import { isEmail } from '../utils/validators.js';

export default function LoginPage() {
  const { user, profile, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const dest = location.state?.from || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => { if (user && profile) navigate(dest, { replace: true }); }, [user, profile, dest, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (!isEmail(email)) found.email = 'Enter a valid email address.';
    if (!password) found.password = 'Enter your password.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try { await login(email, password, remember); } catch (err) { setErrors({ form: errMsg(err) }); setBusy(false); }
  }

  async function onGoogle() {
    setGoogleBusy(true);
    try { await loginWithGoogle(); } catch (err) { toast.error(errMsg(err)); } finally { setGoogleBusy(false); }
  }

  return (
    <AuthShell title="Welcome back" subtitle={dest.startsWith('/join/') ? 'Log in to join your friends’ room.' : 'Log in to start or join a game.'}
      footer={<>New here? <Link to="/register" state={location.state} className="font-semibold text-brand-300 hover:underline">Create an account</Link></>}>
      <GoogleButton onClick={onGoogle} loading={googleBusy} />
      <div className="my-5 flex items-center gap-3 text-xs text-ink-400"><hr className="flex-1 border-ink-700" />or use email<hr className="flex-1 border-ink-700" /></div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors.form && <p role="alert" className="rounded-xl bg-hot-600/10 px-3 py-2 text-sm text-hot-400 ring-1 ring-hot-500/30">{errors.form}</p>}
        <Input label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-300"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand-500" />Remember me</label>
          <Link to="/forgot-password" className="text-brand-300 hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full" loading={busy}>Log in</Button>
      </form>
    </AuthShell>
  );
}
