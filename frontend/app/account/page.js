'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi } from '../../lib/api';
import { extractErrors } from '../../lib/utils';
import styles from './account.module.css';

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', bio: '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', new_password2: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
  }, [user, router]);

  if (authLoading || !user) return null;

  const initials = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0].toUpperCase();

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange = (e) => {
    setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (pwErrors[e.target.name]) setPwErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      addToast('Profile updated successfully!', 'success');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.old_password) errs.old_password = 'Required.';
    if (!pwForm.new_password) errs.new_password = 'Required.';
    if (pwForm.new_password.length < 8) errs.new_password = 'Min. 8 characters.';
    if (pwForm.new_password !== pwForm.new_password2) errs.new_password2 = 'Passwords do not match.';
    if (Object.keys(errs).length > 0) { setPwErrors(errs); return; }

    setChangingPw(true);
    try {
      await authApi.changePassword(pwForm);
      addToast('Password changed successfully.', 'success');
      setPwForm({ old_password: '', new_password: '', new_password2: '' });
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Sidebar nav */}
        <aside className={styles.sidebar}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.avatarName}>{user.first_name} {user.last_name}</div>
            <div className={styles.avatarEmail}>{user.email}</div>
          </div>
          <nav className={styles.nav}>
            <Link href="/account" className={`${styles.navLink} ${styles.navLinkActive}`}>Profile</Link>
            <Link href="/account/orders" className={styles.navLink}>My Orders</Link>
            <Link href="/account/addresses" className={styles.navLink}>Addresses</Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          {/* Profile form */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Personal Information</h2>
            <form onSubmit={handleSaveProfile} className={styles.form}>
              <div className={styles.twoCol}>
                <div className="formGroup">
                  <label className="formLabel">First Name</label>
                  <input name="first_name" className="formInput" value={form.first_name} onChange={handleChange} />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Last Name</label>
                  <input name="last_name" className="formInput" value={form.last_name} onChange={handleChange} />
                </div>
              </div>
              <div className="formGroup">
                <label className="formLabel">Email</label>
                <input className="formInput" value={user.email} disabled style={{ opacity: 0.5 }} />
              </div>
              <div className="formGroup">
                <label className="formLabel">Phone</label>
                <input name="phone" className="formInput" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="formGroup">
                <label className="formLabel">Bio</label>
                <textarea name="bio" className="formInput" value={form.bio} onChange={handleChange} rows={3} style={{ resize: 'vertical' }} placeholder="Tell us a bit about yourself…" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </section>

          {/* Change password */}
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Change Password</h2>
            <form onSubmit={handleChangePassword} className={styles.form}>
              <div className="formGroup">
                <label className="formLabel">Current Password</label>
                <input type="password" name="old_password" className={`formInput ${pwErrors.old_password ? styles.inputError : ''}`} value={pwForm.old_password} onChange={handlePwChange} autoComplete="current-password" />
                {pwErrors.old_password && <span className="formError">{pwErrors.old_password}</span>}
              </div>
              <div className={styles.twoCol}>
                <div className="formGroup">
                  <label className="formLabel">New Password</label>
                  <input type="password" name="new_password" className={`formInput ${pwErrors.new_password ? styles.inputError : ''}`} value={pwForm.new_password} onChange={handlePwChange} autoComplete="new-password" />
                  {pwErrors.new_password && <span className="formError">{pwErrors.new_password}</span>}
                </div>
                <div className="formGroup">
                  <label className="formLabel">Confirm New Password</label>
                  <input type="password" name="new_password2" className={`formInput ${pwErrors.new_password2 ? styles.inputError : ''}`} value={pwForm.new_password2} onChange={handlePwChange} autoComplete="new-password" />
                  {pwErrors.new_password2 && <span className="formError">{pwErrors.new_password2}</span>}
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" disabled={changingPw}>
                {changingPw ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
