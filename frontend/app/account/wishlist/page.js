'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useWishlist } from '../../../context/WishlistContext';
import { useToast } from '../../../context/ToastContext';
import { formatPrice, getImageUrl } from '../../../lib/utils';
import styles from '../account.module.css';
import cardStyles from './wishlist.module.css';

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { wishlist, toggleWishlist, refreshWishlist } = useWishlist();
  const { addToast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/auth/login'); return; }
    refreshWishlist();
  }, [authLoading, user, router, refreshWishlist]);

  if (authLoading || !user) return null;

  const handleRemove = async (e, productId, productName) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleWishlist(productId);
      addToast(`"${productName}" removed from wishlist.`, 'success');
    } catch {
      addToast('Could not remove item.', 'error');
    }
  };

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
            <Link href="/account/orders" className={styles.navLink}>My Orders</Link>
            <Link href="/account/addresses" className={styles.navLink}>Addresses</Link>
            <Link href="/account/wishlist" className={`${styles.navLink} ${styles.navLinkActive}`}>Wishlist</Link>
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>My Wishlist ({wishlist.length})</h2>

            {wishlist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🤍</div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Your wishlist is empty.</p>
                <Link href="/products" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className={cardStyles.grid}>
                {wishlist.map(({ id: itemId, product }) => {
                  const imageUrl = product.main_image ? getImageUrl(product.main_image.image) : null;
                  return (
                    <Link key={itemId} href={`/products/${product.slug}`} className={cardStyles.item}>
                      <div className={cardStyles.imageWrap}>
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.main_image?.alt_text || product.name}
                            fill
                            sizes="120px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div className={cardStyles.imagePlaceholder}>🛍</div>
                        )}
                      </div>
                      <div className={cardStyles.info}>
                        <p className={cardStyles.name}>{product.name}</p>
                        <p className={cardStyles.price}>{formatPrice(product.price)}</p>
                        {!product.is_in_stock && (
                          <span className={cardStyles.outOfStock}>Out of stock</span>
                        )}
                      </div>
                      <button
                        className={cardStyles.removeBtn}
                        onClick={(e) => handleRemove(e, product.id, product.name)}
                        aria-label="Remove from wishlist"
                      >
                        ✕
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
