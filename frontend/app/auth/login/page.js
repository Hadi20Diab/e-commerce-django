'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { extractErrors } from '../../../lib/utils';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/');
  }, [user, authLoading, router]);

  if (authLoading || user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Welcome back!', 'success');
      router.push('/');
    } catch (err) {
      addToast(extractErrors(err), 'error');
      setErrors({ general: extractErrors(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logoIcon}>L</div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to your LUXE account</p>
        </div>

        {errors.general && (
          <div className={styles.alertError}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className="formGroup">
            <label className="formLabel">Email Address</label>
            <input
              type="email"
              name="email"
              className={`formInput ${errors.email ? styles.inputError : ''}`}
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="formError">{errors.email}</span>}
          </div>

          <div className="formGroup">
            <label className="formLabel">Password</label>
            <input
              type="password"
              name="password"
              className={`formInput ${errors.password ? styles.inputError : ''}`}
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              autoComplete="current-password"
            />
            {errors.password && <span className="formError">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing In…</> : 'Sign In →'}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{' '}
          <Link href="/auth/register" className={styles.switchLink}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
