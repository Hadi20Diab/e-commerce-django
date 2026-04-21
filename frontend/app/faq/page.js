import Link from 'next/link';
import styles from '../page.module.css';

export const metadata = { title: 'FAQ' };

const faqs = [
  {
    q: 'How do I track my order?',
    a: 'Once your order ships you will receive an email with a tracking number. You can also view all orders under My Account → Orders.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex) and PayPal.',
  },
  {
    q: 'Can I change or cancel my order?',
    a: 'Orders can be changed or cancelled within 1 hour of placement. Contact our support team as soon as possible.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 3–7 business days. Express delivery (1–2 days) is available at checkout.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All transactions are processed through encrypted, PCI-compliant payment gateways. We never store card details.',
  },
  {
    q: 'How do I return an item?',
    a: 'Items can be returned within 30 days. Visit our Returns page for step-by-step instructions.',
  },
];

export default function FAQPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Frequently Asked <span style={{ color: 'var(--accent)' }}>Questions</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>
        Can't find what you're looking for?{' '}
        <Link href="/contact" style={{ color: 'var(--accent)' }}>Contact us</Link>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((item, i) => (
          <details
            key={i}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '20px 24px',
              cursor: 'pointer',
            }}
          >
            <summary style={{ fontWeight: 600, fontSize: '1rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
              {item.q} <span style={{ color: 'var(--accent)' }}>+</span>
            </summary>
            <p style={{ marginTop: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
