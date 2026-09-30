"""Backfill correct public URLs for report photos.

Early revisions of WasteReport.save() resolved ``image.url`` before the
uploaded file was stored, persisting bucket-root URLs built from the raw
client filename. This migration recomputes both photo URLs from the stored
files and cascades the fix to Evidence rows that copied the bad values.
"""

from django.db import migrations


def resync_image_urls(apps, schema_editor):
    WasteReport = apps.get_model('reports', 'WasteReport')
    Evidence = apps.get_model('incidents', 'Evidence')

    for rep in WasteReport.objects.all():
        updates = {}
        for file_attr, url_attr in (('image', 'image_url'),
                                    ('after_image', 'after_image_url')):
            fh = getattr(rep, file_attr)
            if not fh:
                continue
            try:
                correct = fh.url
            except Exception:
                continue
            old = getattr(rep, url_attr) or ''
            if old and old != correct:
                updates[url_attr] = correct
                if url_attr == 'image_url':
                    Evidence.objects.filter(
                        report_id=rep.pk, before_image_url=old
                    ).update(before_image_url=correct)
                else:
                    Evidence.objects.filter(
                        report_id=rep.pk, after_image_url=old
                    ).update(after_image_url=correct)
        if updates:
            WasteReport.objects.filter(pk=rep.pk).update(**updates)


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0002_wastereport_after_image_wastereport_after_image_url_and_more'),
        ('incidents', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(resync_image_urls, migrations.RunPython.noop),
    ]
