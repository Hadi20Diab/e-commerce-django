'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, getImageUrl, extractErrors } from '../../lib/utils';
import styles from './cart.module.css';

export default function CartPage() {
  const { user } = useAuth();
  const { cart, loading, updateItem, removeItem } = useCart();
  const { addToast } = useToast();

  if (!user) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🔐</div>
        <h2 className={styles.emptyTitle}>Sign in to view your cart</h2>
        <p>You need to be logged in to manage your cart.</p>
        <Link href="/auth/login" className="btn btn-primary" style={{ marginTop: '24px' }}>Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.inner}>
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading cart…
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🛒</div>
        <h2 className={styles.emptyTitle}>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: '24px' }}>Start Shopping</Link>
      </div>
    );
  }

  const handleUpdate = async (itemId, qty) => {
    try {
      await updateItem(itemId, qty);
    } catch (err) {
      addToast(extractErrors(err), 'error');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeItem(itemId);
      addToast('Item removed from cart.', 'info');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Shopping Cart <span>({items.length})</span></h1>
        </div>

        <div className={styles.layout}>
          {/* Items */}
          <div className={styles.items}>
            {items.map((item) => {
              const imageUrl = item.product.main_image ? getImageUrl(item.product.main_image.image) : null;
              return (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {imageUrl ? (
                      <Image src={imageUrl} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="100px" />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>🛍</span>
                    )}
                  </div>
                  <div className={styles.itemInfo}>
                    <Link href={`/products/${item.product.slug}`} className={styles.itemName}>
                      {item.product.name}
                    </Link>
                    {item.product.category_name && (
                      <span className={styles.itemCategory}>{item.product.category_name}</span>
                    )}
                    <div className={styles.itemPrice}>{formatPrice(item.product.price)}</div>
                  </div>
                  <div className={styles.itemControls}>
                    <div className={styles.qtySelector}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => handleUpdate(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className={styles.qtyVal}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => handleUpdate(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                      >+</button>
                    </div>
                    <div className={styles.itemSubtotal}>{formatPrice(item.subtotal)}</div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => handleRemove(item.id)}
                      title="Remove"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className={styles.summary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(cart?.total_price ?? 0)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span className={styles.shippingNote}>Calculated at checkout</span>
              </div>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>{formatPrice(cart?.total_price ?? 0)}</span>
            </div>
            <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`}>
              Proceed to Checkout →
            </Link>
            <Link href="/products" className={`btn btn-secondary ${styles.continueBtn}`}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
