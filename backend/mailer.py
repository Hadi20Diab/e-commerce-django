"""
Thin email helper that sends via the Resend HTTP API (https://resend.com).

Why: Render free tier blocks ALL outbound SMTP ports (25, 465, 587).
     Resend uses HTTPS (port 443) which is never blocked.

Setup (one-time):
  1. Sign up free at https://resend.com  — no credit card needed
  2. Dashboard → API Keys → Create API Key
  3. Add  RESEND_API_KEY = <your key>  in Render Environment Variables
  4. Optionally verify your domain to send from your own address.
     Without domain verification, from_email is forced to onboarding@resend.dev
     but emails still reach any recipient.

Free tier: 3 000 emails/month, 100/day.
"""

import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

_RESEND_URL = 'https://api.resend.com/emails'
_FALLBACK_FROM = 'Luxe Store <onboarding@resend.dev>'


def send_email(*, to, subject, html, text='', from_email=None):
    """
    Send a single email via Resend.

    Args:
        to:         recipient address string or list of strings
        subject:    email subject
        html:       HTML body
        text:       plain-text fallback (optional but recommended)
        from_email: sender address – defaults to RESEND_FROM_EMAIL setting or
                    'Luxe Store <onboarding@resend.dev>' (works without domain verification)

    Returns True on success, False on failure (always logs errors).
    """
    api_key = getattr(settings, 'RESEND_API_KEY', '')
    if not api_key:
        logger.error(
            'mailer: RESEND_API_KEY is not set — email to %s was NOT sent. '
            'Add RESEND_API_KEY in your Render environment variables.',
            to,
        )
        return False

    sender = (
        from_email
        or getattr(settings, 'RESEND_FROM_EMAIL', None)
        or _FALLBACK_FROM
    )

    recipients = [to] if isinstance(to, str) else list(to)

    payload = {
        'from': sender,
        'to': recipients,
        'subject': subject,
        'html': html,
    }
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
            logger.info('mailer: email sent to %s (id=%s)', recipients, resp.json().get('id'))
            return True
        else:
            logger.error(
                'mailer: Resend returned %d — %s',
                resp.status_code,
                resp.text[:300],
            )
            return False
    except Exception:
        logger.exception('mailer: unexpected error sending to %s', recipients)
        return False
