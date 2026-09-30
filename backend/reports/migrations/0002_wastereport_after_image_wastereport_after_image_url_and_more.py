
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='wastereport',
            name='after_image',
            field=models.ImageField(blank=True, null=True, upload_to='reports/after/%Y/%m/'),
        ),
        migrations.AddField(
            model_name='wastereport',
            name='after_image_url',
            field=models.URLField(blank=True, default='', max_length=1000),
        ),
        migrations.AddField(
            model_name='wastereport',
            name='cleanup_score',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='wastereport',
            name='cleanup_verdict',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.AddField(
            model_name='wastereport',
            name='cleanup_verified',
            field=models.BooleanField(default=False),
        ),
    ]
