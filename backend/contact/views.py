from rest_framework import generics, status, permissions
from rest_framework.response import Response
from django.conf import settings
import logging
import threading

from .serializers import ContactMessageSerializer
from mailer import send_email

logger = logging.getLogger(__name__)


def _send_contact_emails(name, email, subject, message):
    admin_email = getattr(settings, 'EMAIL_HOST_USER', '') or getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    if not admin_email:
        logger.warning('contact: no admin email configured, skipping notification')
        return

    # 1 ── Notify admin
    admin_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
  <h2 style="color:#ff5722">New Contact Form Submission</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px;font-weight:bold;width:100px">Name</td><td style="padding:8px">{name}</td></tr>
    <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">{email}</td></tr>
    <tr><td style="padding:8px;font-weight:bold">Subject</td><td style="padding:8px">{subject}</td></tr>
  </table>
  <div style="background:#f9f9f9;border-left:4px solid #ff5722;padding:12px 16px;margin:16px 0;border-radius:4px">
    <p style="margin:0">{message}</p>
  </div>
</body></html>"""
    send_email(
        to=admin_email,
        subject=f'[Contact Form] {subject}',
        html=admin_html,
        text=f'Name: {name}\nEmail: {email}\nSubject: {subject}\n\n{message}',
    )

    # 2 ── Auto-reply to visitor
    reply_html = f"""
<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto">
  <h2 style="color:#ff5722">Thanks for contacting us, {name}!</h2>
  <p>We received your message and will get back to you within <strong>1-2 business days</strong>.</p>
  <div style="background:#f9f9f9;border-left:4px solid #ff5722;padding:12px 16px;margin:16px 0;border-radius:4px">
    <p style="margin:0;font-style:italic;color:#555">"{message}"</p>
  </div>
  <p>Best regards,<br><strong>Luxe Store Support Team</strong></p>
</body></html>"""
    send_email(
        to=email,
        subject=f'We received your message - {subject}',
        html=reply_html,
        text=(
            f'Hi {name},\n\nThank you for reaching out! '
            'We will get back to you within 1-2 business days.\n\n'
            f'Your message:\n"{message}"\n\n'
            'Best regards,\nLuxe Store Support Team'
        ),
    )


class ContactView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        t = threading.Thread(
            target=_send_contact_emails,
            args=(instance.name, instance.email, instance.subject, instance.message),
            daemon=True,
        )
        t.start()

        return Response(
            {'detail': 'Your message has been received. We will get back to you soon.'},
            status=status.HTTP_201_CREATED,
        )

