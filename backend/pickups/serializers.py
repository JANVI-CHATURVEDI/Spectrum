from rest_framework import serializers
from .models import PickupRequest
from accounts.serializers import UserSerializer

class PickupRequestSerializer(serializers.ModelSerializer):
    citizen_details = UserSerializer(source='citizen', read_only=True)
    assigned_worker_details = UserSerializer(source='assigned_worker', read_only=True)

    class Meta:
        model = PickupRequest
        fields = [
            'id', 'citizen', 'citizen_details', 'waste_type', 'estimated_volume',
            'description', 'address', 'latitude', 'longitude', 'zone',
            'preferred_slot', 'scheduled_date', 'status', 'assigned_worker',
            'assigned_worker_details', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
