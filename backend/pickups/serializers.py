from rest_framework import serializers
from .models import PickupRequest
from accounts.serializers import UserSerializer

class PickupRequestSerializer(serializers.ModelSerializer):
    citizen_details = UserSerializer(source='citizen', read_only=True)
    assigned_worker_details = UserSerializer(source='assigned_worker', read_only=True)
    preferred_time = serializers.CharField(source='preferred_slot', required=False)

    class Meta:
        model = PickupRequest
        fields = [
            'id', 'citizen', 'citizen_details', 'waste_type', 'estimated_volume',
            'description', 'address', 'latitude', 'longitude', 'zone',
            'preferred_slot', 'preferred_time', 'scheduled_date', 'status', 'assigned_worker',
            'assigned_worker_details', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'citizen', 'assigned_worker']

    def to_internal_value(self, data):
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'preferred_time' in data and 'preferred_slot' not in data:
            data['preferred_slot'] = data['preferred_time']
        return super().to_internal_value(data)
