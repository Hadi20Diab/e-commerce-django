import Image from 'next/image';
import Link from 'next/link';
import styles from './about.module.css';

export const metadata = {
    title: 'About Us | LUXE',
    description: 'Learn more about LUXE — a premium e-commerce experience built with passion.',
};

export default function AboutPage() {
    return (
        <div className={styles.page}>
            {/* ── Hero ────────────────────────────────────────────────── */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <span className={styles.heroBadge}>Our Story</span>
                    <h1 className={styles.heroTitle}>
                        Built for Those Who <span className={styles.heroAccent}>Demand More</span>
                    </h1>
                    <p className={styles.heroSub}>
                        LUXE is a premium e-commerce platform that brings carefully curated products
                        directly to discerning shoppers — delivering an elevated buying experience from
                        discovery to doorstep.
                    </p>
                </div>
            </section>

            {/* ── Developer notice banner ──────────────────────────────── */}
            <div className={styles.devBanner}>
                <div className={styles.devBannerInner}>
                    <span className={styles.devBannerIcon}>🛠️</span>
                    <p>
                        This is a <strong>demonstration project</strong> built as a full-stack portfolio piece.
                        It is not a real commercial store — all transactions are processed in sandbox/test mode.
                        Designed &amp; developed by{' '}
                        <a
                            href="https://hadi-diab.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.devLink}
                        >
                            Hadi Diab
                        </a>
                        .
                    </p>
                </div>
            </div>

            <div className={styles.inner}>
                {/* ── Logo ─────────────────────────────────────────────── */}
                <div className={styles.logoSection}>
                    <Image
                        src="/Luxe_logo.png"
                        alt="LUXE E-Commerce Platform"
                        width={320}
                        height={160}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </div>

                {/* ── Mission ──────────────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>Mission</div>
                    <h2 className={styles.sectionTitle}>Why LUXE Exists</h2>
                    <div className={styles.missionGrid}>
                        <p className={styles.missionText}>
                            We believe that great shopping should feel effortless. LUXE was conceived as a
                            response to cluttered, overwhelming online retail — a platform that strips away
                            the noise and focuses purely on quality: quality products, quality experience,
                            and quality service.
                        </p>
                        <p className={styles.missionText}>
                            Every detail — from the curated catalogue to the streamlined checkout — has been
                            designed with intentionality. We partner with trusted suppliers and verify every
                            item before it earns a place in our store.
                        </p>
                    </div>
                </section>

                {/* ── Values ───────────────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>Values</div>
                    <h2 className={styles.sectionTitle}>What We Stand For</h2>
                    <div className={styles.valuesGrid}>
                        {[
                            { icon: '✦', title: 'Curation', body: "We handpick every product. If it doesn't meet our standards, it doesn't reach our shelves." },
                            { icon: '🔒', title: 'Trust', body: 'Secure payments, transparent pricing, and no hidden fees — ever.' },
                            { icon: '⚡', title: 'Speed', body: 'From seamless checkout to fast delivery, we respect your time.' },
                            { icon: '♻️', title: 'Responsibility', body: 'We actively seek sustainable suppliers and reduce our packaging footprint.' },
                        ].map((v) => (
                            <div key={v.title} className={styles.valueCard}>
                                <div className={styles.valueIcon}>{v.icon}</div>
                                <h3 className={styles.valueTitle}>{v.title}</h3>
                                <p className={styles.valueBody}>{v.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Map ──────────────────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>Location</div>
                    <h2 className={styles.sectionTitle}>Find Us</h2>
                    <p className={styles.mapNote}>
                        Our headquarters is located in <strong>Sidon (Saida), Lebanon</strong> — a historic
                        coastal city on the Mediterranean. While LUXE ships internationally, our roots are here.
                    </p>
                    <div className={styles.mapWrapper}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d53195.00881120535!2d35.412764344945145!3d33.561480469877594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151ef03ff51e8597%3A0x181e41e3b9ff1086!2z2LXZitiv2Kc!5e0!3m2!1sar!2slb!4v1777451788362!5m2!1sar!2slb"
                            width="100%"
                            height="420"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="LUXE Headquarters — Sidon, Lebanon"
                        />
                    </div>
                </section>

                {/* ── Tech stack ───────────────────────────────────────── */}
                <section className={styles.section}>
                    <div className={styles.sectionLabel}>Technology</div>
                    <h2 className={styles.sectionTitle}>Under the Hood</h2>
                    <div className={styles.techGrid}>
                        {[
                            { name: 'Next.js', role: 'Frontend — App Router, SSR, CSS Modules' },
                            { name: 'Django', role: 'Backend — REST API, JWT auth, DRF' },
                            { name: 'Stripe', role: 'Payment processing — cards & webhooks' },
                            { name: 'PostgreSQL', role: 'Production database' },
                            { name: 'Vercel', role: 'Frontend hosting & edge delivery' },
                            { name: 'Railway', role: 'Backend hosting & managed DB' },
                        ].map((t) => (
                            <div key={t.name} className={styles.techCard}>
                                <div className={styles.techName}>{t.name}</div>
                                <div className={styles.techRole}>{t.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CTA ──────────────────────────────────────────────── */}
                <section className={styles.cta}>
                    <h2 className={styles.ctaTitle}>Ready to Explore?</h2>
                    <p className={styles.ctaSub}>Browse our curated collection and experience shopping the LUXE way.</p>
                    <div className={styles.ctaActions}>
                        <Link href="/products" className="btn btn-primary">Shop Now</Link>
                        <Link href="/contact" className="btn btn-secondary">Contact Us</Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
