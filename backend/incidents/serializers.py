from rest_framework import serializers
from .models import Incident, Evidence
from reports.serializers import WasteReportSerializer, WasteCategorySerializer
from accounts.serializers import UserSerializer

class EvidenceSerializer(serializers.ModelSerializer):
    worker_details = UserSerializer(source='worker', read_only=True)

    class Meta:
        model = Evidence
        fields = [
            'id', 'incident', 'report', 'worker', 'worker_details',
            'before_image_url', 'after_image', 'after_image_url', 'notes', 'submitted_at'
        ]
        read_only_fields = ['id', 'submitted_at']

class IncidentSerializer(serializers.ModelSerializer):
    category_details = WasteCategorySerializer(source='category', read_only=True)
    reports_details = WasteReportSerializer(source='reports', many=True, read_only=True)
    evidence_records = EvidenceSerializer(many=True, read_only=True)
    report_count = serializers.IntegerField(source='reports.count', read_only=True)

    class Meta:
        model = Incident
        fields = [
            'id', 'title', 'category', 'category_details', 'latitude', 'longitude',
            'address', 'zone', 'status', 'priority_score', 'priority_level',
            'priority_factors', 'reports', 'reports_details', 'evidence_records',
            'report_count', 'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
