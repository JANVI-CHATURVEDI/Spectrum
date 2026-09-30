from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta

from .models import TaskAssignment
from .serializers import TaskAssignmentSerializer
from accounts.models import User
from reports.models import WasteReport
from incidents.models import Incident
from pickups.models import PickupRequest

class TaskAssignmentViewSet(viewsets.ModelViewSet):
    queryset = TaskAssignment.objects.select_related(
        'worker', 'supervisor', 'report', 'incident', 'pickup'
    ).all()
    serializer_class = TaskAssignmentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = TaskAssignment.objects.all()
        worker_id = self.request.query_params.get('worker_id')
        status_param = self.request.query_params.get('status')
        priority_param = self.request.query_params.get('priority')
        
        # If logged-in worker, filter by their user ID
        if self.request.user.is_authenticated and self.request.user.role == 'WORKER' and not worker_id:
            qs = qs.filter(worker=self.request.user)
        elif worker_id:
            qs = qs.filter(worker_id=worker_id)
            
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if priority_param:
            qs = qs.filter(priority_level=priority_param.upper())
            
        return qs

class AssignTaskView(APIView):
    """
    Supervisor or Admin assigns a report/incident/pickup to a sanitation worker.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        worker_id = request.data.get('worker_id')
        report_id = request.data.get('report_id')
        incident_id = request.data.get('incident_id')
        pickup_id = request.data.get('pickup_id')
        notes = request.data.get('notes', '')

        try:
            worker = User.objects.get(id=worker_id)
        except User.DoesNotExist:
            return Response({'error': 'Worker not found'}, status=status.HTTP_404_NOT_FOUND)

        supervisor = request.user if request.user.is_authenticated else None
        priority_level = 'HIGH'

        # Update report status
        if report_id:
            try:
                rep = WasteReport.objects.get(id=report_id)
                rep.status = 'ASSIGNED'
                rep.save(update_fields=['status'])
                priority_level = rep.priority_level
            except WasteReport.DoesNotExist:
                return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update incident status
        if incident_id:
            try:
                inc = Incident.objects.get(id=incident_id)
                inc.status = 'ASSIGNED'
                inc.save(update_fields=['status'])
                priority_level = inc.priority_level
            except Incident.DoesNotExist:
                return Response({'error': 'Incident not found'}, status=status.HTTP_404_NOT_FOUND)

        # Update pickup status
        if pickup_id:
            try:
                pick = PickupRequest.objects.get(id=pickup_id)
                pick.status = 'ASSIGNED'
                pick.assigned_worker = worker
                pick.save(update_fields=['status', 'assigned_worker'])
            except PickupRequest.DoesNotExist:
                return Response({'error': 'Pickup request not found'}, status=status.HTTP_404_NOT_FOUND)

        assignment = TaskAssignment.objects.create(
            worker=worker,
            supervisor=supervisor,
            report_id=report_id,
            incident_id=incident_id,
            pickup_id=pickup_id,
            status='ASSIGNED',
            priority_level=priority_level,
            notes=notes
        )

        return Response({
            'message': f"Task successfully assigned to worker {worker.get_full_name() or worker.username}.",
            'assignment': TaskAssignmentSerializer(assignment).data
        }, status=status.HTTP_201_CREATED)

class TransitionTaskStatusView(APIView):
    """
    Worker starts or progresses a task.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            task = TaskAssignment.objects.get(pk=pk)
        except TaskAssignment.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', 'IN_PROGRESS').upper()
        task.status = new_status
        now = timezone.now()

        if new_status == 'IN_PROGRESS' and not task.started_at:
            task.started_at = now
            if task.report:
                task.report.status = 'IN_PROGRESS'
                task.report.save(update_fields=['status'])
            if task.incident:
                task.incident.status = 'IN_PROGRESS'
                task.incident.save(update_fields=['status'])
            if task.pickup:
                task.pickup.status = 'IN_PROGRESS'
                task.pickup.save(update_fields=['status'])

        elif new_status == 'COMPLETED':
            task.completed_at = now
            if task.report:
                task.report.status = 'RESOLVED'
                task.report.resolved_at = now
                task.report.save(update_fields=['status', 'resolved_at'])
            if task.incident:
                task.incident.status = 'RESOLVED'
                task.incident.resolved_at = now
                task.incident.save(update_fields=['status', 'resolved_at'])
            if task.pickup:
                task.pickup.status = 'COLLECTED'
                task.pickup.completed_at = now
                task.pickup.save(update_fields=['status', 'completed_at'])

        task.save()
        return Response({
            'message': f'Task status updated to {new_status}.',
            'task': TaskAssignmentSerializer(task).data
        })

class SupervisorTeamSummaryView(APIView):
    """
    Supervisor view summarizing worker workload, active dispatches, and overdue incidents.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        workers = User.objects.filter(role='WORKER')
        team_stats = []

        now = timezone.now()
        overdue_threshold = now - timedelta(hours=6)

        for w in workers:
            tasks = TaskAssignment.objects.filter(worker=w)
            active_count = tasks.filter(status__in=['ASSIGNED', 'IN_PROGRESS']).count()
            completed_count = tasks.filter(status='COMPLETED').count()
            overdue_count = tasks.filter(
                status__in=['ASSIGNED', 'IN_PROGRESS'],
                assigned_at__lte=overdue_threshold
            ).count()

            team_stats.append({
                'id': w.id,
                'name': w.get_full_name() or w.username,
                'zone': w.zone,
                'phone': w.phone,
                'total_tasks': tasks.count(),
                'active_tasks': active_count,
                'completed_today': completed_count,
                'overdue_tasks': overdue_count,
                'status': 'Busy' if active_count >= 3 else ('Available' if active_count == 0 else 'On Route')
            })

        pending_incidents = WasteReport.objects.filter(status__in=['REPORTED', 'VERIFIED']).count()
        overdue_incidents = WasteReport.objects.filter(
            status__in=['REPORTED', 'ASSIGNED', 'IN_PROGRESS'],
            created_at__lte=overdue_threshold
        ).count()

        return Response({
            'team': team_stats,
            'summary': {
                'total_workers': workers.count(),
                'pending_incidents': pending_incidents,
                'overdue_incidents': overdue_incidents,
                'completed_today': TaskAssignment.objects.filter(
                    status='COMPLETED',
                    completed_at__date=now.date()
                ).count()
            }
        })
