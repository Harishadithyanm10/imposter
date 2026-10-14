import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import GoogleButton from '../components/auth/GoogleButton.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { validateRegister } from '../utils/validators.js';
import { errMsg } from '../utils/errors.js';
import { AVATAR_KEYS, AVATARS } from '../constants/avatars.js';
import { isDisplayNameAvailable } from '../services/authService.js';
import { cx } from '../utils/cx.js';

export default function RegisterPage() {
  const { user, profile, signUp, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const dest = location.state?.from || '/dashboard';
  const [v, setV] = useState({ fullName: '', displayName: '', email: '', password: '', confirm: '', terms: false, avatar: AVATAR_KEYS[0] });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  useEffect(() => { if (user && profile && !busy) navigate(dest, { replace: true }); }, [user, profile, busy, dest, navigate]);

  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function checkName() {
    if (errors.displayName || !v.displayName.trim() || validateRegister({ ...v, terms: true }).displayName) return;
    try {
      if (!(await isDisplayNameAvailable(v.displayName.trim()))) setErrors((s) => ({ ...s, displayName: 'That display name is already taken.' }));
    } catch { /* checked again on submit */ }
  }

  async function onSubmit(e) {
    e.preventDefault();
    const found = validateRegister(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await signUp({ fullName: v.fullName.trim(), displayName: v.displayName.trim(), email: v.email, password: v.password, avatar: v.avatar });
      navigate(dest, { replace: true });
    } catch (err) {
      if (err.code === 'app/display-name-taken') setErrors({ displayName: 'That display name is already taken.' });
      else if (err.code === 'auth/email-already-in-use') setErrors({ email: errMsg(err) });
      else toast.error(errMsg(err));
    } finally { setBusy(false); }
  }

  async function onGoogle() {
    setGoogleBusy(true);
    try { await loginWithGoogle(); navigate(dest, { replace: true }); } catch (err) { toast.error(errMsg(err)); } finally { setGoogleBusy(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Pick a display name your friends will recognise."
      footer={<>Already have an account? <Link to="/login" state={location.state} className="font-semibold text-brand-300 hover:underline">Log in</Link></>}>
      <GoogleButton onClick={onGoogle} loading={googleBusy} />
      <div className="my-5 flex items-center gap-3 text-xs text-ink-400"><hr className="flex-1 border-ink-700" />or use email<hr className="flex-1 border-ink-700" /></div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Input label="Full name" autoComplete="name" value={v.fullName} onChange={set('fullName')} error={errors.fullName} />
        <Input label="Display name" autoComplete="nickname" value={v.displayName} onChange={set('displayName')} onBlur={checkName} error={errors.displayName} hint="Shown to other players. Must be unique." />
        <Input label="Email address" type="email" autoComplete="email" value={v.email} onChange={set('email')} error={errors.email} />
        <Input label="Password" type="password" autoComplete="new-password" value={v.password} onChange={set('password')} error={errors.password} hint="At least 8 characters." />
        <Input label="Confirm password" type="password" autoComplete="new-password" value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Avatar colour</legend>
          <div className="flex flex-wrap gap-2">
            {AVATAR_KEYS.map((k) => (
              <button type="button" key={k} onClick={() => setV((s) => ({ ...s, avatar: k }))} aria-label={k} aria-pressed={v.avatar === k}
                className={cx('h-9 w-9 rounded-full bg-gradient-to-br ring-offset-2 ring-offset-ink-900', AVATARS[k], v.avatar === k && 'ring-2 ring-white')} />
            ))}
          </div>
        </fieldset>
        <div>
          <label className="flex items-start gap-3 text-sm text-ink-300">
            <input type="checkbox" checked={v.terms} onChange={set('terms')} className="mt-1 h-4 w-4 accent-brand-500" />
            <span>I accept the terms of use and understand my display name is visible to other players.</span>
          </label>
          {errors.terms && <p role="alert" className="mt-1.5 text-sm text-hot-400">{errors.terms}</p>}
        </div>
        <Button type="submit" className="w-full" loading={busy}>Create account</Button>
      </form>
    </AuthShell>
  );
}
