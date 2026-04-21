import Link from 'next/link';

export const metadata = { title: 'Returns & Refunds' };

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function ReturnsPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Returns &amp; <span style={{ color: 'var(--accent)' }}>Refunds</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: April 2026</p>

      <Section title="30-Day Return Window">
        <p>We accept returns within <strong>30 days</strong> of delivery for items that are unused,
        unwashed, and in their original packaging with all tags attached.</p>
      </Section>

      <Section title="Non-Returnable Items">
        <ul style={{ paddingLeft: '20px' }}>
          {['Perishable goods', 'Digital products and gift cards', 'Intimate apparel and swimwear', 'Items marked as Final Sale'].map(i => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </Section>

      <Section title="How to Start a Return">
        <ol style={{ paddingLeft: '20px' }}>
          <li>Go to <strong>My Account → Orders</strong> and select the order.</li>
          <li>Click <strong>Request Return</strong> and choose the items and reason.</li>
          <li>Print the prepaid return label sent to your email.</li>
          <li>Pack the items securely and drop them off at any authorised carrier location.</li>
        </ol>
      </Section>

      <Section title="Refunds">
        <p>Once we receive and inspect your return (1–3 business days), we will notify you of approval.
        Approved refunds are processed to the original payment method within <strong>5–10 business days</strong>.</p>
      </Section>

      <Section title="Exchanges">
        <p>We do not process direct exchanges. If you need a different size or colour, return the original
        item and place a new order.</p>
      </Section>

      <Section title="Questions?">
        <p>Contact our support team via the <Link href="/contact" style={{ color: 'var(--accent)' }}>Contact page</Link>.</p>
      </Section>
    </div>
  );
}
