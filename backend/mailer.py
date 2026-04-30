"""
Unified email helper. Switch providers with the EMAIL_PROVIDER env var:

  EMAIL_PROVIDER=smtp    — Django SMTP (default; works locally and on paid/unblocked hosts)
  EMAIL_PROVIDER=resend  — Resend HTTP API (use on Render free tier where SMTP is blocked)

For Resend, also set:
  RESEND_API_KEY=re_xxxxxxxxxxxx        (from https://resend.com → API Keys)
  RESEND_FROM_EMAIL=Luxe Store <onboarding@resend.dev>   (or your verified domain address)
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
        from_email: override sender — defaults to DEFAULT_FROM_EMAIL / RESEND_FROM_EMAIL

    Returns True on success, False on failure.
    """
    provider = getattr(settings, 'EMAIL_PROVIDER', 'smtp').lower()
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
