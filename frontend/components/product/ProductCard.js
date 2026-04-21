'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice, getImageUrl, extractErrors } from '../../lib/utils';
import styles from './ProductCard.module.css';

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const [adding, setAdding] = useState(false);

  const imageUrl = product.main_image ? getImageUrl(product.main_image.image) : null;

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
