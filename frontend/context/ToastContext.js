'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', top: '88px', right: '24px',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      {toasts.map((t) => (
        <div key={t.id} onClick={() => removeToast(t.id)} style={{
          minWidth: '280px', maxWidth: '380px',
          padding: '14px 18px',
          borderRadius: '10px',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          fontWeight: 500,
          cursor: 'pointer',
          animation: 'slideIn 0.25s ease',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: t.type === 'success' ? 'rgba(0,200,83,0.12)'
            : t.type === 'error' ? 'rgba(255,23,68,0.12)'
            : t.type === 'warning' ? 'rgba(255,145,0,0.12)'
            : 'rgba(41,121,255,0.12)',
          border: `1px solid ${
            t.type === 'success' ? 'rgba(0,200,83,0.3)'
            : t.type === 'error' ? 'rgba(255,23,68,0.3)'
            : t.type === 'warning' ? 'rgba(255,145,0,0.3)'
            : 'rgba(41,121,255,0.3)'}`,
          color: t.type === 'success' ? '#00c853'
            : t.type === 'error' ? '#ff1744'
            : t.type === 'warning' ? '#ff9100'
            : '#2979ff',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'warning' ? '⚠' : 'ℹ'}</span>
          <span style={{ color: 'var(--text-primary)', flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
