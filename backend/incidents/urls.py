from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IncidentViewSet, SubmitEvidenceView

router = DefaultRouter()
router.register(r'clusters', IncidentViewSet, basename='incident-clusters')

urlpatterns = [
    path('evidence/submit/', SubmitEvidenceView.as_view(), name='submit-evidence'),
    path('', include(router.urls)),
]
