'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi } from '../lib/api';
import ProductCard from '../components/product/ProductCard';
import styles from './page.module.css';

const CATEGORY_ICONS = {
  electronics: '💻', clothing: '👕', furniture: '🪑',
  books: '📚', shoes: '👟', bags: '👜',
  beauty: '✨', sports: '⚽', food: '🍎',
  toys: '🧸', jewelry: '💍', default: '🛍',
};

function getCategoryIcon(name) {
  const key = name?.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_ICONS)) {
    if (key?.includes(k)) return v;
  }
  return CATEGORY_ICONS.default;
}

function SkeletonGrid({ count = 4 }) {
  return (
    <div className={styles.loadingGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.skeleton}>
          <div className={styles.skeletonImg} />
          <div className={styles.skeletonBody}>
            <div className={styles.skeletonLine} style={{ width: '50%', height: '10px' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
            <div className={styles.skeletonLine} style={{ width: '70%' }} />
            <div className={styles.skeletonLine} style={{ width: '40%', height: '18px', marginTop: '4px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    productsApi.featured()
      .then((r) => setFeatured(r.data.results ?? r.data))
      .catch(() => {})
      .finally(() => setLoadingFeatured(false));

    productsApi.categories()
      .then((r) => setCategories(r.data.results ?? r.data))
      .catch(() => {})
      .finally(() => setLoadingCats(false));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden />
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroTag}>
              <span className={styles.heroDot} />
              New Season Collection
            </div>
            <h1 className={styles.heroTitle}>
              Discover Premium
              <span>Products & Style</span>
            </h1>
            <p className={styles.heroDesc}>
              Curated collections of extraordinary products. Every item selected for
              its quality, design, and lasting value.
            </p>
            <div className={styles.heroBtns}>
              <Link href="/products" className="btn btn-primary">
                Shop Now →
              </Link>
              <Link href="/products?is_featured=true" className="btn btn-secondary">
                View Featured
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>5k<span>+</span></div>
                <div className={styles.heroStatLabel}>Products</div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>12k<span>+</span></div>
                <div className={styles.heroStatLabel}>Customers</div>
              </div>
              <div className={styles.heroStat}>
                <div className={styles.heroStatNum}>98<span>%</span></div>
                <div className={styles.heroStatLabel}>Satisfaction</div>
              </div>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.floatingCards}>
              <div className={styles.floatCard}>
                <div className={styles.floatCardHeader}>
                  <div className={styles.floatCardIcon}>🔥</div>
                  <div>
                    <div className={styles.floatCardTitle}>Trending Now</div>
                    <div className={styles.floatCardSub}>12 new arrivals today</div>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} />
                </div>
              </div>
              <div className={styles.floatCard} style={{ marginTop: '16px', marginLeft: '32px' }}>
                <div className={styles.floatCardHeader}>
                  <div className={styles.floatCardIcon}>⚡</div>
                  <div>
                    <div className={styles.floatCardTitle}>Flash Deals</div>
                    <div className={styles.floatCardSub}>Up to 40% off today</div>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: '48%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Strip ── */}
      <div className={styles.features}>
        <div className={styles.featuresInner}>
          {[
            { icon: '🚀', title: 'Free Shipping', desc: 'On orders over $50' },
            { icon: '🔒', title: 'Secure Payment', desc: '100% protected transactions' },
            { icon: '↩', title: 'Easy Returns', desc: '30-day hassle-free returns' },
            { icon: '💬', title: '24/7 Support', desc: 'Always here to help' },
          ].map((f) => (
            <div key={f.title} className={styles.featureItem}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureText}>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      {(loadingCats || categories.length > 0) && (
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionMeta}>
                <div className={styles.sectionLabel}>Browse By</div>
                <h2 className={styles.sectionTitle}>Shop <span>Categories</span></h2>
              </div>
            </div>

            {loadingCats ? (
              <div className={styles.categoryGrid}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={styles.skeleton} style={{ padding: '24px' }}>
                    <div className={styles.skeletonLine} style={{ width: '100%', height: '56px', borderRadius: '12px' }} />
                    <div className={styles.skeletonLine} style={{ width: '60%', margin: '12px auto 0' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.categoryGrid}>
                {categories.slice(0, 8).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className={styles.categoryCard}
                  >
                    <div className={styles.categoryIcon}>{getCategoryIcon(cat.name)}</div>
                    <div className={styles.categoryName}>{cat.name}</div>
                    <div className={styles.categoryCount}>{cat.product_count} products</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      <section className={styles.section} style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionMeta}>
              <div className={styles.sectionLabel}>Hand-Picked</div>
              <h2 className={styles.sectionTitle}>Featured <span>Products</span></h2>
            </div>
            <Link href="/products?is_featured=true" className={styles.viewAll}>
              View All →
            </Link>
          </div>

          {loadingFeatured ? (
            <SkeletonGrid count={4} />
          ) : featured.length > 0 ? (
            <div className={styles.productGrid}>
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>
              No featured products yet.
            </p>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.ctaBanner}>
            <h2 className={styles.ctaBannerTitle}>
              Ready to find your next <span>favourite?</span>
            </h2>
            <p className={styles.ctaBannerDesc}>
              Browse our full catalogue of curated products and discover something extraordinary today.
            </p>
            <Link href="/products" className="btn btn-primary" style={{ fontSize: '1rem', padding: '14px 32px' }}>
              Explore All Products →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
