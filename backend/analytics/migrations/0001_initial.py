
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AreaCleanlinessIndex',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('zone', models.CharField(max_length=100, unique=True)),
                ('score', models.FloatField(default=82.5)),
                ('grade', models.CharField(default='A', max_length=10)),
                ('report_frequency_score', models.FloatField(default=85.0)),
                ('resolution_speed_score', models.FloatField(default=88.0)),
                ('recurrence_prevention_score', models.FloatField(default=76.0)),
                ('pickup_reliability_score', models.FloatField(default=92.0)),
                ('citizen_satisfaction_score', models.FloatField(default=90.0)),
                ('last_computed', models.DateTimeField(auto_now=True)),
            ],
        ),
    ]
