export const metadata = { title: 'Terms of Service' };

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

export default function TermsOfServicePage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Terms of <span style={{ color: 'var(--accent)' }}>Service</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: April 2026</p>

      <Section title="1. Acceptance of Terms">
        <p>By accessing or using LUXE Store, you agree to be bound by these Terms of Service and our
        Privacy Policy. If you disagree, please do not use our services.</p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to create an
        account or make a purchase. By using the site, you represent that you meet this requirement.</p>
      </Section>

      <Section title="3. Account Responsibility">
        <p>You are responsible for maintaining the confidentiality of your account credentials and for
        all activities that occur under your account. Notify us immediately of any unauthorised use.</p>
      </Section>

      <Section title="4. Products & Pricing">
        <p>We reserve the right to modify prices, discontinue products, and limit quantities at any time.
        All prices are displayed in USD and are subject to applicable taxes.</p>
      </Section>

      <Section title="5. Prohibited Conduct">
        <ul style={{ paddingLeft: '20px' }}>
          <li>Using the site for any unlawful purpose</li>
          <li>Attempting to gain unauthorised access to any part of the site</li>
          <li>Submitting false, misleading, or fraudulent information</li>
          <li>Interfering with the proper functioning of the site</li>
        </ul>
      </Section>

      <Section title="6. Limitation of Liability">
        <p>To the maximum extent permitted by law, LUXE Store shall not be liable for any indirect,
        incidental, special, or consequential damages arising from your use of our services.</p>
      </Section>

      <Section title="7. Governing Law">
        <p>These terms are governed by the laws of the jurisdiction in which the company is registered,
        without regard to conflict of law principles.</p>
      </Section>

      <Section title="8. Changes to Terms">
        <p>We may update these terms at any time. Continued use of the site after changes constitutes
        acceptance of the revised terms.</p>
      </Section>
    </div>
  );
}
