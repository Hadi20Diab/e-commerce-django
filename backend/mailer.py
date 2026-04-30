"""
Unified email helper. Switch providers with the EMAIL_PROVIDER env var:

  EMAIL_PROVIDER=smtp    — Django SMTP (default; works locally and on paid/unblocked hosts)
  EMAIL_PROVIDER=brevo   — Brevo HTTP API (free 300/day; works on Render free tier) ✅ RECOMMENDED
  EMAIL_PROVIDER=resend  — Resend HTTP API (requires own verified domain)

For Brevo (recommended for Render free tier):
  1. Sign up free at https://app.brevo.com  (no credit card)
  2. Go to Settings → Senders & IPs → Add a sender email (e.g. hadidiab33@gmail.com)
     and click the verification link they send you
  3. Go to SMTP & API → API Keys → Generate a new API key
  4. Set BREVO_API_KEY and BREVO_FROM_EMAIL in your Render environment variables

For Resend:
  RESEND_API_KEY=re_xxxxxxxxxxxx  (requires verified custom domain at resend.com/domains)
"""

import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(*, to, subject, html, text='', from_email=None):
    """
    Send an email via the configured provider (EMAIL_PROVIDER setting).

    Args:
        to:         recipient address (str) or list of addresses
        subject:    email subject line
        html:       HTML body
        text:       plain-text fallback (optional but recommended)
        from_email: override sender address

    Returns True on success, False on failure.
    """
    provider = getattr(settings, 'EMAIL_PROVIDER', 'smtp').lower()
    if provider == 'brevo':
        return _send_brevo(to=to, subject=subject, html=html, text=text, from_email=from_email)
    if provider == 'resend':
        return _send_resend(to=to, subject=subject, html=html, text=text, from_email=from_email)
    return _send_smtp(to=to, subject=subject, html=html, text=text, from_email=from_email)


# ── SMTP (Django built-in) ──────────────────────────────────────────────────────

def _send_smtp(*, to, subject, html, text, from_email):
    from django.core.mail import EmailMultiAlternatives
    sender = from_email or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@luxe.com')
    recipients = [to] if isinstance(to, str) else list(to)
    try:
        msg = EmailMultiAlternatives(subject, text, sender, recipients)
        msg.attach_alternative(html, 'text/html')
        msg.send(fail_silently=False)
        logger.info('mailer(smtp): sent "%s" to %s', subject, recipients)
        return True
    except Exception:
        logger.exception('mailer(smtp): failed to send "%s" to %s', subject, recipients)
        return False


# ── Brevo HTTP API (https://brevo.com — free 300 emails/day) ───────────────────

_BREVO_URL = 'https://api.brevo.com/v3/smtp/email'


def _send_brevo(*, to, subject, html, text, from_email):
    import requests
    api_key = getattr(settings, 'BREVO_API_KEY', '')
    if not api_key:
        logger.error(
            'mailer(brevo): BREVO_API_KEY not set — email to %s NOT sent. '
            'Add BREVO_API_KEY to your environment variables.',
            to,
        )
        return False

    raw_sender = from_email or getattr(settings, 'BREVO_FROM_EMAIL', None) \
        or getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@luxe.com')

    # Brevo expects {"name": "...", "email": "..."} for sender
    sender_obj = _parse_address(raw_sender)
    recipients = [to] if isinstance(to, str) else list(to)
    to_list = [{'email': addr} for addr in recipients]

    payload = {
        'sender': sender_obj,
        'to': to_list,
        'subject': subject,
        'htmlContent': html,
    }
    if text:
        payload['textContent'] = text

    try:
        resp = requests.post(
            _BREVO_URL,
            json=payload,
            headers={'api-key': api_key, 'Content-Type': 'application/json'},
            timeout=15,
        )
        if resp.status_code in (200, 201):
            logger.info('mailer(brevo): sent "%s" to %s', subject, recipients)
            return True
        logger.error(
            'mailer(brevo): API returned %d for "%s" to %s — %s',
            resp.status_code, subject, recipients, resp.text[:300],
        )
        return False
    except Exception:
        logger.exception('mailer(brevo): request failed for "%s" to %s', subject, recipients)
        return False


def _parse_address(address):
    """Parse 'Display Name <email@example.com>' into {'name': ..., 'email': ...}."""
    import re
    m = re.match(r'^(.+?)\s*<([^>]+)>$', address.strip())
    if m:
        return {'name': m.group(1).strip(), 'email': m.group(2).strip()}
    return {'email': address.strip()}


# ── Resend HTTP API ─────────────────────────────────────────────────────────────

_RESEND_URL = 'https://api.resend.com/emails'
_FALLBACK_FROM = 'Luxe Store <onboarding@resend.dev>'


def _send_resend(*, to, subject, html, text, from_email):
    import requests
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not api_key:
        logger.error(
            'mailer(resend): RESEND_API_KEY not set — email to %s NOT sent. '
            'Add RESEND_API_KEY to your environment variables.',
            to,
        )
        return False

    sender = from_email or getattr(settings, 'RESEND_FROM_EMAIL', None) or _FALLBACK_FROM
    recipients = [to] if isinstance(to, str) else list(to)
    payload = {'from': sender, 'to': recipients, 'subject': subject, 'html': html}
    if text:
        payload['text'] = text

    try:
        resp = requests.post(
            _RESEND_URL,
            json=payload,
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=15,
        )
        if resp.status_code in (200, 201):
            logger.info('mailer(resend): sent "%s" to %s', subject, recipients)
            return True
        logger.error(
            'mailer(resend): API returned %d for "%s" to %s — %s',
            resp.status_code, subject, recipients, resp.text[:300],
        )
        return False
    except Exception:
        logger.exception('mailer(resend): request failed for "%s" to %s', subject, recipients)
        return False
