from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class MyNotificationsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'unread': Notification.objects.filter(recipient=request.user, is_read=False).count()
        })


class MarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids')
        qs = Notification.objects.filter(recipient=request.user, is_read=False)
        if ids:
            qs = qs.filter(id__in=ids)
        return Response({'marked_read': qs.update(is_read=True)})
