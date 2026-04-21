export const metadata = { title: 'Cookie Policy' };

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '36px' }}>
    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>{title}</h2>
    <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
  </section>
);

const cookieTypes = [
  {
    type: 'Essential',
    purpose: 'Required for the site to function (authentication, cart, CSRF protection).',
    canDisable: 'No',
  },
  {
    type: 'Analytics',
    purpose: 'Help us understand how visitors interact with the site (e.g., page views, time on page).',
    canDisable: 'Yes',
  },
  {
    type: 'Marketing',
    purpose: 'Used to deliver personalised ads and track campaign performance.',
    canDisable: 'Yes',
  },
  {
    type: 'Preferences',
    purpose: 'Remember your settings (e.g., language, currency).',
    canDisable: 'Yes',
  },
];

export default function CookiePolicyPage() {
  return (
    <div style={{ maxWidth: '760px', margin: '60px auto', padding: '0 24px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>
        Cookie <span style={{ color: 'var(--accent)' }}>Policy</span>
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>Last updated: April 2026</p>

      <Section title="What Are Cookies?">
        <p>Cookies are small text files placed on your device by websites you visit. They are widely used
        to make websites work efficiently and provide information to site owners.</p>
      </Section>

      <Section title="How We Use Cookies">
        <p>We use cookies to keep you signed in, remember your cart, analyse traffic, and improve
        your shopping experience.</p>
      </Section>

      <Section title="Types of Cookies We Use">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {['Type', 'Purpose', 'Can Disable?'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookieTypes.map(({ type, purpose, canDisable }) => (
              <tr key={type} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500 }}>{type}</td>
                <td style={{ padding: '10px 12px' }}>{purpose}</td>
                <td style={{ padding: '10px 12px' }}>{canDisable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Managing Cookies">
        <p>You can control and/or delete cookies as you wish via your browser settings. Disabling
        essential cookies may affect site functionality. For more, visit
        {' '}<a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>allaboutcookies.org</a>.</p>
      </Section>

      <Section title="Third-Party Cookies">
        <p>Some features (e.g., payment widgets, analytics) may set cookies from third parties.
        These are governed by their respective privacy policies.</p>
      </Section>
    </div>
  );
}
