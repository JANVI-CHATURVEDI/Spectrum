from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotspotViewSet, DetectHotspotsView

router = DefaultRouter()
router.register(r'', HotspotViewSet, basename='hotspots')

urlpatterns = [
    path('detect/', DetectHotspotsView.as_view(), name='detect-hotspots'),
    path('', include(router.urls)),
]
