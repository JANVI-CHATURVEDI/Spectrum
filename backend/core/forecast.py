from datetime import timedelta
from collections import Counter

from django.utils import timezone

from core.geo import haversine_distance

DAY_WEIGHT = {0: 1.00, 1: 1.02, 2: 1.04, 3: 1.08, 4: 1.18, 5: 1.32, 6: 1.24}

OPEN_STATUSES = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED']


def forecast_hotspots(radius_meters: float = 250.0, horizon_hours: int = 48) -> list[dict]:
    from reports.models import WasteReport

    now = timezone.now()
    reports = list(
        WasteReport.objects.filter(status__in=OPEN_STATUSES)
        .values('id', 'latitude', 'longitude', 'address', 'zone',
                'created_at', 'priority_level', 'severity')
    )
    if not reports:
        return []

    parent = list(range(len(reports)))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(len(reports)):
        for j in range(i + 1, len(reports)):
            d = haversine_distance(
                reports[i]['latitude'], reports[i]['longitude'],
                reports[j]['latitude'], reports[j]['longitude'],
            )
            if d <= radius_meters:
                ri, rj = find(i), find(j)
                if ri != rj:
                    parent[rj] = ri

    clusters: dict[int, list[int]] = {}
    for i in range(len(reports)):
        clusters.setdefault(find(i), []).append(i)

    weekday_history = Counter()
    start = now - timedelta(days=28)
    for created in WasteReport.objects.filter(created_at__gte=start).values_list('created_at', flat=True):
        weekday_history[created.weekday()] += 1

    today_count = weekday_history.get(now.weekday(), 0)
    day_factor = DAY_WEIGHT.get(now.weekday(), 1.0)

    results = []
    for members in clusters.values():
        if len(members) < 2:
            continue
        items = [reports[i] for i in members]
        open_now = len(items)
        oldest_age_h = max(
            (now - it['created_at']).total_seconds() / 3600 for it in items
        )
        criticals = sum(1 for it in items if it['priority_level'] == 'CRITICAL')

        density = min(open_now / 5.0, 1.0)
        season = (today_count / 4.0) / 10.0 if today_count else 0.5
        season = min(season, 1.0)
        age = min(oldest_age_h / 48.0, 1.0)

        score = round(min(100.0, (density * 45 + season * 30 + age * 25) * day_factor), 1)
        likely = score >= 55.0

        weekday_name = now.strftime('%A')
        season_pct = int(season * 100)
        explanation = (
            f"{open_now} unresolved reports within {int(radius_meters)}m "
            f"(density {int(density * 100)}%), oldest waiting {round(oldest_age_h, 1)}h. "
            f"Today is {weekday_name} ({season_pct}% of a normal weekday volume), "
            f"day factor {day_factor:.2f} => {score}/100."
        )

        results.append({
            'latitude': items[0]['latitude'],
            'longitude': items[0]['longitude'],
            'zone': items[0]['zone'],
            'open_reports': open_now,
            'critical_reports': criticals,
            'oldest_age_hours': round(oldest_age_h, 1),
            'risk_score': score,
            'likely_to_overflow': likely,
            'horizon_hours': horizon_hours,
            'confidence': 'high' if open_now >= 4 else 'medium',
            'explanation': explanation,
            'recommendation': (
                'Dispatch a pre-emptive sweep before the window closes.'
                if likely else
                'Monitor; no pre-emptive action needed yet.'
            ),
        })

    results.sort(key=lambda r: -r['risk_score'])
    return results[:10]
