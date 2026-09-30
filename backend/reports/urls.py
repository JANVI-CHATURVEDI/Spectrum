from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WasteCategoryListView, CheckDuplicateReportView, WasteReportViewSet, CitizenVerificationView

router = DefaultRouter()
router.register(r'incidents', WasteReportViewSet, basename='reports-incidents')
router.register(r'', WasteReportViewSet, basename='reports')

urlpatterns = [
    path('categories/', WasteCategoryListView.as_view(), name='category-list'),
    path('check-duplicate/', CheckDuplicateReportView.as_view(), name='check-duplicate'),
    path('<int:pk>/verify/', CitizenVerificationView.as_view(), name='citizen-verify'),
    path('', include(router.urls)),
]
