export const metadata = { title: 'Privacy Policy' };

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Privacy <span style={{ color: 'var(--accent)' }}>Policy</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: April 2026</p>

      <Section title="1. Information We Collect">
        <p>We collect information you provide directly (name, email, address, payment details) and
        information collected automatically (IP address, browser type, pages visited, cookies).</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul style={{ paddingLeft: '20px' }}>
          <li>To process and fulfil your orders</li>
          <li>To send transactional and marketing emails (with your consent)</li>
          <li>To improve our website and personalise your experience</li>
          <li>To prevent fraud and ensure platform security</li>
        </ul>
      </Section>

      <Section title="3. Sharing Your Information">
        <p>We do not sell your personal data. We share data only with trusted service providers
        (payment processors, shipping carriers) who are bound by confidentiality agreements,
        and when required by law.</p>
      </Section>

      <Section title="4. Cookies">
        <p>We use essential, analytics, and marketing cookies. You can manage your preferences
        at any time via your browser settings or our Cookie Policy page.</p>
      </Section>

      <Section title="5. Data Retention">
        <p>We retain personal data for as long as necessary to fulfil the purposes described in
        this policy, or as required by law.</p>
      </Section>

      <Section title="6. Your Rights">
        <p>Depending on your location, you may have the right to access, correct, delete, or
        export your personal data. Contact us to exercise these rights.</p>
      </Section>

      <Section title="7. Security">
        <p>We use industry-standard encryption (TLS/SSL) to protect data in transit and at rest.
        However, no system is 100% secure and we cannot guarantee absolute security.</p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this policy periodically. Material changes will be communicated via email
        or a prominent notice on our website.</p>
      </Section>
    </div>
  );
}
