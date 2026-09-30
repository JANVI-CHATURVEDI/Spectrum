from django.urls import path
from .views import CityOverviewMetricsView, CleanlinessIndexView, AnalyticsChartsDataView, PublicTransparencyView

urlpatterns = [
    path('overview/', CityOverviewMetricsView.as_view(), name='analytics-overview'),
    path('cleanliness-index/', CleanlinessIndexView.as_view(), name='cleanliness-index'),
    path('charts/', AnalyticsChartsDataView.as_view(), name='analytics-charts'),
    path('public/', PublicTransparencyView.as_view(), name='analytics-public'),
    # Alias used by the frontend
    path('transparency/', PublicTransparencyView.as_view(), name='analytics-transparency'),
]
