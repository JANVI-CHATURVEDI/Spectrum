from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.utils import timezone

from .models import Incident, Evidence
from .serializers import IncidentSerializer, EvidenceSerializer
from reports.models import WasteReport
from operations.models import TaskAssignment

class IncidentViewSet(viewsets.ModelViewSet):
    queryset = Incident.objects.prefetch_related('reports', 'evidence_records').all()
    serializer_class = IncidentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Incident.objects.all()
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        zone_param = self.request.query_params.get('zone')
        
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if priority_param:
            qs = qs.filter(priority_level=priority_param.upper())
        if zone_param:
            qs = qs.filter(zone=zone_param)
        return qs

class SubmitEvidenceView(APIView):
    """
    Sanitation Worker uploads after-cleanup proof photo and completes the incident or report.
    """
    permission_classes = [AllowAny]  # Allow easy testing and worker action

    def post(self, request):
        incident_id = request.data.get('incident_id')
        report_id = request.data.get('report_id')
        worker = request.user if request.user.is_authenticated else None
        
        before_image_url = request.data.get('before_image_url', '')
        after_image_url = request.data.get('after_image_url', '')
        after_image = request.FILES.get('after_image')
        notes = request.data.get('notes', 'Area thoroughly cleared and disinfected by sanitation route team.')

        evidence = Evidence.objects.create(
            incident_id=incident_id,
            report_id=report_id,
            worker=worker,
            before_image_url=before_image_url,
            after_image=after_image,
            after_image_url=after_image_url or ('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80' if not after_image else ''),
            notes=notes
        )

        now = timezone.now()

        # Update report status
        if report_id:
            try:
                rep = WasteReport.objects.get(id=report_id)
                rep.status = 'RESOLVED'
                rep.resolved_at = now
                rep.save(update_fields=['status', 'resolved_at'])
            except WasteReport.DoesNotExist:
                pass

        # Update incident status
        if incident_id:
            try:
                inc = Incident.objects.get(id=incident_id)
                inc.status = 'RESOLVED'
                inc.resolved_at = now
                inc.save(update_fields=['status', 'resolved_at'])
                # Also mark all child reports as resolved
                inc.reports.filter(status__in=['REPORTED', 'ASSIGNED', 'IN_PROGRESS']).update(
                    status='RESOLVED',
                    resolved_at=now
                )
            except Incident.DoesNotExist:
                pass

        # Update associated task assignments.
        # Guarded: filtering on `report_id=None` would otherwise match EVERY
        # incident-only assignment and mark unrelated work as completed.
        if report_id:
            TaskAssignment.objects.filter(
                report_id=report_id,
                status__in=['ASSIGNED', 'IN_PROGRESS']
            ).update(status='COMPLETED', completed_at=now)

        if incident_id:
            TaskAssignment.objects.filter(
                incident_id=incident_id,
                status__in=['ASSIGNED', 'IN_PROGRESS']
            ).update(status='COMPLETED', completed_at=now)

        return Response({
            'message': 'Resolution evidence recorded. Status transitioned to RESOLVED awaiting citizen verification.',
            'evidence': EvidenceSerializer(evidence).data
        }, status=status.HTTP_201_CREATED)
