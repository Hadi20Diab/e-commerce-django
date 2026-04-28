'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ordersApi } from '../../../lib/api';
import { formatPrice, formatDate, getOrderStatusColor } from '../../../lib/utils';
import styles from '../account.module.css';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    ordersApi.list().then((res) => setOrders(res.data.results ?? res.data)).catch(() => {}).finally(() => setLoading(false));
  }, [authLoading, user, router]);

  if (authLoading || !user) return null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <aside className={styles.sidebar}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatar}>{(user.first_name?.[0] ?? user.email[0]).toUpperCase()}</div>
            <div className={styles.avatarName}>{user.first_name} {user.last_name}</div>
            <div className={styles.avatarEmail}>{user.email}</div>
          </div>
          <nav className={styles.nav}>
            <Link href="/account" className={styles.navLink}>Profile</Link>
            <Link href="/account/orders" className={`${styles.navLink} ${styles.navLinkActive}`}>My Orders</Link>
            <Link href="/account/addresses" className={styles.navLink}>Addresses</Link>
            <Link href="/account/wishlist" className={styles.navLink}>Wishlist</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>My Orders</h2>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading orders…</p>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📦</div>
                <p style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet.</p>
                <Link href="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>Shop Now</Link>
              </div>
            ) : (
              <div className={styles.orderList}>
                {orders.map((order) => (
                  <Link key={order.id} href={`/account/orders/${order.id}`} className={styles.orderCard}>
                    <div className={styles.orderInfo}>
                      <div className={styles.orderNumber}>Order #{order.id}</div>
                      <div className={styles.orderDate}>{formatDate(order.created_at)} · {order.items?.length ?? '—'} item(s)</div>
                    </div>
                    <span className={styles.orderStatus} style={{ background: `${getOrderStatusColor(order.status)}22`, color: getOrderStatusColor(order.status) }}>
                      {order.status}
                    </span>
                    <div className={styles.orderTotal}>{formatPrice(order.total_price)}</div>
                    <span className={styles.orderArrow}>›</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
