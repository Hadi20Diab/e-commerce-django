'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatPrice, getImageUrl, extractErrors } from '../../lib/utils';
import styles from './ProductCard.module.css';

function HeartIcon({ filled, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : 'currentColor'} strokeWidth={1.8}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { wishlistIds, toggleWishlist } = useWishlist();
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const imageUrl = product.main_image ? getImageUrl(product.main_image.image) : null;
  const isWishlisted = wishlistIds.has(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Please sign in to add items to your cart.', 'warning');
      return;
    }
    setAdding(true);
    try {
      await addToCart(product.id, 1);
      addToast(`"${product.name}" added to cart!`, 'success');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      addToast('Please sign in to save items.', 'warning');
      return;
    }
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

  return (
    <Link href={`/products/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.main_image?.alt_text || product.name}
            fill
            className={styles.image}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        ) : (
          <div className={styles.placeholder}>🛍</div>
        )}

        {/* Wishlist heart */}
        <button
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistActive : ''}`}
          onClick={handleWishlist}
          disabled={wishlistLoading}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <HeartIcon filled={isWishlisted} size={18} />
        </button>

        {/* Badges */}
        <div className={styles.badges}>
          {product.is_featured && <span className={styles.badgeFeatured}>Featured</span>}
          {product.discount_percentage > 0 && (
            <span className={styles.badgeDiscount}>−{product.discount_percentage}%</span>
          )}
        </div>

        {/* Out of Stock overlay */}
        {!product.is_in_stock && <div className={styles.outOfStock}>Out of Stock</div>}

        {/* Quick Add */}
        {product.is_in_stock && (
          <div className={styles.quickAdd}>
            <button
              className={styles.quickAddBtn}
              onClick={handleAddToCart}
              disabled={adding}
            >
              {adding ? 'Adding…' : '+ Add to Cart'}
            </button>
          </div>
        )}
      </div>

      <div className={styles.body}>
        {product.category_name && (
          <span className={styles.category}>{product.category_name}</span>
        )}
        <h3 className={styles.name}>{product.name}</h3>
        {(product.avg_rating > 0 || product.review_count > 0) && (
          <div className={styles.ratingRow}>
            <span className={styles.stars}>{'★'.repeat(Math.round(product.avg_rating ?? 0))}{'☆'.repeat(5 - Math.round(product.avg_rating ?? 0))}</span>
            <span className={styles.reviewCount}>({product.review_count ?? 0})</span>
          </div>
        )}
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className={styles.comparePrice}>{formatPrice(product.compare_price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
