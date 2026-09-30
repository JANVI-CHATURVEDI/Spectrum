from datetime import timedelta
from django.utils import timezone
from .models import Hotspot
from reports.models import WasteReport
from core.geo import haversine_distance

def predict_hotspot_overflows() -> list[dict]:
    now = timezone.now()
    day_of_week = now.weekday()
    weekend_multiplier = 1.35 if day_of_week in [4, 5, 6] else 1.05

    hotspots = Hotspot.objects.filter(status__in=['ACTIVE', 'MONITORED']).select_related('dominant_category')
    predictions = []

    four_days_ago = now - timedelta(days=4)
    recent_reports = list(
        WasteReport.objects.filter(created_at__gte=four_days_ago)
        .select_related('category')
    )

    for h in hotspots:
        nearby_recent = 0
        unresolved_nearby = 0
        for r in recent_reports:
            if abs(r.latitude - h.latitude) <= 0.004 and abs(r.longitude - h.longitude) <= 0.004:
                dist = haversine_distance(h.latitude, h.longitude, r.latitude, r.longitude)
                if dist <= h.radius_meters:
                    nearby_recent += 1
                    if r.status in ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']:
                        unresolved_nearby += 1

        base_rate = max(1.2, h.report_count / 7.0)
        recent_surge = (nearby_recent / 4.0) / max(0.5, base_rate)
        
        raw_prob = (
            (unresolved_nearby * 18.0) +
            (recent_surge * 25.0) +
            (15.0 if h.recurrence_level == 'CHRONIC' else (10.0 if h.recurrence_level == 'FREQUENT' else 5.0))
        ) * weekend_multiplier

        prob = min(98, max(24, int(raw_prob)))

        if prob >= 75:
            risk_level = 'HIGH RISK'
            timeframe = 'Next 12 - 24 hours'
            urgency_color = '#DC2626'
        elif prob >= 50:
            risk_level = 'MODERATE RISK'
            timeframe = 'Next 24 - 48 hours'
            urgency_color = '#D97706'
        else:
            risk_level = 'LOW RISK'
            timeframe = 'Next 48 - 72 hours'
            urgency_color = '#059669'

        cat_name = h.dominant_category.name if h.dominant_category else 'Mixed waste'

        explanation = (
            f"{unresolved_nearby} unresolved incidents within {int(h.radius_meters)}m "
            f"and historical {h.get_recurrence_level_display().lower()} pattern. "
            f"{'Weekend retail surge increases' if weekend_multiplier > 1.1 else 'Weekday baseline suggests'} "
            f"high probability of bin saturation near {h.name}."
        )

        recommended_action = (
            f"Dispatch pre-emptive collection crew to {h.zone} within {timeframe.split(' ')[1]}h "
            f"to empty {cat_name.lower()} receptacles before spillover."
        )

        predictions.append({
            'hotspot_id': h.id,
            'name': h.name,
            'zone': h.zone,
            'latitude': h.latitude,
            'longitude': h.longitude,
            'radius_meters': h.radius_meters,
            'dominant_category': cat_name,
            'overflow_probability': prob,
            'risk_level': risk_level,
            'timeframe': timeframe,
            'urgency_color': urgency_color,
            'unresolved_nearby_count': unresolved_nearby,
            'recent_48h_reports': nearby_recent,
            'explanation': explanation,
            'recommended_action': recommended_action,
        })

    predictions.sort(key=lambda x: x['overflow_probability'], reverse=True)
    return predictions
