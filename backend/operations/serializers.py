from rest_framework import serializers
from .models import TaskAssignment
from accounts.serializers import UserSerializer
from reports.serializers import WasteReportSerializer
from incidents.serializers import IncidentSerializer
from pickups.serializers import PickupRequestSerializer

class TaskAssignmentSerializer(serializers.ModelSerializer):
    worker_details = UserSerializer(source='worker', read_only=True)
    supervisor_details = UserSerializer(source='supervisor', read_only=True)
    report_details = WasteReportSerializer(source='report', read_only=True)
    incident_details = IncidentSerializer(source='incident', read_only=True)
    pickup_details = PickupRequestSerializer(source='pickup', read_only=True)

    class Meta:
        model = TaskAssignment
        fields = [
            'id', 'worker', 'worker_details', 'supervisor', 'supervisor_details',
            'report', 'report_details', 'incident', 'incident_details',
            'pickup', 'pickup_details', 'status', 'priority_level',
            'assigned_at', 'started_at', 'completed_at', 'notes'
        ]
        read_only_fields = ['id', 'assigned_at']
