from django.conf import settings
from django.db import models


class Notification(models.Model):
    KIND_CHOICES = [
        ('REPORT_SUBMITTED', 'Report submitted'),
        ('VERIFICATION_REQUIRED', 'Verification required'),
        ('VERIFIED_CLOSED', 'Report closed'),
        ('REOPENED', 'Report reopened'),
        ('TASK_ASSIGNED', 'Task assigned'),
        ('PICKUP_UPDATE', 'Pickup update'),
        ('STAFF_CREATED', 'Staff account created'),
        ('GENERAL', 'General'),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications'
    )
    kind = models.CharField(max_length=40, choices=KIND_CHOICES, default='GENERAL')
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default='')
    link = models.CharField(max_length=200, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'#{self.pk} {self.kind} -> {self.recipient_id}'


def push_notification(recipient, kind, title, body='', link=''):
    if recipient is None or getattr(recipient, 'pk', None) is None:
        return None
    try:
        return Notification.objects.create(
            recipient=recipient, kind=kind, title=title[:200], body=body, link=link[:200]
        )
    except Exception:
        return None
