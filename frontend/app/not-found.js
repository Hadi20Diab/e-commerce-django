import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 144px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '48px 24px',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(5rem, 15vw, 10rem)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1,
        marginBottom: '16px',
      }}>
        404
      </div>
      <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '32px', lineHeight: 1.6 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/" className="btn btn-primary">Go Home</Link>
        <Link href="/products" className="btn btn-secondary">Browse Products</Link>
      </div>
    </div>
  );
}
