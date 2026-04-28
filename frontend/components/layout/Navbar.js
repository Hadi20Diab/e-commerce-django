'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  CartIcon, UserIcon, ChevronDownIcon, PackageIcon,
  MapPinIcon, LogOutIcon, MenuIcon, XIcon, HeartIcon,
} from '../icons';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || '?'
    : '';

  return (
    <>
      <nav className={`${styles.navbar}${scrolled ? ' ' + styles.scrolled : ''}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>L</span>
            <span className={styles.logoText}>LUXE</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className={styles.navLinks}>
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`${styles.navLink} ${pathname === l.href ? styles.navLinkActive : ''}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            {/* Cart */}
            <Link href="/cart" className={styles.iconBtn} title="Cart">
              <CartIcon size={20} />
              {itemCount > 0 && (
                <span className={styles.cartBadge}>{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </Link>

            {user ? (
              <>
                {/* User Dropdown */}
                <div className={styles.userMenuWrapper} ref={dropdownRef}>
                  <button
                    className={styles.userBtn}
                    onClick={() => setDropdownOpen((v) => !v)}
                  >
                    <span className={styles.userAvatar}>{initials}</span>
                    <span className={styles.dropdownName}>{user.first_name}</span>
                    <ChevronDownIcon
                      size={14}
                      className={`${styles.chevron}${dropdownOpen ? ' ' + styles.chevronOpen : ''}`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownName}>{user.first_name} {user.last_name}</div>
                        <div className={styles.dropdownEmail}>{user.email}</div>
                      </div>
                      <Link href="/account" className={styles.dropdownItem}>
                        <UserIcon size={15} /> My Account
                      </Link>
                      <Link href="/account/orders" className={styles.dropdownItem}>
                        <PackageIcon size={15} /> Orders
                      </Link>
                      <Link href="/account/addresses" className={styles.dropdownItem}>
                        <MapPinIcon size={15} /> Addresses
                      </Link>
                      <Link href="/account/wishlist" className={styles.dropdownItem}>
                        <HeartIcon size={15} /> Wishlist
                      </Link>
                      <div className={styles.dropdownDivider} />
                      <button
                        className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                        onClick={handleLogout}
                      >
                        <LogOutIcon size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.authBtns}>
                <Link href="/auth/login" className={styles.loginBtn}>Sign In</Link>
                <Link href="/auth/register" className={styles.registerBtn}>Sign Up</Link>
              </div>
            )}

            {/* Mobile Toggle */}
            <button
              className={styles.mobileToggle}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`${styles.mobileNavLink} ${pathname === l.href ? styles.mobileNavLinkActive : ''}`}
            >
              {l.label}
            </Link>
          ))}
          <div className={styles.mobileDivider} />
          <Link href="/cart" className={styles.mobileNavLink}>
            <CartIcon size={16} /> Cart {itemCount > 0 && `(${itemCount})`}
          </Link>
          {user ? (
            <>
              <Link href="/account" className={styles.mobileNavLink}><UserIcon size={16} /> My Account</Link>
              <Link href="/account/orders" className={styles.mobileNavLink}><PackageIcon size={16} /> Orders</Link>
              <Link href="/account/wishlist" className={styles.mobileNavLink}><HeartIcon size={16} /> Wishlist</Link>
              <button
                style={{ textAlign: 'left', color: 'var(--error)' }}
                className={styles.mobileNavLink}
                onClick={handleLogout}
              >
                ⏻ Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.mobileNavLink}>Sign In</Link>
              <Link href="/auth/register" className={styles.mobileNavLink}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </>
  );
}
