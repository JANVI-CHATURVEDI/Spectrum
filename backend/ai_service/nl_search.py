import re
from datetime import timedelta
from django.utils import timezone
from reports.models import WasteReport
from core.geo import haversine_distance

def parse_natural_language_query(query: str) -> dict:
    """
    Parses natural language admin queries into safe structured query parameters
    using Gemini function calling / structured output with strict ORM whitelisting,
    falling back seamlessly to rule-based regex parsing.
    """
    from .service import AIService
    
    q_str = (query or '').strip()
    explanation_parts = []
    source = 'regex_engine'

    # Try Gemini structured output first
    gemini_filters = AIService.structured_search(q_str)
    if gemini_filters:
        source = 'gemini_function_calling'
        orm_filters = {}
        
        if 'priority_level' in gemini_filters:
            orm_filters['priority_level'] = gemini_filters['priority_level']
            explanation_parts.append(f"Priority: {gemini_filters['priority_level']}")
            
        if 'status_in' in gemini_filters and isinstance(gemini_filters['status_in'], list):
            valid_statuses = [s.upper() for s in gemini_filters['status_in']]
            orm_filters['status__in'] = valid_statuses
            explanation_parts.append(f"Status in: {', '.join(valid_statuses)}")
            
        if 'category_icontains' in gemini_filters:
            orm_filters['category__name__icontains'] = gemini_filters['category_icontains']
            explanation_parts.append(f"Category: {gemini_filters['category_icontains']}")
            
        if 'zone' in gemini_filters:
            orm_filters['zone__icontains'] = gemini_filters['zone']
            explanation_parts.append(f"Zone: {gemini_filters['zone']}")
            
        if 'address_icontains' in gemini_filters:
            orm_filters['address__icontains'] = gemini_filters['address_icontains']
            explanation_parts.append(f"Location: {gemini_filters['address_icontains']}")
            
        if 'min_age_hours' in gemini_filters:
            try:
                hrs = float(gemini_filters['min_age_hours'])
                cutoff = timezone.now() - timedelta(hours=hrs)
                orm_filters['created_at__lte'] = cutoff
                explanation_parts.append(f"Unresolved for at least {hrs}h")
            except (ValueError, TypeError):
                pass

        qs = WasteReport.objects.filter(**orm_filters)

        # Handle geo-radius filter if provided
        lat = gemini_filters.get('lat')
        lng = gemini_filters.get('lng')
        radius = gemini_filters.get('radius_meters', 500)
        if lat is not None and lng is not None:
            explanation_parts.append(f"Within {int(radius)}m of coordinates")
            matched_ids = []
            for r in qs[:60]:
                if haversine_distance(float(lat), float(lng), r.latitude, r.longitude) <= float(radius):
                    matched_ids.append(r.id)
            report_ids = matched_ids
        else:
            report_ids = list(qs.values_list('id', flat=True)[:30])

        explanation = " • ".join(explanation_parts) if explanation_parts else f"AI parsed query: '{query}'"
        return {
            'query': query,
            'structured_filters': gemini_filters,
            'matched_count': len(report_ids),
            'report_ids': report_ids,
            'explanation': explanation,
            'source': source,
        }

    # Robust Heuristic / Regex Fallback
    q = q_str.lower()
    filters = {}
    
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
    for keyword, cat_name in categories.items():
        if keyword in q:
            filters['category__name__icontains'] = cat_name
            explanation_parts.append(f"Matching category '{cat_name}'")
            break

    # Location / Area matching
    zones = ['zone 1', 'zone 2', 'zone 3', 'zone 4', 'mall road', 'civil lines', 'market', 'station', 'school', 'hospital', 'connaught place', 'cp']
    for loc in zones:
        if loc in q:
            filters['address__icontains'] = 'Connaught Place' if loc == 'cp' else loc
            explanation_parts.append(f"Near/within '{loc.title()}'")
            break

    # Recurrence matching
    is_recurring_query = 'recurring' in q or 'hotspot' in q or 'repeated' in q
    if is_recurring_query:
        explanation_parts.append("Targeting recurring hotspot incidents")

    # Execute safe query on WasteReport
    qs = WasteReport.objects.filter(**filters)
    if is_recurring_query:
        qs = qs.filter(priority_factors__icontains='recurring')

    report_ids = list(qs.values_list('id', flat=True)[:30])
    explanation = " • ".join(explanation_parts) if explanation_parts else f"Showing recent matches for '{query}'"
    
    return {
        'query': query,
        'structured_filters': {k: str(v) for k, v in filters.items()},
        'matched_count': len(report_ids),
        'report_ids': report_ids,
        'explanation': explanation,
        'source': source,
    }
