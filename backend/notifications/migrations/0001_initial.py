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
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('kind', models.CharField(choices=[('REPORT_SUBMITTED', 'Report submitted'), ('VERIFICATION_REQUIRED', 'Verification required'), ('VERIFIED_CLOSED', 'Report closed'), ('REOPENED', 'Report reopened'), ('TASK_ASSIGNED', 'Task assigned'), ('PICKUP_UPDATE', 'Pickup update'), ('STAFF_CREATED', 'Staff account created'), ('GENERAL', 'General')], default='GENERAL', max_length=40)),
                ('title', models.CharField(max_length=200)),
                ('body', models.TextField(blank=True, default='')),
                ('link', models.CharField(blank=True, default='', max_length=200)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
