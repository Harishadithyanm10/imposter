import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { errMsg } from '../utils/errors.js';
import { isEmail } from '../utils/validators.js';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) { setError('Enter a valid email address.'); return; }
    setError(''); setBusy(true);
    try { await resetPassword(email); setSent(true); } catch (err) {
      // Do not reveal whether an account exists.
      if (err.code === 'auth/user-not-found') setSent(true); else setError(errMsg(err));
    } finally { setBusy(false); }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link to choose a new one."
      footer={<Link to="/login" className="font-semibold text-brand-300 hover:underline">Back to login</Link>}>
      {sent ? (
        <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200 ring-1 ring-emerald-500/30">If an account exists for {email}, a reset link is on its way. Check your spam folder too.</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Input label="Email address" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" className="w-full" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
