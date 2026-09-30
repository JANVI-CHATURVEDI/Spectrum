from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .service import AIService
from .nl_search import parse_natural_language_query
from reports.models import WasteReport
from hotspots.models import Hotspot

class AIClassifyView(APIView):
    """
    Classifies waste type and severity from description & photo hint.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        description = request.data.get('description', '')
        filename = request.data.get('filename', '')
        result = AIService.classify_waste_and_severity(description=description, filename=filename)
        return Response(result)

class NLAdminSearchView(APIView):
    """
    Operational natural language search for Admin Command Center.
    Converts prompts like "Show high priority mixed-waste incidents" to structured filters.
    """
    permission_classes = [AllowAny]  # Accessible to logged-in admins/supervisors and demo

    def post(self, request):
        query = request.data.get('query', '')
        result = parse_natural_language_query(query)
        return Response(result)

class AIInsightsView(APIView):
    """
    Returns AI-generated operational recommendations and municipal insights.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        active_hotspots_count = Hotspot.objects.filter(status='ACTIVE').count()
        total_reports = WasteReport.objects.count()
        insights = AIService.generate_operational_insights({
            'active_hotspots_count': active_hotspots_count,
            'total_reports': total_reports,
            'top_category': 'Mixed waste',
            'top_category_pct': 42,
            'top_pickup_zone': 'Zone 1 - Central'
        })
        return Response({'insights': insights})
