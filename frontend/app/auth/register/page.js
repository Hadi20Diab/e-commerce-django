'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { extractErrors } from '../../../lib/utils';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '',
    phone: '', password: '', password2: '',
  });
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

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.password) errs.password = 'Password is required.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(form);
      addToast('Account created! Welcome to LUXE.', 'success');
      router.push('/');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.cardWide}`}>
        <div className={styles.cardHeader}>
          <div className={styles.logoIcon}>L</div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join LUXE for a premium experience</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.twoCol}>
            <div className="formGroup">
              <label className="formLabel">First Name</label>
              <input
                name="first_name"
                className={`formInput ${errors.first_name ? styles.inputError : ''}`}
                value={form.first_name}
                onChange={handleChange}
                placeholder="John"
              />
              {errors.first_name && <span className="formError">{errors.first_name}</span>}
            </div>
            <div className="formGroup">
              <label className="formLabel">Last Name</label>
              <input
                name="last_name"
                className={`formInput ${errors.last_name ? styles.inputError : ''}`}
                value={form.last_name}
                onChange={handleChange}
                placeholder="Doe"
              />
              {errors.last_name && <span className="formError">{errors.last_name}</span>}
            </div>
          </div>

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
            <label className="formLabel">Phone (optional)</label>
            <input
              type="tel"
              name="phone"
              className="formInput"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div className={styles.twoCol}>
            <div className="formGroup">
              <label className="formLabel">Password</label>
              <input
                type="password"
                name="password"
                className={`formInput ${errors.password ? styles.inputError : ''}`}
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              {errors.password && <span className="formError">{errors.password}</span>}
            </div>
            <div className="formGroup">
              <label className="formLabel">Confirm Password</label>
              <input
                type="password"
                name="password2"
                className={`formInput ${errors.password2 ? styles.inputError : ''}`}
                value={form.password2}
                onChange={handleChange}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
              {errors.password2 && <span className="formError">{errors.password2}</span>}
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating Account…</> : 'Create Account →'}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.switchLink}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
