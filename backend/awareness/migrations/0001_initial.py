
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='CollectionPoint',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('latitude', models.FloatField()),
                ('longitude', models.FloatField()),
                ('address', models.CharField(max_length=300)),
                ('zone', models.CharField(default='Zone 1 - Central', max_length=100)),
                ('bin_type', models.CharField(default='Dual Organic & Recyclable Hub', max_length=100)),
                ('fill_level', models.IntegerField(default=45)),
                ('is_active', models.BooleanField(default=True)),
                ('last_cleared_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='QuizQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('question', models.CharField(max_length=300)),
                ('options', models.JSONField(default=list)),
                ('correct_option_index', models.IntegerField(default=0)),
                ('explanation', models.TextField()),
                ('difficulty', models.CharField(default='Medium', max_length=20)),
            ],
        ),
        migrations.CreateModel(
            name='WasteStreamGuide',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(max_length=100, unique=True)),
                ('color', models.CharField(default='#10B981', max_length=30)),
                ('icon', models.CharField(default='recycle', max_length=50)),
                ('description', models.TextField()),
                ('what_belongs', models.JSONField(default=list)),
                ('what_does_not', models.JSONField(default=list)),
                ('disposal_tips', models.TextField()),
                ('order', models.IntegerField(default=0)),
            ],
            options={
                'ordering': ['order', 'name'],
            },
        ),
    ]
