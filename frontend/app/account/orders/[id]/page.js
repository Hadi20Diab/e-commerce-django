'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import { ordersApi } from '../../../../lib/api';
import { formatPrice, formatDate, getOrderStatusColor, getImageUrl } from '../../../../lib/utils';
import styles from '../../account.module.css';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    ordersApi.detail(params.id)
      .then((res) => setOrder(res.data))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [user, params.id, router]);

  if (!user) return null;

  const sidebarInitial = (user.first_name?.[0] ?? user.email[0]).toUpperCase();

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
            <Link href="/account/orders" className={`${styles.navLink} ${styles.navLinkActive}`}>My Orders</Link>
            <Link href="/account/addresses" className={styles.navLink}>Addresses</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          {loading ? (
            <div className={styles.card}><p style={{ color: 'var(--text-muted)' }}>Loading order…</p></div>
          ) : notFound ? (
            <div className={styles.card} style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Order not found.</p>
              <Link href="/account/orders" className="btn btn-secondary">Back to Orders</Link>
            </div>
          ) : order ? (
            <section className={styles.card}>
              <div className={styles.detailHeader}>
                <div>
                  <h1 className={styles.detailTitle}>Order #{order.id}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Placed on {formatDate(order.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className={styles.orderStatus} style={{ background: `${getOrderStatusColor(order.status)}22`, color: getOrderStatusColor(order.status), fontSize: '0.82rem', padding: '5px 14px', borderRadius: '100px', fontWeight: 700 }}>
                    {order.status}
                  </span>
                  <Link href="/account/orders" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '7px 14px' }}>← Orders</Link>
                </div>
              </div>

              {/* Info grid */}
              <div className={styles.detailGrid}>
                <div className={styles.detailBlock}>
                  <div className={styles.detailBlockTitle}>Shipping To</div>
                  <div className={styles.detailBlockValue}>
                    {order.shipping_full_name}<br />
                    {order.shipping_street}<br />
                    {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}<br />
                    {order.shipping_country}
                  </div>
                </div>
                <div className={styles.detailBlock}>
                  <div className={styles.detailBlockTitle}>Payment</div>
                  <div className={styles.detailBlockValue} style={{ textTransform: 'capitalize' }}>
                    {order.payment_method}
                    {order.notes && <><br /><br /><em style={{ color: 'var(--text-muted)' }}>{order.notes}</em></>}
                  </div>
                </div>
              </div>

              {/* Items table */}
              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className={styles.itemName}>{item.product_name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(item.price)}</td>
                      <td style={{ textAlign: 'right' }}>{formatPrice(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <table className={styles.summaryTable}>
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(Number(order.total_price) - 10)}</td>
                  </tr>
                  <tr>
                    <td>Shipping</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(10)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-primary)' }}>Total</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(order.total_price)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
