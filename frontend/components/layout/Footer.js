import Link from 'next/link';
import { TwitterXIcon, InstagramIcon, FacebookIcon, PinterestIcon } from '../icons';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>L</span>
            <span className={styles.logoText}>LUXE</span>
          </Link>
          <p>Premium products, curated for those who demand the finest. Experience shopping redefined.</p>
          <div className={styles.social}>
            <Link href="https://x.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Twitter"><TwitterXIcon size={16} /></Link>
            <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Instagram"><InstagramIcon size={16} /></Link>
            <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Facebook"><FacebookIcon size={16} /></Link>
            <Link href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink} title="Pinterest"><PinterestIcon size={16} /></Link>
          </div>
        </div>

        {/* Shop */}
        <div className={styles.col}>
          <h4>Shop</h4>
          <ul>
            <li><Link href="/products">All Products</Link></li>
            <li><Link href="/products?is_featured=true">Featured</Link></li>
            <li><Link href="/products?ordering=price">Lowest Price</Link></li>
            <li><Link href="/products?ordering=-created_at">New Arrivals</Link></li>
          </ul>
        </div>

        {/* Account */}
        <div className={styles.col}>
          <h4>Account</h4>
          <ul>
            <li><Link href="/account">My Profile</Link></li>
            <li><Link href="/account/orders">Orders</Link></li>
            <li><Link href="/account/addresses">Addresses</Link></li>
            <li><Link href="/auth/login">Sign In</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div className={styles.col}>
          <h4>Support</h4>
          <ul>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/shipping-policy">Shipping Policy</Link></li>
            <li><Link href="/returns">Returns</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <span className={styles.copyright}>
          © {new Date().getFullYear()} <span className={styles.accent}>LUXE Store</span>. All rights reserved.
        </span>
        <div className={styles.bottomLinks}>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/cookie-policy">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}
