export const metadata = { title: 'Shipping Policy' };

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function ShippingPolicyPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Shipping <span style={{ color: 'var(--accent)' }}>Policy</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: April 2026</p>

      <Section title="Processing Time">
        <p>All orders are processed within 1–2 business days (Monday–Friday, excluding public holidays).
        Orders placed on weekends or holidays are processed the next business day.</p>
      </Section>

      <Section title="Shipping Methods & Estimated Delivery">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Method</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Estimated Delivery</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Cost</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Standard', '3–7 business days', 'Free over $50, otherwise $5.99'],
              ['Express', '1–2 business days', '$12.99'],
              ['Overnight', 'Next business day', '$24.99'],
            ].map(([m, d, c]) => (
              <tr key={m} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px' }}>{m}</td>
                <td style={{ padding: '10px 12px' }}>{d}</td>
                <td style={{ padding: '10px 12px' }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="International Shipping">
        <p>We currently ship to over 30 countries. International orders may be subject to customs duties
        and taxes, which are the responsibility of the recipient. Delivery times vary by destination
        (typically 7–21 business days).</p>
      </Section>

      <Section title="Order Tracking">
        <p>Once your order has shipped, you will receive a confirmation email with a tracking number.
        You can also track your order under <strong>My Account → Orders</strong>.</p>
      </Section>

      <Section title="Lost or Damaged Shipments">
        <p>If your order arrives damaged or is lost in transit, please contact us within 7 days of the
        expected delivery date. We will arrange a replacement or refund.</p>
      </Section>
    </div>
  );
}
