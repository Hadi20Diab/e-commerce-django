/**
 * Centralised SVG icon library.
 * Usage: import { CartIcon, UserIcon } from '../icons';
 * All icons accept: size (number, default 20), color (string, default 'currentColor'), className, style
 */
const icon = (path, viewBox = '0 0 24 24') =>
  function Icon({ size = 20, color = 'currentColor', className = '', style = {}, strokeWidth = 1.75 }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
      >
        {path}
      </svg>
    );
  };

// ── Navigation ─────────────────────────────────────────────────────────────
export const HomeIcon = icon(
  <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" /></>
);

export const CartIcon = icon(
  <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>
);

export const SearchIcon = icon(
  <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>
);

export const MenuIcon = icon(
  <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
);

export const XIcon = icon(
  <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
);

export const ChevronDownIcon = icon(
  <polyline points="6 9 12 15 18 9" />
);

export const ChevronRightIcon = icon(
  <polyline points="9 18 15 12 9 6" />
);

export const ChevronLeftIcon = icon(
  <polyline points="15 18 9 12 15 6" />
);

// ── User / Auth ─────────────────────────────────────────────────────────────
export const UserIcon = icon(
  <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>
);

export const LockIcon = icon(
  <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>
);

export const UnlockIcon = icon(
  <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" /></>
);

export const ShieldIcon = icon(
  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>
);

export const LogOutIcon = icon(
  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>
);

// ── Commerce ────────────────────────────────────────────────────────────────
export const PackageIcon = icon(
  <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>
);

export const TruckIcon = icon(
  <><rect x="1" y="3" width="15" height="13" rx="1" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>
);

export const CreditCardIcon = icon(
  <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
);

export const TagIcon = icon(
  <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>
);

export const StarIcon = icon(
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
);

export const HeartIcon = icon(
  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
);

export const ShoppingBagIcon = icon(
  <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>
);

export const RefreshIcon = icon(
  <><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></>
);

// ── Location / Address ──────────────────────────────────────────────────────
export const MapPinIcon = icon(
  <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>
);

// ── Communication ───────────────────────────────────────────────────────────
export const MailIcon = icon(
  <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>
);

export const PhoneIcon = icon(
  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
);

export const MessageIcon = icon(
  <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>
);

// ── Actions ─────────────────────────────────────────────────────────────────
export const PlusIcon = icon(
  <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>
);

export const MinusIcon = icon(
  <line x1="5" y1="12" x2="19" y2="12" />
);

export const TrashIcon = icon(
  <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></>
);

export const EditIcon = icon(
  <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>
);

export const CheckIcon = icon(
  <polyline points="20 6 9 17 4 12" />
);

export const CheckCircleIcon = icon(
  <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>
);

export const AlertCircleIcon = icon(
  <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>
);

export const ArrowRightIcon = icon(
  <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
);

export const ArrowLeftIcon = icon(
  <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>
);

export const ExternalLinkIcon = icon(
  <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>
);

// ── Payment brands (filled) ──────────────────────────────────────────────────
export const PayPalIcon = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="PayPal">
    <path d="M7.02 21.34l.41-2.62H5.4L7.36 5.8h5.03c1.63 0 2.78.36 3.39 1.06.58.67.75 1.65.5 2.94-.28 1.48-.88 2.65-1.8 3.48-.9.82-2.08 1.23-3.5 1.23H9.4l-.67 6.83H7.02z" fill="#009cde"/>
    <path d="M17.4 7.5c-.06.37-.13.72-.22 1.08-.82 4.2-3.63 5.65-7.22 5.65H8.27a.89.89 0 00-.88.75L6.5 21H9.1l.52-3.3h1.67c3.17 0 5.65-1.28 6.37-5 .3-1.53.12-2.8-.26-3.2z" fill="#012169"/>
  </svg>
);

export const StripeIcon = ({ size = 24, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Stripe">
    <rect width="24" height="24" rx="4" fill="#635BFF"/>
    <path d="M11.13 9.6c0-.72.59-1 1.56-1 1.4 0 3.16.42 4.56 1.17V6.28C15.87 5.48 14.2 5 12.69 5 9.75 5 7.8 6.5 7.8 9.77c0 5.1 7.02 4.28 7.02 6.47 0 .85-.74 1.12-1.77 1.12-1.53 0-3.48-.63-5.02-1.47V19c1.71.74 3.44 1.05 5.02 1.05 3.02 0 5.1-1.5 5.1-4.82C18.15 10.1 11.13 11.05 11.13 9.6z" fill="white"/>
  </svg>
);

// ── Brand / Social ────────────────────────────────────────────────────────────
export const TwitterXIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="X (Twitter)">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export const InstagramIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Instagram">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

export const FacebookIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Facebook">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

export const PinterestIcon = ({ size = 20, color = 'currentColor', className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" className={className} style={style} aria-label="Pinterest">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

export const FlaskIcon = icon(
  <><path d="M9 3h6v2l3 7H6L9 5V3z" /><path d="M6 12v7a2 2 0 002 2h8a2 2 0 002-2v-7" /><line x1="9" y1="3" x2="15" y2="3" /></>
);
