'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { authApi } from '../../../lib/api';
import { extractErrors } from '../../../lib/utils';
import styles from '../account.module.css';

const BLANK_FORM = {
  street: '', city: '', state: '', postal_code: '', country: '', is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchAddresses();
  }, [user, router]);

  const fetchAddresses = () => {
    authApi.getAddresses()
      .then((res) => setAddresses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!user) return null;

  const sidebarInitial = (user.first_name?.[0] ?? user.email[0]).toUpperCase();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.createAddress(form);
      addToast('Address saved!', 'success');
      setForm(BLANK_FORM);
      setShowForm(false);
      fetchAddresses();
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await authApi.deleteAddress(id);
      addToast('Address removed.', 'info');
      setAddresses((a) => a.filter((x) => x.id !== id));
    } catch {
      addToast('Failed to delete address.', 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>{sidebarInitial}</div>
            <div className={styles.avatarName}>{user.first_name} {user.last_name}</div>
            <div className={styles.avatarEmail}>{user.email}</div>
          </div>
          <nav className={styles.nav}>
            <Link href="/account" className={styles.navLink}>Profile</Link>
            <Link href="/account/orders" className={styles.navLink}>My Orders</Link>
            <Link href="/account/addresses" className={`${styles.navLink} ${styles.navLinkActive}`}>Addresses</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 'none' }}>Saved Addresses</h2>
              <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px' }} onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'Cancel' : '+ Add Address'}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleSave} className={styles.form} style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <div className="formGroup">
                  <label className="formLabel">Street Address</label>
                  <input name="street" className="formInput" value={form.street} onChange={handleChange} placeholder="123 Main Street" required />
                </div>
                <div className={styles.twoCol}>
                  <div className="formGroup">
                    <label className="formLabel">City</label>
                    <input name="city" className="formInput" value={form.city} onChange={handleChange} placeholder="New York" required />
                  </div>
                  <div className="formGroup">
                    <label className="formLabel">State</label>
                    <input name="state" className="formInput" value={form.state} onChange={handleChange} placeholder="NY" required />
                  </div>
                </div>
                <div className={styles.twoCol}>
                  <div className="formGroup">
                    <label className="formLabel">Postal Code</label>
                    <input name="postal_code" className="formInput" value={form.postal_code} onChange={handleChange} placeholder="10001" required />
                  </div>
                  <div className="formGroup">
                    <label className="formLabel">Country</label>
                    <input name="country" className="formInput" value={form.country} onChange={handleChange} placeholder="United States" required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" name="is_default" checked={form.is_default} onChange={handleChange} style={{ accentColor: 'var(--primary)' }} />
                  Set as default address
                </label>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Address'}
                </button>
              </form>
            )}

            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading addresses…</p>
            ) : addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📬</div>
                <p style={{ color: 'var(--text-muted)' }}>No saved addresses yet.</p>
              </div>
            ) : (
              <div className={styles.addressGrid}>
                {addresses.map((addr) => (
                  <div key={addr.id} className={`${styles.addressCard} ${addr.is_default ? styles.addressCardDefault : ''}`}>
                    {addr.is_default && <span className={styles.addressBadge}>Default</span>}
                    <div className={styles.addressText}>
                      {addr.street}<br />
                      {addr.city}, {addr.state} {addr.postal_code}<br />
                      {addr.country}
                    </div>
                    <div className={styles.addressActions}>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(addr.id)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
