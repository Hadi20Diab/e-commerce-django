'use client';

/**
 * WakeUpBanner
 * Shows a "server is waking up" overlay on Render free-tier cold starts.
 * Includes a mini coffee-tap game to pass the time.
 *
 * Game rules:
 *   • A ☕ appears in one of 9 cells — tap it before it moves!
 *   • Hit = +1 score, speed increases every point.
 *   • Miss = lose a life (❤️×5). All 5 gone → score resets.
 *   • Banner disappears automatically when the server responds.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import styles from './WakeUpBanner.module.css';

const API_BASE   = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');
const SHOW_DELAY = 3000;
const GRID       = 9;   // 3 × 3

export default function WakeUpBanner() {
  // ── server state ──────────────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);
  const [dots,    setDots]    = useState('');
  const [ready,   setReady]   = useState(false); // server came back

  // ── game display state ────────────────────────────────────────────────────
  const [playing, setPlaying] = useState(false);
  const [active,  setActive]  = useState(null);  // lit cell 0-8
  const [score,   setScore]   = useState(0);
  const [best,    setBest]    = useState(0);
  const [miss,    setMiss]    = useState(0);      // lives lost (0-4)
  const [hit,     setHit]     = useState(false);  // flash feedback on tap

  // ── refs (prevent stale closures inside setTimeout callbacks) ─────────────
  const activeRef  = useRef(null);
  const scoreRef   = useRef(0);
  const missRef    = useRef(0);
  const playingRef = useRef(false);
  const gameTimer  = useRef(null);
  const doneRef    = useRef(false);

  // ── game: schedule next cup ───────────────────────────────────────────────
  const scheduleNext = useCallback(() => {
    clearTimeout(gameTimer.current);
    const next = Math.floor(Math.random() * GRID);
    activeRef.current = next;
    setActive(next);

    const delay = Math.max(420, 1300 - scoreRef.current * 38);
    gameTimer.current = setTimeout(() => {
      if (!playingRef.current) return;
      // cup expired without a tap → miss
      const nm = missRef.current + 1;
      if (nm >= 5) {
        missRef.current   = 0;
        scoreRef.current  = 0;
        setScore(0);
        setMiss(0);
      } else {
        missRef.current = nm;
        setMiss(nm);
      }
      scheduleNext();
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(() => {
    scoreRef.current   = 0;
    missRef.current    = 0;
    playingRef.current = true;
    setScore(0);
    setMiss(0);
    setPlaying(true);
    scheduleNext();
  }, [scheduleNext]);

  const handleTap = useCallback((idx) => {
    if (!playingRef.current || idx !== activeRef.current) return;
    clearTimeout(gameTimer.current);
    const ns = scoreRef.current + 1;
    scoreRef.current  = ns;
    missRef.current   = 0;
    setScore(ns);
    setMiss(0);
    setBest((b) => Math.max(b, ns));
    setHit(true);
    setTimeout(() => setHit(false), 120);
    scheduleNext();
  }, [scheduleNext]);

  // ── server ping logic ─────────────────────────────────────────────────────
  useEffect(() => {
    let showTimer;
    let dotInterval;
    let pingInterval;

    const hide = () => {
      if (doneRef.current) return;
      doneRef.current    = true;
      playingRef.current = false;
      clearTimeout(showTimer);
      clearInterval(dotInterval);
      clearInterval(pingInterval);
      clearTimeout(gameTimer.current);
      setPlaying(false);
      setReady(true);
      setTimeout(() => setVisible(false), 1500); // brief "ready!" flash
    };

    const ping = () =>
      fetch(`${API_BASE}/health/`, { cache: 'no-store' })
        .then((r) => { if (r.ok) hide(); })
        .catch(() => {});

    showTimer = setTimeout(() => {
      if (doneRef.current) return;
      setVisible(true);
      dotInterval = setInterval(
        () => setDots((d) => (d.length >= 3 ? '' : d + '.')),
        500,
      );
      pingInterval = setInterval(ping, 4000);
    }, SHOW_DELAY);

    ping(); // immediate check

    return () => {
      doneRef.current    = true;
      playingRef.current = false;
      clearTimeout(showTimer);
      clearInterval(dotInterval);
      clearInterval(pingInterval);
      clearTimeout(gameTimer.current);
    };
  }, []);

  if (!visible) return null;

  const lives = Array.from({ length: 5 }, (_, i) => (i < miss ? '🖤' : '❤️')).join('');

  return (
    <div className={styles.overlay}>
      <div className={`${styles.card} ${playing ? styles.cardPlaying : ''}`}>

        {/* icon */}
        <div className={styles.icon}>☕</div>

        {/* title */}
        {ready ? (
          <h2 className={styles.titleReady}>Server is ready! 🎉</h2>
        ) : (
          <h2 className={styles.title}>Server is waking up{dots}</h2>
        )}

        {/* ── waiting view ── */}
        {!playing && (
          <>
            <p className={styles.desc}>
              We use a free hosting plan that sleeps after inactivity.
              <br />
              <strong>Give it 20–40 seconds</strong> — or play while you wait!
            </p>
            <button className={styles.playBtn} onClick={startGame}>
              🎮 Play while you wait
            </button>
          </>
        )}

        {/* ── game view ── */}
        {playing && (
          <>
            <div className={styles.scoreLine}>
              <span className={`${styles.scoreNum} ${hit ? styles.hit : ''}`}>
                ☕ {score}
              </span>
              {best > 0 && (
                <span className={styles.bestBadge}>Best&nbsp;{best}</span>
              )}
            </div>

            <p className={styles.lives}>{lives}</p>

            <div className={styles.grid}>
              {Array.from({ length: GRID }, (_, i) => (
                <button
                  key={i}
                  className={`${styles.cell} ${i === active ? styles.cellActive : ''}`}
                  onClick={() => handleTap(i)}
                  aria-label={`Cup ${i + 1}`}
                >
                  {i === active ? '☕' : ''}
                </button>
              ))}
            </div>

            <p className={styles.gameHint}>Tap the ☕ · 5 misses resets score</p>
          </>
        )}

        {/* always-visible progress bar */}
        <div className={styles.barWrap}>
          <div className={styles.bar} />
        </div>
        <p className={styles.hint}>Will load automatically — no action needed</p>
      </div>
    </div>
  );
}

