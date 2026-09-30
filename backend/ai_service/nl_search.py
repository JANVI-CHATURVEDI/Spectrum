import re
from datetime import timedelta
from django.utils import timezone
from reports.models import WasteReport
from incidents.models import Incident
from hotspots.models import Hotspot

def parse_natural_language_query(query: str) -> dict:
    """
    Parses natural language admin queries into safe structured query parameters
    and returns matching report/incident IDs and filter explanations.
    """
    q = (query or '').strip().lower()
    filters = {}
    explanation_parts = []
    
    # Priority matching
    if 'critical' in q:
        filters['priority_level'] = 'CRITICAL'
        explanation_parts.append("Filtered by priority: CRITICAL")
    elif 'high' in q:
        filters['priority_level__in'] = ['HIGH', 'CRITICAL']
        explanation_parts.append("Filtered by priority: HIGH or CRITICAL")
    elif 'low' in q:
        filters['priority_level'] = 'LOW'
        explanation_parts.append("Filtered by priority: LOW")

    # Status matching
    if 'unresolved' in q or 'pending' in q or 'open' in q:
        filters['status__in'] = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']
        explanation_parts.append("Showing unresolved issues")
    elif 'resolved' in q or 'completed' in q:
        filters['status__in'] = ['RESOLVED', 'CITIZEN_VERIFIED']
        explanation_parts.append("Showing resolved issues")

    # Category matching
    categories = {
        'bin': 'Overflowing bin',
        'overflow': 'Overflowing bin',
        'plastic': 'Plastic accumulation',
        'mixed': 'Mixed waste',
        'roadside': 'Roadside dumping',
        'illegal': 'Illegal dumping',
        'construction': 'Construction waste',
        'e-waste': 'E-Waste',
        'electronic': 'E-Waste',
    }
    matched_cat = None
    for keyword, cat_name in categories.items():
        if keyword in q:
            matched_cat = cat_name
            filters['category__name__icontains'] = cat_name
            explanation_parts.append(f"Matching category '{cat_name}'")
            break

    # Location / Area matching
    zones = ['zone 1', 'zone 2', 'zone 3', 'zone 4', 'mall road', 'civil lines', 'market', 'station', 'school', 'hospital']
    matched_area = None
    for loc in zones:
        if loc in q:
            matched_area = loc
            filters['address__icontains'] = loc
            explanation_parts.append(f"Near/within '{loc.title()}'")
            break

    # Recurrence matching
    is_recurring_query = 'recurring' in q or 'hotspot' in q or 'repeated' in q
    if is_recurring_query:
        explanation_parts.append("Targeting recurring hotspot incidents")

    # Execute safe query on WasteReport
    qs = WasteReport.objects.filter(**filters)
    if is_recurring_query:
        # Match reports marked with priority factor mentioning hotspot or recurring
        qs = qs.filter(priority_factors__icontains='recurring')

    report_ids = list(qs.values_list('id', flat=True)[:30])
    
    explanation = " • ".join(explanation_parts) if explanation_parts else f"Showing recent matches for '{query}'"
    
    return {
        'query': query,
        'structured_filters': {k: str(v) for k, v in filters.items()},
        'matched_count': len(report_ids),
        'report_ids': report_ids,
        'explanation': explanation,
    }
