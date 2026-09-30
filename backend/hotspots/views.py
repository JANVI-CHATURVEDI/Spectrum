from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Hotspot
from .serializers import HotspotSerializer
from reports.models import WasteReport
from core.geo import haversine_distance

class HotspotViewSet(viewsets.ModelViewSet):
    queryset = Hotspot.objects.select_related('dominant_category').all()
    serializer_class = HotspotSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Hotspot.objects.all()
        zone = self.request.query_params.get('zone')
        status_param = self.request.query_params.get('status')
        if zone:
            qs = qs.filter(zone=zone)
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs

class DetectHotspotsView(APIView):
    """
    Scans recent reports and aggregates density clusters into recurring hotspots.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        radius = float(request.data.get('radius_meters', 150.0))
        reports = list(WasteReport.objects.filter(status__in=['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']))
        
        clusters_found = 0
        for r in reports:
            # Count how many reports are within radius
            nearby = [other for other in reports if haversine_distance(r.latitude, r.longitude, other.latitude, other.longitude) <= radius]
            if len(nearby) >= 3:
                # Check if hotspot already exists nearby
                existing = None
                for h in Hotspot.objects.all():
                    if haversine_distance(r.latitude, r.longitude, h.latitude, h.longitude) <= h.radius_meters:
                        existing = h
                        break
                        
                if existing:
                    existing.report_count = len(nearby)
                    existing.save(update_fields=['report_count'])
                else:
                    Hotspot.objects.create(
                        name=f"Recurring Cluster near {r.address[:40]}",
                        latitude=r.latitude,
                        longitude=r.longitude,
                        radius_meters=radius,
                        zone=r.zone,
                        incident_count=len(nearby),
                        report_count=len(nearby),
                        trend_percentage=45.0,
                        dominant_category=r.category,
                        avg_resolution_hours=6.2,
                        is_recurring=True,
                        recurrence_level='FREQUENT',
                        recommendation='Deploy heavy compactor bins and schedule twice-daily collection.',
                        status='ACTIVE'
                    )
                    clusters_found += 1

        return Response({
            'message': f'Hotspot scan complete. {clusters_found} new recurring hotspots registered.',
            'total_active_hotspots': Hotspot.objects.filter(status='ACTIVE').count()
        })
