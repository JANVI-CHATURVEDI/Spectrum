"""Award badges to pre-existing users based on their recorded activity."""

from django.db import migrations


CITIZEN_RULES = [
    ('Waste Watcher', 'reports', 1),
    ('Street Reporter', 'reports', 3),
    ('Neighborhood Guardian', 'reports', 5),
    ('City Sentinel', 'reports', 15),
    ('Verified Voice', 'verifications', 3),
]

WORKER_RULES = [
    ('First Fix', 'completions', 1),
    ('Street Doctor', 'completions', 5),
    ('Zone Champion', 'completions', 15),
    ('City Healer', 'completions', 30),
    ('Quality Star', 'quality', 5),
]


def award_existing(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    WasteReport = apps.get_model('reports', 'WasteReport')
    CitizenVerification = apps.get_model('reports', 'CitizenVerification')
    TaskAssignment = apps.get_model('operations', 'TaskAssignment')

    for user in User.objects.all():
        stats = {
            'reports': WasteReport.objects.filter(citizen_id=user.pk).count(),
            'verifications': CitizenVerification.objects.filter(
                citizen_id=user.pk, is_resolved=True
            ).count(),
            'completions': TaskAssignment.objects.filter(
                worker_id=user.pk, status='COMPLETED'
            ).count(),
            'quality': TaskAssignment.objects.filter(
                worker_id=user.pk, status='COMPLETED',
                report__cleanup_verified=True,
            ).count(),
        }
        rules = (
            CITIZEN_RULES if user.role == 'CITIZEN'
            else WORKER_RULES if user.role == 'WORKER'
            else []
        )
        current = set(user.badges or [])
        for name, key, threshold in rules:
            if name not in current and stats.get(key, 0) >= threshold:
                current.add(name)
        if set(user.badges or []) != current:
            User.objects.filter(pk=user.pk).update(badges=sorted(current))


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('reports', '0002_wastereport_after_image_wastereport_after_image_url_and_more'),
        ('operations', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(award_existing, migrations.RunPython.noop),
    ]
