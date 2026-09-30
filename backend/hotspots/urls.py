from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotspotViewSet, DetectHotspotsView, HotspotPredictionView

router = DefaultRouter()
router.register(r'', HotspotViewSet, basename='hotspots')

urlpatterns = [
    path('detect/', DetectHotspotsView.as_view(), name='detect-hotspots'),
    path('predictions/', HotspotPredictionView.as_view(), name='hotspot-predictions'),
    path('', include(router.urls)),
]
