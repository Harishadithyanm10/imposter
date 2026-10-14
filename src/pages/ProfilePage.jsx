import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/common/Avatar.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import Input from '../components/common/Input.jsx';
import { ConfirmDialog } from '../components/common/Modal.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import { AVATAR_KEYS, AVATARS } from '../constants/avatars.js';
import { deleteAccount, updateProfile } from '../services/profileService.js';
import { errMsg } from '../utils/errors.js';
import { isDisplayName } from '../utils/validators.js';
import { cx } from '../utils/cx.js';

export default function ProfilePage() {
  const { user, profile, resetPassword, reauthenticate } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [v, setV] = useState({ displayName: profile.displayName, fullName: profile.fullName || '', avatar: profile.avatar || 'violet' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pw, setPw] = useState('');
  const [deleting, setDeleting] = useState(false);
  const usesPassword = user.providerData.some((p) => p.providerId === 'password');
  const dirty = v.displayName !== profile.displayName || v.fullName !== (profile.fullName || '') || v.avatar !== (profile.avatar || 'violet');

  async function save(e) {
    e.preventDefault();
    if (!isDisplayName(v.displayName)) { setError('3-20 characters: letters, numbers, dot, dash or underscore.'); return; }
    setError(''); setBusy(true);
    try { await updateProfile(user.uid, profile, { displayName: v.displayName.trim(), fullName: v.fullName, avatar: v.avatar }); toast.success('Profile saved.'); }
    catch (err) { setError(err.code === 'app/display-name-taken' ? err.message : errMsg(err)); } finally { setBusy(false); }
  }

  async function removeAccount() {
    setDeleting(true);
    try {
      await reauthenticate(pw);
      await deleteAccount(user.uid, profile);
      toast.success('Your account was deleted.');
      navigate('/', { replace: true });
    } catch (err) { toast.error(errMsg(err)); setDeleting(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      <Card>
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={v.displayName} avatar={v.avatar} size="lg" />
          <div className="min-w-0"><p className="truncate text-lg font-bold">{profile.displayName}</p><p className="truncate text-sm text-ink-400">{user.email}</p></div>
        </div>
        <form onSubmit={save} noValidate className="space-y-4">
          <Input label="Display name" value={v.displayName} onChange={(e) => setV({ ...v, displayName: e.target.value })} error={error} />
          <Input label="Full name" value={v.fullName} onChange={(e) => setV({ ...v, fullName: e.target.value })} />
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">Avatar colour</legend>
            <div className="flex flex-wrap gap-2">
              {AVATAR_KEYS.map((k) => (
                <button type="button" key={k} aria-label={k} aria-pressed={v.avatar === k} onClick={() => setV({ ...v, avatar: k })}
                  className={cx('h-9 w-9 rounded-full bg-gradient-to-br ring-offset-2 ring-offset-ink-900', AVATARS[k], v.avatar === k && 'ring-2 ring-white')} />
              ))}
            </div>
          </fieldset>
          <Button type="submit" loading={busy} disabled={!dirty}>Save changes</Button>
        </form>
      </Card>

      {usesPassword && (
        <Card>
          <h2 className="text-lg font-bold">Password</h2>
          <p className="mt-1 text-sm text-ink-300">We will email a link to {user.email}.</p>
          <Button variant="secondary" className="mt-4" onClick={async () => { try { await resetPassword(user.email); toast.success('Password reset email sent.'); } catch (e) { toast.error(errMsg(e)); } }}>Send reset email</Button>
        </Card>
      )}

      <Card className="border-hot-500/30">
        <h2 className="text-lg font-bold text-hot-400">Delete account</h2>
        <p className="mt-1 text-sm text-ink-300">Removes your profile, game history and display name, and takes you out of any rooms. This cannot be undone.</p>
        <Button variant="danger" className="mt-4" onClick={() => setConfirmDelete(true)}>Delete my account</Button>
      </Card>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={removeAccount} loading={deleting}
        title="Delete your account?" message="You will be asked to confirm your identity first." confirmLabel="Delete account">
        {usesPassword && <Input className="mt-4" label="Confirm your password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />}
      </ConfirmDialog>
    </div>
  );
}
