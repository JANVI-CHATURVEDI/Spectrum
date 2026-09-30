from rest_framework import serializers
from .models import AreaCleanlinessIndex
from reports.models import WasteReport


class AreaCleanlinessIndexSerializer(serializers.ModelSerializer):
    ward_name = serializers.CharField(source='zone', read_only=True)
    resolution_rate = serializers.SerializerMethodField()

    class Meta:
        model = AreaCleanlinessIndex
        fields = [
            'id', 'zone', 'ward_name', 'score', 'grade', 'resolution_rate',
            'report_frequency_score', 'resolution_speed_score',
            'recurrence_prevention_score', 'pickup_reliability_score',
            'citizen_satisfaction_score', 'last_computed',
        ]

    def get_resolution_rate(self, obj) -> str:
        total = WasteReport.objects.filter(zone=obj.zone).count()
        if not total:
            return f"{min(int(round(obj.resolution_speed_score)), 100)}%"
        done = WasteReport.objects.filter(
            zone=obj.zone, status__in=['RESOLVED', 'CITIZEN_VERIFIED']
        ).count()
        return f"{round(done / total * 100)}%"
