
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Hotspot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('radius_meters', models.FloatField(default=150.0)),
                ('zone', models.CharField(default='Zone 1 - Central', max_length=100)),
                ('incident_count', models.IntegerField(default=1)),
                ('report_count', models.IntegerField(default=1)),
                ('trend_percentage', models.FloatField(default=0.0)),
                ('avg_resolution_hours', models.FloatField(default=5.4)),
                ('is_recurring', models.BooleanField(default=True)),
                ('recurrence_level', models.CharField(choices=[('OCCASIONAL', 'Occasional (1-2 times/mo)'), ('FREQUENT', 'Frequent (3-5 times/mo)'), ('CHRONIC', 'Chronic (>5 times/mo)')], default='FREQUENT', max_length=30)),
                ('recommendation', models.TextField(default='Deploy additional bin capacity and adjust municipal patrol schedule.')),
                ('status', models.CharField(choices=[('ACTIVE', 'Active Hotspot'), ('MONITORED', 'Under Monitoring'), ('CLEARED', 'Cleared / Sustained')], default='ACTIVE', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('dominant_category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='hotspots', to='reports.wastecategory')),
            ],
            options={
                'ordering': ['-report_count', '-created_at'],
            },
        ),
    ]
