'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { productsApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { formatPrice, getImageUrl, extractErrors } from '../../../lib/utils';
import styles from './detail.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    productsApi.detail(slug)
      .then((r) => { setProduct(r.data); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { addToast('Please sign in to add to cart.', 'warning'); return; }
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      addToast(`"${product.name}" added to cart!`, 'success');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: '48px var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', aspectRatio: '1', animation: 'shimmer 1.4s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-card-hover) 50%, var(--bg-surface) 75%)', backgroundSize: '200% 100%' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
            {[60, 100, 40, 80, 70].map((w, i) => (
              <div key={i} style={{ height: i === 0 ? '12px' : i === 1 ? '32px' : '14px', width: `${w}%`, borderRadius: '6px', background: 'var(--bg-surface)', animation: 'shimmer 1.4s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-card-hover) 50%, var(--bg-surface) 75%)', backgroundSize: '200% 100%' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h2 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Product not found</h2>
        <Link href="/products" className="btn btn-secondary" style={{ marginTop: '16px', display: 'inline-flex' }}>
          ← Back to Products
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const currentImage = images[selectedImage];
  const imageUrl = currentImage ? getImageUrl(currentImage.image) : null;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>›</span>
          <Link href="/products">Products</Link>
          {product.category && (
            <>
              <span>›</span>
              <Link href={`/products?category=${product.category.slug}`}>{product.category.name}</Link>
            </>
          )}
          <span>›</span>
          <span className={styles.breadcrumbCurrent}>{product.name}</span>
        </div>

        <div className={styles.layout}>
          {/* Image Gallery */}
          <div className={styles.gallery}>
            <div className={styles.mainImage}>
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={currentImage.alt_text || product.name}
                  fill
                  className={styles.mainImg}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className={styles.imagePlaceholder}>🛍</div>
              )}
              {!product.is_in_stock && (
                <div className={styles.outOfStockOverlay}>Out of Stock</div>
              )}
              {product.discount_percentage > 0 && (
                <div className={styles.discountBadge}>−{product.discount_percentage}%</div>
              )}
            </div>

            {images.length > 1 && (
              <div className={styles.thumbnails}>
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    className={`${styles.thumb} ${selectedImage === idx ? styles.thumbActive : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <Image
                      src={getImageUrl(img.image)}
                      alt={img.alt_text || `Image ${idx + 1}`}
                      fill
                      sizes="80px"
                      style={{ objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.info}>
            {product.category && (
              <Link href={`/products?category=${product.category.slug}`} className={styles.categoryTag}>
                {product.category.name}
              </Link>
            )}

            <h1 className={styles.productName}>{product.name}</h1>

            {/* Price */}
            <div className={styles.priceBlock}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.compare_price && product.compare_price > product.price && (
                <>
                  <span className={styles.comparePrice}>{formatPrice(product.compare_price)}</span>
                  <span className={styles.saveBadge}>Save {product.discount_percentage}%</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={styles.stockRow}>
              {product.is_in_stock ? (
                <span className={styles.inStock}>
                  <span className={styles.stockDot} />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className={styles.outOfStock}>✕ Out of Stock</span>
              )}
            </div>

            {/* Description */}
            <div className={styles.descriptionBlock}>
              <h3 className={styles.descTitle}>Description</h3>
              <p className={styles.description}>{product.description}</p>
            </div>

            {/* Quantity + Add to Cart */}
            {product.is_in_stock && (
              <div className={styles.actions}>
                <div className={styles.quantitySelector}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.qtyValue}>{quantity}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>

                <button
                  className={`btn btn-primary ${styles.addBtn}`}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  {adding ? 'Adding to Cart…' : '🛒 Add to Cart'}
                </button>
              </div>
            )}

            {/* Perks */}
            <div className={styles.perks}>
              {[
                { icon: '🚀', text: 'Free shipping on orders over $50' },
                { icon: '🔒', text: 'Secure & encrypted payments' },
                { icon: '↩', text: '30-day hassle-free returns' },
              ].map((p) => (
                <div key={p.text} className={styles.perk}>
                  <span className={styles.perkIcon}>{p.icon}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
