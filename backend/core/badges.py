"""Civic badge catalog + awarding rules.

Citizens earn badges for reporting, workers for solving. Thresholds live
here so the API, views and migrations all share one definition.
"""

CITIZEN_BADGES = [
    ('Waste Watcher', 'Submit your first waste report', 'reports', 1),
    ('Street Reporter', 'Submit 3 waste reports', 'reports', 3),
    ('Neighborhood Guardian', 'Submit 5 waste reports', 'reports', 5),
    ('City Sentinel', 'Submit 15 waste reports', 'reports', 15),
    ('Verified Voice', 'Confirm 3 cleanups as resolved', 'verifications', 3),
]

WORKER_BADGES = [
    ('First Fix', 'Complete your first cleanup task', 'completions', 1),
    ('Street Doctor', 'Complete 5 cleanup tasks', 'completions', 5),
    ('Zone Champion', 'Complete 15 cleanup tasks', 'completions', 15),
    ('City Healer', 'Complete 30 cleanup tasks', 'completions', 30),
    ('Quality Star', 'Log 5 AI-verified quality cleanups', 'quality', 5),
]

WORKER_COMPLETION_POINTS = 15


def get_user_stats(user):
    """Engagement counters driving badges and impact cards."""
    from reports.models import WasteReport, CitizenVerification
    from operations.models import TaskAssignment

    reports = WasteReport.objects.filter(citizen_id=user.pk).count()
    verifications = CitizenVerification.objects.filter(
        citizen_id=user.pk, is_resolved=True
    ).count()
    completions = TaskAssignment.objects.filter(
        worker_id=user.pk, status='COMPLETED'
    ).count()
    quality = TaskAssignment.objects.filter(
        worker_id=user.pk, status='COMPLETED', report__cleanup_verified=True
    ).count()
    return {
        'reports': reports,
        'verifications': verifications,
        'completions': completions,
        'quality': quality,
    }


def _award_from_catalog(user, catalog, stats):
    earned = []
    current = set(user.badges or [])
    for name, _desc, key, threshold in catalog:
        if name not in current and stats.get(key, 0) >= threshold:
            current.add(name)
            earned.append(name)
    if earned:
        user.badges = sorted(current)
        user.save(update_fields=['badges'])
    return earned


def award_citizen_badges(user, stats=None):
    if user is None:
        return []
    stats = stats or get_user_stats(user)
    return _award_from_catalog(user, CITIZEN_BADGES, stats)


def award_worker_badges(user, stats=None):
    if user is None:
        return []
    stats = stats or get_user_stats(user)
    return _award_from_catalog(user, WORKER_BADGES, stats)


def badge_catalog():
    def shape(rows):
        return [
            {'name': n, 'description': d, 'metric': k, 'threshold': t}
            for n, d, k, t in rows
        ]

    return {'citizen': shape(CITIZEN_BADGES), 'worker': shape(WORKER_BADGES)}
