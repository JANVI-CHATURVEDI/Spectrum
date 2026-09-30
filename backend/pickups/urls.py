from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PickupRequestViewSet

router = DefaultRouter()
router.register(r'', PickupRequestViewSet, basename='pickups')

urlpatterns = [
    path('', include(router.urls)),
]
