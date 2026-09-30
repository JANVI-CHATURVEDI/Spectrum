from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import PickupRequest
from .serializers import PickupRequestSerializer
from accounts.models import User

class PickupRequestViewSet(viewsets.ModelViewSet):
    queryset = PickupRequest.objects.select_related('citizen', 'assigned_worker').all()
    serializer_class = PickupRequestSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = PickupRequest.objects.all()
        status_param = self.request.query_params.get('status')
        zone_param = self.request.query_params.get('zone')
        my_pickups = self.request.query_params.get('my_pickups')
        worker_id = self.request.query_params.get('worker_id')
        
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if zone_param:
            qs = qs.filter(zone=zone_param)
        if my_pickups and self.request.user.is_authenticated:
            qs = qs.filter(citizen=self.request.user)
        if worker_id:
            qs = qs.filter(assigned_worker_id=worker_id)
            
        return qs

    def perform_create(self, serializer):
        citizen = self.request.user if self.request.user.is_authenticated else User.objects.filter(role='CITIZEN').first()
        if citizen is None:
            # PickupRequest.citizen is NOT NULL - never let an anonymous
            # request on an unseeded DB blow up with an IntegrityError.
            citizen, _ = User.objects.get_or_create(
                username='guest_citizen',
                defaults={
                    'email': 'guest@swachdrishti.local',
                    'role': 'CITIZEN',
                    'first_name': 'Guest',
                    'last_name': 'Citizen',
                },
            )
        serializer.save(citizen=citizen)
