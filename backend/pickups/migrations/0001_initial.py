
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PickupRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('waste_type', models.CharField(choices=[('HOUSEHOLD', 'Household Waste'), ('BULK', 'Bulk / Furniture Waste'), ('E_WASTE', 'Electronic Waste'), ('GARDEN', 'Garden / Pruning Waste'), ('CONSTRUCTION', 'Construction Waste'), ('OTHER', 'Other Specialized Waste')], default='HOUSEHOLD', max_length=50)),
                ('estimated_volume', models.CharField(default='1-2 bags / small item', max_length=100)),
                ('description', models.TextField(blank=True, default='')),
                ('address', models.CharField(max_length=300)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('zone', models.CharField(default='Zone 1 - Central', max_length=100)),
                ('preferred_slot', models.CharField(default='Morning (9:00 AM - 12:00 PM)', max_length=100)),
                ('scheduled_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('REQUESTED', 'Requested'), ('SCHEDULED', 'Scheduled'), ('ASSIGNED', 'Assigned'), ('IN_PROGRESS', 'In Progress'), ('COLLECTED', 'Collected'), ('VERIFIED', 'Verified')], default='REQUESTED', max_length=30)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('assigned_worker', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_pickups', to=settings.AUTH_USER_MODEL)),
                ('citizen', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pickup_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
