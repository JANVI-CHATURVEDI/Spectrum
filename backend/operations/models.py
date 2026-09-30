from django.db import models
from django.conf import settings
from reports.models import WasteReport
from incidents.models import Incident
from pickups.models import PickupRequest

class TaskAssignment(models.Model):
    STATUS_CHOICES = [
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]

    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_tasks'
    )
    supervisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supervised_tasks'
    )
    
    report = models.ForeignKey(WasteReport, on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    pickup = models.ForeignKey(PickupRequest, on_delete=models.CASCADE, null=True, blank=True, related_name='assignments')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ASSIGNED')
    priority_level = models.CharField(max_length=20, default='HIGH')
    
    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-assigned_at']

    def __str__(self):
        target = f"Report #{self.report_id}" if self.report_id else (f"Incident #{self.incident_id}" if self.incident_id else f"Pickup #{self.pickup_id}")
        return f"Task ({target}) -> Worker {self.worker.username} [{self.status}]"
