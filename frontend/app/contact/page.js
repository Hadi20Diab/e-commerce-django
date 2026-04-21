'use client';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { contactApi } from '../../lib/api';
import { extractErrors } from '../../lib/utils';
import styles from './contact.module.css';

const BLANK = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const { addToast } = useToast();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    if (!form.subject.trim()) errs.subject = 'Subject is required.';
    if (!form.message.trim()) errs.message = 'Message is required.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSending(true);
    try {
      await contactApi.submit(form);
      setSent(true);
      addToast('Message sent! We\'ll be in touch soon.', 'success');
    } catch (err) {
      addToast(extractErrors(err), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>Get In Touch</span>
          <h1 className={styles.heroTitle}>We'd Love to <span className={styles.heroAccent}>Hear From You</span></h1>
          <p className={styles.heroSub}>Have a question, feedback, or just want to say hello? Our team typically responds within 24 hours.</p>
        </div>
      </section>

      <div className={styles.inner}>
        {/* Info cards */}
        <div className={styles.infoGrid}>
          {[
            { icon: '📧', label: 'Email', value: 'support@luxe.com', sub: 'Drop us a line anytime' },
            { icon: '📞', label: 'Phone', value: '+1 (800) LUXE-SHOP', sub: 'Mon–Fri, 9am–6pm EST' },
            { icon: '📍', label: 'Address', value: '350 Fifth Avenue, NY', sub: 'New York, NY 10118' },
          ].map((item) => (
            <div key={item.label} className={styles.infoCard}>
              <div className={styles.infoIcon}>{item.icon}</div>
              <div>
                <div className={styles.infoLabel}>{item.label}</div>
                <div className={styles.infoValue}>{item.value}</div>
                <div className={styles.infoSub}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className={styles.formWrapper}>
          {sent ? (
            <div className={styles.successState}>
              <div className={styles.successIcon}>✓</div>
              <h2>Message Sent!</h2>
              <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
              <button className="btn btn-primary" onClick={() => { setSent(false); setForm(BLANK); }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <>
              <h2 className={styles.formTitle}>Send a Message</h2>
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <div className={styles.twoCol}>
                  <div className="formGroup">
                    <label className="formLabel">Full Name</label>
                    <input name="name" className={`formInput ${errors.name ? styles.inputError : ''}`} value={form.name} onChange={handleChange} placeholder="John Doe" />
                    {errors.name && <span className="formError">{errors.name}</span>}
                  </div>
                  <div className="formGroup">
                    <label className="formLabel">Email Address</label>
                    <input type="email" name="email" className={`formInput ${errors.email ? styles.inputError : ''}`} value={form.email} onChange={handleChange} placeholder="you@example.com" />
                    {errors.email && <span className="formError">{errors.email}</span>}
                  </div>
                </div>
                <div className="formGroup">
                  <label className="formLabel">Subject</label>
                  <input name="subject" className={`formInput ${errors.subject ? styles.inputError : ''}`} value={form.subject} onChange={handleChange} placeholder="How can we help?" />
                  {errors.subject && <span className="formError">{errors.subject}</span>}
                </div>
                <div className="formGroup">
                  <label className="formLabel">Message</label>
                  <textarea name="message" className={`formInput ${errors.message ? styles.inputError : ''}`} value={form.message} onChange={handleChange} rows={6} placeholder="Tell us everything…" style={{ resize: 'vertical' }} />
                  {errors.message && <span className="formError">{errors.message}</span>}
                </div>
                <button type="submit" className={`btn btn-primary ${styles.sendBtn}`} disabled={sending}>
                  {sending ? 'Sending…' : 'Send Message →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
