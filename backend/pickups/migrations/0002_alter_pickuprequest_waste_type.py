
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pickups', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='pickuprequest',
            name='waste_type',
            field=models.CharField(choices=[('HOUSEHOLD', 'Household Waste'), ('BULK', 'Bulk / Furniture Waste'), ('E_WASTE', 'Electronic Waste'), ('GARDEN', 'Garden / Pruning Waste'), ('CONSTRUCTION', 'Construction Waste'), ('HAZARDOUS', 'Hazardous Waste'), ('OTHER', 'Other Specialized Waste')], default='HOUSEHOLD', max_length=50),
        ),
    ]
