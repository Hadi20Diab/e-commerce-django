'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ordersApi, authApi } from '../../lib/api';
import { formatPrice, extractErrors } from '../../lib/utils';
import {
  MapPinIcon, CreditCardIcon, FlaskIcon, PayPalIcon,
  ShieldIcon, CheckIcon, LockIcon, CartIcon,
} from '../../components/icons';
import styles from './checkout.module.css';

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

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

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#f1f2f6',
      fontFamily: 'inherit',
      iconColor: '#9a9cb0',
      '::placeholder': { color: '#5a5c72' },
    },
    invalid: { color: '#f87171', iconColor: '#f87171' },
  },
};

// Outer wrapper sets up Stripe + PayPal providers
export default function CheckoutPage() {
  return (
    <PayPalScriptProvider
      options={{ clientId: PAYPAL_CLIENT_ID || 'test', currency: 'USD', intent: 'capture' }}
      deferLoading={!PAYPAL_CLIENT_ID}
    >
      <Elements stripe={stripePromise}>
        <CheckoutInner />
      </Elements>
    </PayPalScriptProvider>
  );
}

// Inner form uses useStripe / useElements hooks
function CheckoutInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const { addToast } = useToast();
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill shipping from saved default address
  useEffect(() => {
    if (!user) return;
    authApi.getAddresses()
      .then((res) => {
        const list = res.data.results ?? res.data;
        const addr = list.find((a) => a.is_default) ?? list[0];
        if (addr) {
          setForm((f) => ({
            ...f,
            shipping_full_name: addr.full_name || '',
            shipping_street: addr.street_address || '',
            shipping_city: addr.city || '',
            shipping_state: addr.state || '',
            shipping_postal_code: addr.postal_code || '',
            shipping_country: addr.country || '',
          }));
        }
      })
      .catch(() => {});
  }, [user]);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // { code, discount_amount }
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Derived values — computed before any early return so hooks stay stable
  const items = cart?.items ?? [];
  const shipping = 10;
  const subtotal = Number(cart?.total_price ?? 0);
  const discount = coupon ? Number(coupon.discount_amount) : 0;
  const total = subtotal + shipping - discount;

  const validate = useCallback(() => {
    const errs = {};
    if (!form.shipping_full_name.trim()) errs.shipping_full_name = 'Full name is required.';
    if (!form.shipping_street.trim()) errs.shipping_street = 'Street address is required.';
    if (!form.shipping_city.trim()) errs.shipping_city = 'City is required.';
    if (!form.shipping_state.trim()) errs.shipping_state = 'State is required.';
    if (!form.shipping_postal_code.trim()) errs.shipping_postal_code = 'Postal code is required.';
    if (!form.shipping_country.trim()) errs.shipping_country = 'Country is required.';
    return errs;
  }, [form]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  // Mock / Stripe card submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const orderPayload = { ...form, coupon_code: coupon?.code ?? '' };
      if (form.payment_method === 'mock') {
        const res = await ordersApi.create(orderPayload);
        await refreshCart();
        addToast('Order placed successfully!', 'success');
        router.push(`/account/orders/${res.data.id}`);
        return;
      }

      if (form.payment_method === 'card') {
        if (!stripe || !elements) {
          addToast('Stripe has not loaded yet. Please try again.', 'error');
          return;
        }
        // 1. Create PaymentIntent on backend
        const intentRes = await ordersApi.stripeCreateIntent();
        const { client_secret, payment_intent_id } = intentRes.data;

        // 2. Confirm card payment in the browser
        const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
          payment_method: { card: elements.getElement(CardElement) },
        });
        if (error) { addToast(error.message, 'error'); return; }
        if (paymentIntent.status !== 'succeeded') {
          addToast('Payment was not completed.', 'error');
          return;
        }

        // 3. Create Django order (server verifies intent)
        const res = await ordersApi.create({ ...orderPayload, stripe_payment_intent_id: payment_intent_id });
        await refreshCart();
        addToast('Order placed successfully!', 'success');
        router.push(`/account/orders/${res.data.id}`);
      }
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, validate, stripe, elements, refreshCart, addToast, router]);

  // PayPal callbacks — must be declared before any early returns
  const paypalCreateOrder = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      throw new Error('Please complete the shipping form first.');
    }
    const res = await ordersApi.paypalCreateOrder();
    return res.data.paypal_order_id;
  }, [form, validate]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await ordersApi.applyCoupon({ code: couponInput.trim().toUpperCase(), order_total: subtotal });
      setCoupon({ code: res.data.code, discount_amount: res.data.discount_amount });
      setCouponInput('');
    } catch (err) {
      setCouponError(err?.response?.data?.error ?? 'Invalid coupon code.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, subtotal]);

  const paypalOnApprove = useCallback(async (data) => {
    setSubmitting(true);
    try {
      const res = await ordersApi.paypalCapture({
        ...form,
        coupon_code: coupon?.code ?? '',
        payment_method: 'paypal',
        paypal_order_id: data.orderID,
      });
      await refreshCart();
      addToast('Order placed successfully!', 'success');
      router.push(`/account/orders/${res.data.id}`);
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [form, refreshCart, addToast, router]);

  const paypalOnError = useCallback((err) => {
    addToast('PayPal error: ' + (err?.message ?? 'Something went wrong.'), 'error');
  }, [addToast]);

  // ── Early returns (after ALL hooks) ──────────────────────────────────────
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <LockIcon size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please sign in to proceed with checkout.</p>
        <Link href="/auth/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px' }}>
        <CartIcon size={40} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Your cart is empty</h2>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Checkout</h1>
          <Link href="/cart" className={styles.backLink}>← Back to Cart</Link>
        </div>

        <form onSubmit={handleSubmit} className={styles.layout} noValidate>
          {/* Left: Form */}
          <div className={styles.formSection}>
            {/* Shipping */}
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <span className={styles.formCardIcon}><MapPinIcon size={18} /></span>
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
                <span className={styles.formCardIcon}><CreditCardIcon size={18} /></span>
                <h2 className={styles.formCardTitle}>Payment Method</h2>
              </div>

              <div className={styles.paymentOptions}>
                {[
                  { value: 'mock', label: 'Mock Payment', desc: 'Instant test payment (demo)', icon: <FlaskIcon size={20} /> },
                  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex', icon: <CreditCardIcon size={20} /> },
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

              {/* Stripe CardElement */}
              {form.payment_method === 'card' && (
                <>
                  <div className={styles.testCardHint}>
                    <span className={styles.testCardLabel}>Test card</span>
                    <code className={styles.testCardNumber}>4242 4242 4242 4242</code>
                    <span className={styles.testCardMeta}>· Any future date · Any CVC</span>
                  </div>
                  <div className={styles.cardElementWrapper}>
                    {stripePromise ? (
                      <CardElement options={CARD_ELEMENT_OPTIONS} />
                    ) : (
                      <p className={styles.paymentUnavailable}>
                        Card payments are not configured. Add <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your <code>.env.local</code>.
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* PayPal hidden — not active in this demo */}
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

              {/* Coupon input */}
              <div className={styles.couponSection}>
                <div className={styles.couponRow}>
                  <input
                    className="formInput"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                    placeholder="Coupon code"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {couponLoading ? 'Applying…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="formError" style={{ margin: '4px 0 0' }}>{couponError}</p>}
                {coupon && (
                  <div className={styles.couponApplied}>
                    <span>✓ <strong>{coupon.code}</strong> applied — saving {formatPrice(coupon.discount_amount)}</span>
                    <button type="button" className={styles.couponRemove} onClick={() => setCoupon(null)}>✕</button>
                  </div>
                )}
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
                {discount > 0 && (
                  <div className={styles.summaryRow} style={{ color: 'var(--success, #16a34a)' }}>
                    <span>Discount {coupon?.code && `(${coupon.code})`}</span>
                    <span>−{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className={styles.summaryTotal}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* Only show submit button for mock/card — PayPal uses its own button above */}
              {form.payment_method !== 'paypal' && (
                <button
                  type="submit"
                  className={`btn btn-primary ${styles.placeOrderBtn}`}
                  disabled={submitting || (form.payment_method === 'card' && !stripePromise)}
                >
                  {submitting
                    ? 'Placing Order…'
                    : <><CheckIcon size={16} style={{ marginRight: 6 }} />Place Order</>
                  }
                </button>
              )}

              <p className={styles.secureNote}>
                <ShieldIcon size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                Your payment info is encrypted and secure.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
