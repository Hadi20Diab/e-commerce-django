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
  full_name: '', street_address: '', city: '', state: '', postal_code: '', country: '',
  address_type: 'shipping', is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add new
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    fetchAddresses();
  }, [authLoading, user, router]);

  const fetchAddresses = () => {
    authApi.getAddresses()
      .then((res) => setAddresses(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (authLoading || !user) return null;

  const sidebarInitial = (user.first_name?.[0] ?? user.email[0]).toUpperCase();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(BLANK_FORM);
    setShowForm(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      full_name: addr.full_name || '',
      street_address: addr.street_address || '',
      city: addr.city || '',
      state: addr.state || '',
      postal_code: addr.postal_code || '',
      country: addr.country || '',
      address_type: addr.address_type || 'shipping',
      is_default: addr.is_default || false,
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(BLANK_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await authApi.updateAddress(editingId, form);
        addToast('Address updated!', 'success');
      } else {
        await authApi.createAddress(form);
        addToast('Address saved!', 'success');
      }
      handleCancel();
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
            <Link href="/account/wishlist" className={styles.navLink}>Wishlist</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-xl)', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0, padding: 0, border: 'none' }}>Saved Addresses</h2>
              {!showForm && (
                <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '8px 16px' }} onClick={openAdd}>
                  + Add Address
                </button>
              )}
            </div>

            {showForm && (
              <form onSubmit={handleSave} className={styles.form} style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                  {editingId ? 'Edit Address' : 'Add New Address'}
                </h3>
                <div className="formGroup">
                  <label className="formLabel">Full Name</label>
                  <input name="full_name" className="formInput" value={form.full_name} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Street Address</label>
                  <input name="street_address" className="formInput" value={form.street_address} onChange={handleChange} placeholder="123 Main Street" required />
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
                <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-sm)' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : (editingId ? 'Update Address' : 'Save Address')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </div>
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
                      <strong>{addr.full_name}</strong><br />
                      {addr.street_address}<br />
                      {addr.city}, {addr.state} {addr.postal_code}<br />
                      {addr.country}
                    </div>
                    <div className={styles.addressActions}>
                      <button className={styles.editBtn} onClick={() => openEdit(addr)}>Edit</button>
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

const BLANK_FORM = {
  full_name: '', street_address: '', city: '', state: '', postal_code: '', country: '',
  address_type: 'shipping', is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    fetchAddresses();
  }, [authLoading, user, router]);

  const fetchAddresses = () => {
    authApi.getAddresses()
      .then((res) => setAddresses(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (authLoading || !user) return null;

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
            <Link href="/account/wishlist" className={styles.navLink}>Wishlist</Link>
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
                  <label className="formLabel">Full Name</label>
                  <input name="full_name" className="formInput" value={form.full_name} onChange={handleChange} placeholder="John Doe" required />
                </div>
                <div className="formGroup">
                  <label className="formLabel">Street Address</label>
                  <input name="street_address" className="formInput" value={form.street_address} onChange={handleChange} placeholder="123 Main Street" required />
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
                      <strong>{addr.full_name}</strong><br />
                      {addr.street_address}<br />
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
