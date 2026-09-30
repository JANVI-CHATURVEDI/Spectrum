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
        """
        Verify that priority calculation produces expected deterministic scores,
        levels, and explainable factors.
        """
        # Scenario: CRITICAL severity, 4 nearby reports, 6 hours old, recurring hotspot
        score, level, factors = calculate_priority(
            severity='CRITICAL',
            nearby_reports_count=4,
            age_in_hours=6.0,
            is_recurring_hotspot=True,
            is_sensitive_context=True
        )
        
        # Expected:
        # 40 (Critical) + min(4*8, 32)=32 + min(6*1.5, 24)=9 + 20 (recurring) + 10 (context) = 111.0
        self.assertEqual(score, 111.0)
        self.assertEqual(level, 'CRITICAL')
        self.assertTrue(any('nearby reports' in f for f in factors))
        self.assertTrue(any('Recurring waste hotspot' in f for f in factors))
        self.assertTrue(any('Unresolved for 6 hours' in f for f in factors))

    def test_haversine_distance_calculation(self):
        """
        Verify that geo distance accurately computes distance between nearby coordinates.
        """
        # ~111 meters per 0.001 degree latitude
        lat1, lon1 = 28.6280, 77.2180
        lat2, lon2 = 28.6290, 77.2180
        dist = haversine_distance(lat1, lon1, lat2, lon2)
        self.assertAlmostEqual(dist, 111.2, delta=2.0)

    def test_report_creation_and_auto_priority(self):
        """
        Verify creating a WasteReport automatically computes priority and links category.
        """
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
        """
        Verify citizen can confirm resolution or reopen with reason.
        """
        report = WasteReport.objects.create(
            citizen=self.citizen,
            category=self.category,
            title='Dumped bags',
            latitude=28.6280,
            longitude=77.2180,
            status='RESOLVED'
        )
        
        # Verify resolution
        verif = CitizenVerification.objects.create(
            report=report,
            citizen=self.citizen,
            is_resolved=True,
            feedback='Cleaned nicely!'
        )
        self.assertTrue(verif.is_resolved)
        self.assertEqual(report.citizen_verification, verif)
