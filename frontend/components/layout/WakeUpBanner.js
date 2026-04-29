'use client';

/**
 * WakeUpBanner
 * Shows a friendly "server is waking up" overlay when the free-tier backend
 * takes more than DELAY_MS to respond (Render free tier cold-starts ~30-60 s).
 * Disappears automatically once the first successful API response arrives.
 */

import { useEffect, useState } from 'react';
import styles from './WakeUpBanner.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const DELAY_MS = 3000; // show banner if no response within 3 s

export default function WakeUpBanner() {
  const [visible, setVisible] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    let timer;
    let dotTimer;
    let done = false;

    const hide = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearInterval(dotTimer);
      setVisible(false);
    };

    // Ping the health endpoint quietly
    const ping = async () => {
      try {
        await fetch(`${API_URL.replace('/api', '')}/health/`, { cache: 'no-store' });
        hide();
      } catch {
        // still waking up — banner stays visible until next ping succeeds
      }
    };

    // Show banner after DELAY_MS if backend hasn't responded yet
    timer = setTimeout(() => {
      if (done) return;
      setVisible(true);
      // Animate dots
      dotTimer = setInterval(() => {
        setDots((d) => (d.length >= 3 ? '' : d + '.'));
      }, 500);
      // Keep pinging every 4 s until alive
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL.replace('/api', '')}/health/`, { cache: 'no-store' });
          if (res.ok) {
            clearInterval(interval);
            hide();
          }
        } catch {
          // still sleeping
        }
      }, 4000);
    }, DELAY_MS);

    // Also do an immediate ping so we catch fast responses
    ping();

    return () => {
      done = true;
      clearTimeout(timer);
      clearInterval(dotTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.icon}>☕</div>
        <h2 className={styles.title}>Server is waking up{dots}</h2>
        <p className={styles.desc}>
          We use a free hosting plan that goes to sleep after a period of inactivity.
          <br />
          <strong>Give it 20–40 seconds</strong> — everything will load automatically.
        </p>
        <div className={styles.barWrap}>
          <div className={styles.bar} />
        </div>
        <p className={styles.hint}>No action needed — sit back and relax ☕</p>
      </div>
    </div>
  );
}
