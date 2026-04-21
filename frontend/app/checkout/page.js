'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ordersApi } from '../../lib/api';
import { formatPrice, extractErrors } from '../../lib/utils';
import styles from './checkout.module.css';

const INITIAL_FORM = {
  shipping_full_name: '',
  shipping_street: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postal_code: '',
  shipping_country: '',
  payment_method: 'mock',
  notes: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const { addToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please sign in to proceed with checkout.</p>
        <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Your cart is empty</h2>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  const shipping = 10;
  const subtotal = Number(cart?.total_price ?? 0);
  const total = subtotal + shipping;

  const validate = () => {
    const errs = {};
    if (!form.shipping_full_name.trim()) errs.shipping_full_name = 'Full name is required.';
    if (!form.shipping_street.trim()) errs.shipping_street = 'Street address is required.';
    if (!form.shipping_city.trim()) errs.shipping_city = 'City is required.';
    if (!form.shipping_state.trim()) errs.shipping_state = 'State is required.';
    if (!form.shipping_postal_code.trim()) errs.shipping_postal_code = 'Postal code is required.';
    if (!form.shipping_country.trim()) errs.shipping_country = 'Country is required.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const res = await ordersApi.create(form);
      await refreshCart();
      addToast('Order placed successfully!', 'success');
      router.push(`/account/orders/${res.data.id}`);
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Checkout</h1>
          <Link href="/cart" className={styles.backLink}>← Back to Cart</Link>
        </div>

        <form onSubmit={handleSubmit} className={styles.layout}>
          {/* Left: Form */}
          <div className={styles.formSection}>
            {/* Shipping */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardIcon}>📍</span>
                <h2 className={styles.formCardTitle}>Shipping Information</h2>
              </div>

              <div className={styles.formGrid}>
                <div className={`formGroup ${styles.fullWidth}`}>
                  <label className="formLabel">Full Name</label>
                  <input
                    name="shipping_full_name"
                    className={`formInput ${errors.shipping_full_name ? styles.inputError : ''}`}
                    value={form.shipping_full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                  {errors.shipping_full_name && <span className="formError">{errors.shipping_full_name}</span>}
                </div>

                <div className={`formGroup ${styles.fullWidth}`}>
                  <label className="formLabel">Street Address</label>
                  <input
                    name="shipping_street"
                    className={`formInput ${errors.shipping_street ? styles.inputError : ''}`}
                    value={form.shipping_street}
                    onChange={handleChange}
                    placeholder="123 Main Street, Apt 4B"
                  />
                  {errors.shipping_street && <span className="formError">{errors.shipping_street}</span>}
                </div>

                <div className="formGroup">
                  <label className="formLabel">City</label>
                  <input
                    name="shipping_city"
                    className={`formInput ${errors.shipping_city ? styles.inputError : ''}`}
                    value={form.shipping_city}
                    onChange={handleChange}
                    placeholder="New York"
                  />
                  {errors.shipping_city && <span className="formError">{errors.shipping_city}</span>}
                </div>

                <div className="formGroup">
                  <label className="formLabel">State / Province</label>
                  <input
                    name="shipping_state"
                    className={`formInput ${errors.shipping_state ? styles.inputError : ''}`}
                    value={form.shipping_state}
                    onChange={handleChange}
                    placeholder="NY"
                  />
                  {errors.shipping_state && <span className="formError">{errors.shipping_state}</span>}
                </div>

                <div className="formGroup">
                  <label className="formLabel">Postal Code</label>
                  <input
                    name="shipping_postal_code"
                    className={`formInput ${errors.shipping_postal_code ? styles.inputError : ''}`}
                    value={form.shipping_postal_code}
                    onChange={handleChange}
                    placeholder="10001"
                  />
                  {errors.shipping_postal_code && <span className="formError">{errors.shipping_postal_code}</span>}
                </div>

                <div className="formGroup">
                  <label className="formLabel">Country</label>
                  <input
                    name="shipping_country"
                    className={`formInput ${errors.shipping_country ? styles.inputError : ''}`}
                    value={form.shipping_country}
                    onChange={handleChange}
                    placeholder="United States"
                  />
                  {errors.shipping_country && <span className="formError">{errors.shipping_country}</span>}
                </div>

                <div className={`formGroup ${styles.fullWidth}`}>
                  <label className="formLabel">Order Notes (optional)</label>
                  <textarea
                    name="notes"
                    className="formInput"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Special delivery instructions…"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardIcon}>💳</span>
                <h2 className={styles.formCardTitle}>Payment Method</h2>
              </div>

              <div className={styles.paymentOptions}>
                {[
                  { value: 'mock', label: 'Mock Payment', desc: 'Instant test payment (demo)', icon: '🧪' },
                  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex', icon: '💳' },
                  { value: 'paypal', label: 'PayPal', desc: 'Fast & secure checkout', icon: '🅿' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`${styles.paymentOption} ${form.payment_method === opt.value ? styles.paymentOptionSelected : ''}`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={opt.value}
                      checked={form.payment_method === opt.value}
                      onChange={handleChange}
                      className={styles.radioInput}
                    />
                    <span className={styles.paymentIcon}>{opt.icon}</span>
                    <div>
                      <div className={styles.paymentLabel}>{opt.label}</div>
                      <div className={styles.paymentDesc}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Order Summary</h2>

              <div className={styles.summaryItems}>
                {items.map((item) => (
                  <div key={item.id} className={styles.summaryItem}>
                    <span className={styles.summaryItemName}>
                      {item.product.name}
                      <span className={styles.summaryItemQty}> ×{item.quantity}</span>
                    </span>
                    <span className={styles.summaryItemPrice}>{formatPrice(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className={styles.summaryBreakdown}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Shipping</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.placeOrderBtn}`}
                disabled={submitting}
              >
                {submitting ? 'Placing Order…' : '✓ Place Order'}
              </button>

              <p className={styles.secureNote}>
                🔒 Your payment info is encrypted and secure.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
