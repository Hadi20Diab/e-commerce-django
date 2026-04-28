from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
import logging

from .serializers import ContactMessageSerializer

logger = logging.getLogger(__name__)


def _send_contact_emails(name, email, subject, message):
    """
    Sends two emails after a contact form submission:
      1. Notification to the site admin (EMAIL_HOST_USER or DEFAULT_FROM_EMAIL).
      2. Confirmation reply to the visitor.
    Both silently skip if EMAIL_HOST_USER is not configured (console backend).
    """
    admin_email = getattr(settings, 'EMAIL_HOST_USER', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@luxe.com')

    # 1 ── Notify admin
    try:
        admin_body = (
            f"New contact form submission\n\n"
            f"Name:    {name}\n"
            f"Email:   {email}\n"
            f"Subject: {subject}\n\n"
            f"Message:\n{message}\n"
        )
        send_mail(
            subject=f"[Contact Form] {subject}",
            message=admin_body,
            from_email=from_email,
            recipient_list=[admin_email],
            fail_silently=True,
        )
    except Exception:
        logger.exception('Failed to send contact notification email to admin')

    # 2 ── Auto-reply to visitor
    try:
        reply_subject = f"We received your message — {subject}"
        reply_text = (
            f"Hi {name},\n\n"
            "Thank you for reaching out to Luxe Store! We've received your message "
            "and our team will get back to you within 1–2 business days.\n\n"
            f"Your message:\n\"{message}\"\n\n"
            "Best regards,\nLuxe Store Support Team"
        )
        reply_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
  <h2 style="color:#ff5722">Thanks for contacting us, {name}!</h2>
  <p>We've received your message and our team will get back to you within <strong>1–2 business days</strong>.</p>
  <div style="background:#f9f9f9;border-left:4px solid #ff5722;padding:12px 16px;margin:16px 0;border-radius:4px">
    <p style="margin:0;font-style:italic;color:#555">"{message}"</p>
  </div>
  <p>Best regards,<br><strong>Luxe Store Support Team</strong></p>
</body></html>"""
        msg = EmailMultiAlternatives(reply_subject, reply_text, from_email, [email])
        msg.attach_alternative(reply_html, 'text/html')
        msg.send(fail_silently=True)
    except Exception:
        logger.exception('Failed to send contact auto-reply email to %s', email)


class ContactView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        _send_contact_emails(
            name=instance.name,
            email=instance.email,
            subject=instance.subject,
            message=instance.message,
        )

        return Response(
            {'detail': 'Your message has been received. We will get back to you soon.'},
            status=status.HTTP_201_CREATED
        )
