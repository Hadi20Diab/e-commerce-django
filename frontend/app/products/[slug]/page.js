'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { productsApi, reviewsApi } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../context/ToastContext';
import { useWishlist } from '../../../context/WishlistContext';
import { formatPrice, getImageUrl, extractErrors } from '../../../lib/utils';
import styles from './detail.module.css';

function StarRow({ rating, size = 16, color = '#f59e0b' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= rating ? color : 'none'} stroke={color} strokeWidth={1.5}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ display: 'inline-flex', gap: 4, cursor: 'pointer' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={24} height={24} viewBox="0 0 24 24"
          fill={n <= (hover || value) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth={1.5}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          style={{ transition: 'fill 0.1s' }}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { wishlistIds, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', body: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!slug) return;
    productsApi.detail(slug)
      .then((r) => { setProduct(r.data); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    reviewsApi.list(slug)
      .then((r) => {
        const items = r.data.results ?? r.data;
        setReviews(items);
      })
      .catch(() => {});
  }, [slug]);

  // Derived flags from product API (server checks purchase history)
  const isWishlisted = wishlistIds.has(product?.id);
  const userHasPurchased = product?.user_has_purchased ?? false;
  const userHasReviewed = product?.user_has_reviewed ?? false;

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

  const handleWishlist = async () => {
    if (!user) { addToast('Please sign in to save items.', 'warning'); return; }
    setWishlistLoading(true);
    try {
      const added = await toggleWishlist(product.id);
      addToast(added ? 'Added to wishlist!' : 'Removed from wishlist.', 'success');
    } catch {
      addToast('Could not update wishlist.', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) { setReviewError('Please select a star rating.'); return; }
    if (!reviewForm.body.trim()) { setReviewError('Review body is required.'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await reviewsApi.create(slug, reviewForm);
      setReviews((prev) => [res.data, ...prev]);
      setProduct((p) => p ? { ...p, user_has_reviewed: true } : p);
      setReviewForm({ rating: 0, title: '', body: '' });
      addToast('Review submitted!', 'success');
    } catch (err) {
      setReviewError(extractErrors(err));
    } finally {
      setReviewSubmitting(false);
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

                <button
                  className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ''}`}
                  onClick={handleWishlist}
                  disabled={wishlistLoading}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24"
                    fill={isWishlisted ? '#ef4444' : 'none'}
                    stroke={isWishlisted ? '#ef4444' : 'currentColor'}
                    strokeWidth={1.8}
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
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

        {/* ── Reviews Section ─────────────────────────────── */}
        <div className={styles.reviewsSection}>
          <h2 className={styles.reviewsTitle}>
            Customer Reviews
            {product.review_count > 0 && (
              <span className={styles.reviewsCount}> ({product.review_count})</span>
            )}
            {product.avg_rating > 0 && (
              <span style={{ marginLeft: 12, verticalAlign: 'middle' }}>
                <StarRow rating={Math.round(product.avg_rating)} />
                <span style={{ marginLeft: 6, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {Number(product.avg_rating).toFixed(1)}
                </span>
              </span>
            )}
          </h2>

          {/* Write a review */}
          {user && userHasPurchased && !userHasReviewed && (
            <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
              <h3 className={styles.reviewFormTitle}>Write a Review</h3>
              <div className={styles.reviewFormRating}>
                <label className={styles.reviewFormLabel}>Your Rating *</label>
                <StarPicker value={reviewForm.rating} onChange={(n) => setReviewForm((f) => ({ ...f, rating: n }))} />
              </div>
              <input
                className={`formInput ${styles.reviewInput}`}
                placeholder="Review title (optional)"
                value={reviewForm.title}
                onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className={`formInput ${styles.reviewInput}`}
                placeholder="Share your experience with this product…"
                value={reviewForm.body}
                onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
                style={{ resize: 'vertical' }}
                required
              />
              {reviewError && <p className="formError">{reviewError}</p>}
              <button type="submit" className={`btn btn-primary ${styles.reviewSubmitBtn}`} disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
          {user && userHasPurchased && userHasReviewed && (
            <div className={styles.reviewedBadge}>
              ✓ You've reviewed this product
            </div>
          )}
          {user && !userHasPurchased && (
            <div className={styles.reviewGateNote}>
              Purchase this product to leave a review.
            </div>
          )}
          {!user && (
            <p className={styles.reviewLoginNote}>
              <Link href="/auth/login">Sign in</Link> to leave a review.
            </p>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>No reviews yet. Be the first!</p>
          ) : (
            <div className={styles.reviewsList}>
              {reviews.map((rv) => (
                <div key={rv.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <StarRow rating={rv.rating} size={14} />
                    {rv.title && <strong className={styles.reviewTitle}>{rv.title}</strong>}
                    <span className={styles.reviewMeta}>
                      by {rv.user_name} · {new Date(rv.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.reviewBody}>{rv.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
