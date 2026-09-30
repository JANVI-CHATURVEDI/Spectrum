from django.db import models
from django.conf import settings

class PickupRequest(models.Model):
    WASTE_TYPE_CHOICES = [
        ('HOUSEHOLD', 'Household Waste'),
        ('BULK', 'Bulk / Furniture Waste'),
        ('E_WASTE', 'Electronic Waste'),
        ('GARDEN', 'Garden / Pruning Waste'),
        ('CONSTRUCTION', 'Construction Waste'),
        ('OTHER', 'Other Specialized Waste'),
    ]

    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('SCHEDULED', 'Scheduled'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('COLLECTED', 'Collected'),
        ('VERIFIED', 'Verified'),
    ]

    citizen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pickup_requests'
    )
    waste_type = models.CharField(max_length=50, choices=WASTE_TYPE_CHOICES, default='HOUSEHOLD')
    estimated_volume = models.CharField(max_length=100, default='1-2 bags / small item')
    description = models.TextField(blank=True, default='')
    
    address = models.CharField(max_length=300)
    latitude = models.FloatField()
    longitude = models.FloatField()
    zone = models.CharField(max_length=100, default='Zone 1 - Central')
    
    preferred_slot = models.CharField(max_length=100, default='Morning (9:00 AM - 12:00 PM)')
    scheduled_date = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REQUESTED')
    assigned_worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_pickups'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Pickup #{self.id}: {self.get_waste_type_display()} at {self.address} ({self.status})"
