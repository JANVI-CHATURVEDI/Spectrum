from django.db import models
from django.conf import settings
from reports.models import WasteCategory, WasteReport

class Incident(models.Model):
    STATUS_CHOICES = [
        ('REPORTED', 'Reported'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CITIZEN_VERIFIED', 'Citizen Verified'),
        ('REOPENED', 'Reopened'),
    ]

    title = models.CharField(max_length=200)
    category = models.ForeignKey(WasteCategory, on_delete=models.PROTECT, related_name='incidents')
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=300)
    zone = models.CharField(max_length=100, default='Zone 1 - Central')
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REPORTED')
    priority_score = models.FloatField(default=25.0)
    priority_level = models.CharField(max_length=20, default='MEDIUM')
    priority_factors = models.JSONField(default=list, blank=True)
    
    reports = models.ManyToManyField(WasteReport, related_name='incidents', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-priority_score', '-created_at']

    def __str__(self):
        return f"Incident #{self.id}: {self.title} ({self.status})"

class Evidence(models.Model):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name='evidence_records', null=True, blank=True)
    report = models.ForeignKey(WasteReport, on_delete=models.CASCADE, related_name='evidence_records', null=True, blank=True)
    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    before_image_url = models.CharField(max_length=1000, blank=True, default='')
    after_image = models.ImageField(upload_to='evidence/%Y/%m/', null=True, blank=True)
    after_image_url = models.CharField(max_length=1000, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Evidence for Incident {self.incident_id or self.report_id} by {self.worker}"
