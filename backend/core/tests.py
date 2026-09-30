from django.test import TestCase
from accounts.models import User
from reports.models import WasteCategory, WasteReport, CitizenVerification
from hotspots.models import Hotspot
from core.priority import calculate_priority
from core.geo import haversine_distance

class SwachDrishtiCoreTests(TestCase):
    def setUp(self):
        self.category = WasteCategory.objects.create(
            name='Overflowing bin',
            slug='overflowing-bin',
            icon='trash'
        )
        self.citizen = User.objects.create_user(
            username='test_citizen',
            email='citizen@test.com',
            password='password123',
            role=User.ROLE_CITIZEN
        )

    def test_explainable_priority_calculation(self):
        score, level, factors = calculate_priority(
            severity='CRITICAL',
            nearby_reports_count=4,
            age_in_hours=6.0,
            is_recurring_hotspot=True,
            is_sensitive_context=True
        )
        
        self.assertEqual(score, 111.0)
        self.assertEqual(level, 'CRITICAL')
        self.assertTrue(any('nearby reports' in f for f in factors))
        self.assertTrue(any('Recurring waste hotspot' in f for f in factors))
        self.assertTrue(any('Unresolved for 6 hours' in f for f in factors))

    def test_haversine_distance_calculation(self):
        lat1, lon1 = 28.6280, 77.2180
        lat2, lon2 = 28.6290, 77.2180
        dist = haversine_distance(lat1, lon1, lat2, lon2)
        self.assertAlmostEqual(dist, 111.2, delta=2.0)

    def test_report_creation_and_auto_priority(self):
        report = WasteReport.objects.create(
            citizen=self.citizen,
            category=self.category,
            title='Overflowing bin at market corner',
            latitude=28.6280,
            longitude=77.2180,
            address='Main Market Gate 1',
            severity='HIGH'
        )
        report.update_priority(nearby_count=2, age_hours=0.0, is_recurring=False)
        self.assertGreater(report.priority_score, 0)
        self.assertEqual(report.status, 'REPORTED')
        self.assertIn(report.priority_level, ['MEDIUM', 'HIGH', 'CRITICAL'])

    def test_citizen_verification_flow(self):
        report = WasteReport.objects.create(
            citizen=self.citizen,
            category=self.category,
            title='Dumped bags',
            latitude=28.6280,
            longitude=77.2180,
            status='RESOLVED'
        )
        
        verif = CitizenVerification.objects.create(
            report=report,
            citizen=self.citizen,
            is_resolved=True,
            feedback='Cleaned nicely!'
        )
        self.assertTrue(verif.is_resolved)
        self.assertEqual(report.citizen_verification, verif)
