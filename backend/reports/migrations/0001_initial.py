
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
            name='WasteCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('icon', models.CharField(default='trash-2', max_length=50)),
                ('color', models.CharField(default='#059669', max_length=30)),
                ('description', models.TextField(blank=True, default='')),
                ('disposal_guide', models.TextField(blank=True, default='')),
            ],
            options={
                'verbose_name_plural': 'Waste Categories',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='WasteReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(blank=True, max_length=200)),
                ('description', models.TextField(blank=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='reports/%Y/%m/')),
                ('image_url', models.URLField(blank=True, default='', max_length=1000)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('address', models.CharField(default='Nearby Civic Location', max_length=300)),
                ('zone', models.CharField(default='Zone 1 - Central', max_length=100)),
                ('severity', models.CharField(choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')], default='MEDIUM', max_length=20)),
                ('status', models.CharField(choices=[('REPORTED', 'Reported'), ('VERIFIED', 'Verified'), ('ASSIGNED', 'Assigned'), ('IN_PROGRESS', 'In Progress'), ('RESOLVED', 'Resolved'), ('CITIZEN_VERIFIED', 'Citizen Verified'), ('REOPENED', 'Reopened')], default='REPORTED', max_length=30)),
                ('priority_score', models.FloatField(default=20.0)),
                ('priority_level', models.CharField(default='MEDIUM', max_length=20)),
                ('priority_factors', models.JSONField(blank=True, default=list)),
                ('is_duplicate', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='reports', to='reports.wastecategory')),
                ('citizen', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='waste_reports', to=settings.AUTH_USER_MODEL)),
                ('duplicate_of', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='duplicates', to='reports.wastereport')),
            ],
            options={
                'ordering': ['-priority_score', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CitizenVerification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_resolved', models.BooleanField()),
                ('reopen_reason', models.CharField(blank=True, choices=[('WASTE_STILL_PRESENT', 'Waste still present'), ('WRONG_LOCATION', 'Wrong location'), ('INCOMPLETE_CLEANUP', 'Incomplete cleanup'), ('OTHER', 'Other')], default='', max_length=50)),
                ('feedback', models.TextField(blank=True, default='')),
                ('verified_at', models.DateTimeField(auto_now_add=True)),
                ('citizen', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('report', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='citizen_verification', to='reports.wastereport')),
            ],
        ),
    ]
