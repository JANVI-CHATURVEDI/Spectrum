from rest_framework import serializers
from .models import Hotspot
from reports.serializers import WasteCategorySerializer

class HotspotSerializer(serializers.ModelSerializer):
    dominant_category_details = WasteCategorySerializer(source='dominant_category', read_only=True)

    class Meta:
        model = Hotspot
        fields = [
            'id', 'name', 'latitude', 'longitude', 'radius_meters', 'zone',
            'incident_count', 'report_count', 'trend_percentage', 'dominant_category',
            'dominant_category_details', 'avg_resolution_hours', 'is_recurring',
            'recurrence_level', 'recommendation', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
