from django.urls import path
from .views import (
    AIClassifyView, NLAdminSearchView, AIInsightsView,
    CleanupVerifyView, HotspotForecastView,
)

urlpatterns = [
    path('classify/', AIClassifyView.as_view(), name='ai-classify'),
    path('search/', NLAdminSearchView.as_view(), name='ai-search'),
    path('insights/', AIInsightsView.as_view(), name='ai-insights'),
    path('verify-cleanup/', CleanupVerifyView.as_view(), name='ai-verify-cleanup'),
    path('forecast/', HotspotForecastView.as_view(), name='ai-forecast'),
]
