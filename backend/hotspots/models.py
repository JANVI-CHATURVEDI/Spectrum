from django.db import models
from reports.models import WasteCategory

class Hotspot(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active Hotspot'),
        ('MONITORED', 'Under Monitoring'),
        ('CLEARED', 'Cleared / Sustained'),
    ]

    RECURRENCE_CHOICES = [
        ('OCCASIONAL', 'Occasional (1-2 times/mo)'),
        ('FREQUENT', 'Frequent (3-5 times/mo)'),
        ('CHRONIC', 'Chronic (>5 times/mo)'),
    ]

    name = models.CharField(max_length=200)
    latitude = models.FloatField()
    longitude = models.FloatField()
    radius_meters = models.FloatField(default=150.0)
    zone = models.CharField(max_length=100, default='Zone 1 - Central')
    
    incident_count = models.IntegerField(default=1)
    report_count = models.IntegerField(default=1)
    trend_percentage = models.FloatField(default=0.0)
    
    dominant_category = models.ForeignKey(
        WasteCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hotspots'
    )
    avg_resolution_hours = models.FloatField(default=5.4)
    is_recurring = models.BooleanField(default=True)
    recurrence_level = models.CharField(max_length=30, choices=RECURRENCE_CHOICES, default='FREQUENT')
    recommendation = models.TextField(default='Deploy additional bin capacity and adjust municipal patrol schedule.')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-report_count', '-created_at']

    def __str__(self):
        return f"Hotspot: {self.name} ({self.report_count} reports, {self.status})"
