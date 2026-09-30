"""
API contract tests - one per endpoint the React frontend actually calls.

These exist so a frontend/backend contract drift (wrong URL, wrong method,
wrong response key) fails CI instead of failing during a live demo.

Run: python manage.py test test_contract
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from reports.models import WasteCategory, WasteReport
from pickups.models import PickupRequest
from operations.models import TaskAssignment
from awareness.models import QuizQuestion


class ContractTestCase(TestCase):
    """Shared fixtures for every contract test."""

    @classmethod
    def setUpTestData(cls):
        cls.category = WasteCategory.objects.create(
            name='Overflowing bin', slug='overflowing-bin', icon='trash'
        )
        cls.citizen = User.objects.create_user(
            username='contract_citizen', password='secret123',
            email='c@test.com', role=User.ROLE_CITIZEN,
        )
        cls.worker = User.objects.create_user(
            username='contract_worker', password='secret123',
            role=User.ROLE_WORKER, zone='Zone 1 - Central',
        )
        cls.supervisor = User.objects.create_user(
            username='contract_supervisor', password='secret123',
            role=User.ROLE_SUPERVISOR,
        )
        cls.report = WasteReport.objects.create(
            citizen=cls.citizen, category=cls.category,
            title='Overflowing dumpster', description='Pile up near park',
            latitude=28.6280, longitude=77.2180,
            address='Near Metro Pillar 42', severity='HIGH',
        )
        cls.quiz = QuizQuestion.objects.create(
            question='Where does plastic go?',
            options=['Green bin', 'Blue bin', 'Red bin'],
            correct_option_index=1,
            explanation='Plastic is dry recyclable waste.',
        )

    def setUp(self):
        self.client = APIClient()


class HealthTests(ContractTestCase):
    def test_health(self):
        res = self.client.get('/health/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['status'], 'ok')


class AuthContractTests(ContractTestCase):
    def test_register(self):
        res = self.client.post('/api/auth/register/', {
            'username': 'newbie', 'password': 'secret123',
            'email': 'n@test.com', 'role': 'CITIZEN',
        })
        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.json())
        self.assertIn('user', res.json())

    def test_login(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'contract_citizen', 'password': 'secret123',
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.json())

    def test_demo_login(self):
        res = self.client.post('/api/auth/demo-login/', {'role': 'citizen'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['user']['role'], 'CITIZEN')

    def test_me_requires_token_then_returns_user(self):
        self.assertEqual(self.client.get('/api/auth/me/').status_code, 401)
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_citizen', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/auth/me/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['user']['username'], 'contract_citizen')

    def test_workers_list_is_bare_array(self):
        """Navbar/SupervisorDashboard does `workRes.data || []` - no pagination wrapper."""
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_supervisor', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/auth/workers/')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)
        self.assertTrue(any(w['role'] == 'WORKER' for w in res.json()))


class ReportsContractTests(ContractTestCase):
    def test_report_list_lives_at_root(self):
        """Frontend calls GET /api/reports/ (not /api/reports/incidents/)."""
        res = self.client.get('/api/reports/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        rows = data.get('results', data)
        self.assertEqual(len(rows), 1)
        self.assertIn('citizen_verification', rows[0])
        self.assertIn('category_details', rows[0])

    def test_legacy_incidents_alias_still_works(self):
        res = self.client.get('/api/reports/incidents/')
        self.assertEqual(res.status_code, 200)

    def test_categories_bare_array(self):
        res = self.client.get('/api/reports/categories/')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_check_duplicate_get_and_post(self):
        """Frontend uses GET with query params; response key is nearby_incidents."""
        for res in (
            self.client.get('/api/reports/check-duplicate/?latitude=28.628&longitude=77.218'),
            self.client.post('/api/reports/check-duplicate/', {
                'latitude': 28.628, 'longitude': 77.218,
            }),
        ):
            self.assertEqual(res.status_code, 200)
            body = res.json()
            self.assertIn('has_duplicate', body)
            self.assertIn('nearby_incidents', body)
        self.assertTrue(self.client.get(
            '/api/reports/check-duplicate/?latitude=28.628&longitude=77.218'
        ).json()['has_duplicate'])

    def test_create_report(self):
        res = self.client.post('/api/reports/', {
            'title': 'New pile', 'description': 'smelly',
            'category': self.category.id, 'severity': 'MEDIUM',
            'latitude': 28.63, 'longitude': 77.22,
            'address': 'Test Road',
        })
        self.assertEqual(res.status_code, 201, res.json())
        body = res.json()
        self.assertIn(body['priority_level'], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

    def test_citizen_verification_endpoint(self):
        WasteReport.objects.filter(pk=self.report.pk).update(status='RESOLVED')
        res = self.client.post(f'/api/reports/{self.report.pk}/verify/', {
            'is_resolved': True, 'feedback': 'clean!',
        })
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body['report_status'], 'CITIZEN_VERIFIED')
        self.assertIn('verification', body)


class PickupsContractTests(ContractTestCase):
    def test_pickup_list(self):
        PickupRequest.objects.create(
            citizen=self.citizen, waste_type='BULK',
            address='12 Main St', latitude=28.6, longitude=77.2,
            preferred_slot='Morning (9:00 AM - 12:00 PM)',
        )
        res = self.client.get('/api/pickups/')
        self.assertEqual(res.status_code, 200)
        rows = res.json().get('results', res.json())
        self.assertEqual(rows[0]['preferred_slot'], 'Morning (9:00 AM - 12:00 PM)')

    def test_create_pickup_with_preferred_slot(self):
        res = self.client.post('/api/pickups/', {
            'waste_type': 'E_WASTE', 'estimated_volume': 'MEDIUM',
            'address': '9 Elm Street', 'latitude': 28.61, 'longitude': 77.23,
            'preferred_slot': 'Tomorrow Morning (9 AM - 12 PM)',
        })
        self.assertEqual(res.status_code, 201, res.json())
        self.assertEqual(
            res.json()['preferred_slot'], 'Tomorrow Morning (9 AM - 12 PM)'
        )

    def test_anonymous_pickup_never_500s(self):
        """PickupRequest.citizen is NOT NULL - anonymous create must not IntegrityError."""
        PickupRequest.objects.all().delete()
        res = self.client.post('/api/pickups/', {
            'waste_type': 'BULK', 'address': 'Nowhere', 'latitude': 1.0,
            'longitude': 1.0, 'preferred_slot': 'Anytime',
        })
        self.assertEqual(res.status_code, 201, res.json())


class HotspotsContractTests(ContractTestCase):
    def test_hotspot_list(self):
        res = self.client.get('/api/hotspots/')
        self.assertEqual(res.status_code, 200)
        res.json().get('results', res.json())

    def test_detect_hotspots(self):
        res = self.client.post('/api/hotspots/detect/', {'radius_meters': 150})
        self.assertEqual(res.status_code, 200)
        self.assertIn('total_active_hotspots', res.json())


class OperationsContractTests(ContractTestCase):
    def setUp(self):
        super().setUp()
        self.task = TaskAssignment.objects.create(
            worker=self.worker, report=self.report, status='ASSIGNED',
        )

    def test_task_list_exposes_nested_report_details(self):
        """WorkerDashboard reads task.report_details (not the bare FK id)."""
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_worker', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/operations/tasks/')
        self.assertEqual(res.status_code, 200)
        rows = res.json().get('results', res.json())
        self.assertEqual(rows[0]['report_details']['title'], 'Overflowing dumpster')
        self.assertIn('pickup_details', rows[0])

    def test_assign_task(self):
        res = self.client.post('/api/operations/assign/', {
            'worker_id': self.worker.id, 'report_id': self.report.pk,
        })
        self.assertEqual(res.status_code, 201, res.json())
        self.assertIn('assignment', res.json())
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'ASSIGNED')

    def test_task_transition(self):
        res = self.client.post(
            f'/api/operations/tasks/{self.task.pk}/transition/',
            {'status': 'IN_PROGRESS'},
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['task']['status'], 'IN_PROGRESS')

    def test_team_summary_shape(self):
        """SupervisorDashboard reads total_workers / in_progress_tasks / workers_status."""
        res = self.client.get('/api/operations/team-summary/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        for key in ('total_workers', 'in_progress_tasks', 'workers_status', 'team', 'summary'):
            self.assertIn(key, body)
        self.assertGreaterEqual(body['total_workers'], 1)
        entry = body['workers_status'][0]
        for key in ('id', 'name', 'username', 'ward', 'active_tasks_count'):
            self.assertIn(key, entry)


class AnalyticsContractTests(ContractTestCase):
    def test_overview_aliases(self):
        """AdminDashboard reads resolved_reports_count / average_resolution_hours."""
        res = self.client.get('/api/analytics/overview/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        for key in ('resolved_reports_count', 'average_resolution_hours',
                    'active_reports', 'total_reports', 'resolution_rate'):
            self.assertIn(key, body)

    def test_cleanliness_index_returns_zones_array(self):
        """AdminDashboard does data.zones and reads ward_name / resolution_rate."""
        res = self.client.get('/api/analytics/cleanliness-index/')
        self.assertEqual(res.status_code, 200)
        zones = res.json()['zones']
        self.assertIsInstance(zones, list)
        self.assertGreater(len(zones), 0)
        self.assertIn('ward_name', zones[0])
        self.assertIn('resolution_rate', zones[0])
        self.assertTrue(zones[0]['resolution_rate'].endswith('%'))

    def test_charts(self):
        res = self.client.get('/api/analytics/charts/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('trend', res.json())
        self.assertIn('categories', res.json())

    def test_transparency_alias_and_flat_keys(self):
        """PublicTransparency reads /api/analytics/transparency/ + flat counters."""
        for url in ('/api/analytics/transparency/', '/api/analytics/public/'):
            res = self.client.get(url)
            self.assertEqual(res.status_code, 200, url)
            body = res.json()
            self.assertIn('total_reports_count', body)
            self.assertIn('resolved_percentage', body)
            self.assertIn('summary', body)
            # PII must never appear in the public payload
            self.assertNotIn('citizen_details', str(body))
            self.assertNotIn('email', str(body))


class AwarenessContractTests(ContractTestCase):
    def test_guides_alias(self):
        res = self.client.get('/api/awareness/guides/')
        self.assertEqual(res.status_code, 200)
        res.json().get('results', res.json())

    def test_quiz_hides_answer_and_check_endpoint_works(self):
        res = self.client.get('/api/awareness/quiz/')
        self.assertEqual(res.status_code, 200)
        rows = res.json().get('results', res.json())
        self.assertNotIn('correct_option_index', rows[0])

        wrong = self.client.post(
            f'/api/awareness/quiz/{self.quiz.pk}/check/',
            {'selected_option_index': 0},
        )
        self.assertEqual(wrong.status_code, 200)
        self.assertFalse(wrong.json()['is_correct'])
        self.assertEqual(wrong.json()['correct_option_index'], 1)

        right = self.client.post(
            f'/api/awareness/quiz/{self.quiz.pk}/check/',
            {'selected_option_index': 1},
        )
        self.assertTrue(right.json()['is_correct'])

    def test_collection_points_alias(self):
        res = self.client.get('/api/awareness/collection-points/')
        self.assertEqual(res.status_code, 200)
        res.json().get('results', res.json())


class AIContractTests(ContractTestCase):
    def test_classify_accepts_text_and_returns_both_key_styles(self):
        """Frontend posts {text} and reads suggested_severity / suggested_category_name."""
        res = self.client.post('/api/ai/classify/', {
            'text': 'huge overflowing dustbin blocking the road with foul stench',
            'latitude': 28.6, 'longitude': 77.2,
        })
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('suggested_severity', body)
        self.assertIn('suggested_category_name', body)
        self.assertIn('severity', body)
        self.assertIn('category', body)
        self.assertIn(body['suggested_severity'], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

    def test_nl_search_get_with_q(self):
        """AdminDashboard does GET /api/ai/search/?q=... and reads .results."""
        res = self.client.get('/api/ai/search/?q=critical unresolved')
        self.assertEqual(res.status_code, 200)
        self.assertIn('results', res.json())
        self.assertIsInstance(res.json()['results'], list)

    def test_nl_search_post_still_works(self):
        res = self.client.post('/api/ai/search/', {'query': 'show resolved'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('results', res.json())

    def test_insights_exposes_summary(self):
        """AdminDashboard reads aiInsights.summary."""
        res = self.client.get('/api/ai/insights/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('summary', body)
        self.assertTrue(body['summary'])
        self.assertIn('insights', body)
        self.assertIsInstance(body['insights'], list)
        self.assertIn('actions', body)
        self.assertIn('stats', body)
        # Recommendations must cite real aggregated numbers, not lorem ipsum
        for key in ('total_reports', 'active_reports', 'reports_this_week',
                    'avg_resolution_hours', 'overdue_reports', 'top_category'):
            self.assertIn(key, body['stats'])

    def test_insights_are_cached_for_15_minutes(self):
        first = self.client.get('/api/ai/insights/').json()
        second = self.client.get('/api/ai/insights/').json()
        self.assertFalse(first['cached'])
        self.assertTrue(second['cached'])
        self.assertEqual(first['summary'], second['summary'])

    def test_classify_with_uploaded_photo(self):
        """Multipart classify (photo triage) must degrade gracefully."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        image = SimpleUploadedFile('pile.jpg', b'\xff\xd8\xff\xe0notreallyajpeg',
                                   content_type='image/jpeg')
        res = self.client.post('/api/ai/classify/', {
            'text': 'overflowing dustbin near the market',
            'image': image,
        })
        self.assertEqual(res.status_code, 200, res.json())
        body = res.json()
        self.assertIn('suggested_severity', body)
        self.assertIn('hazard_flags', body)
        self.assertIn('estimated_volume', body)
        self.assertIn('ai_suggested', body)
        self.assertIn('source', body)

    def test_verify_cleanup_endpoint(self):
        """Supervisor before/after audit returns a 0-100 score, never a 500."""
        res = self.client.post('/api/ai/verify-cleanup/', {
            'report_id': self.report.pk,
            'notes': 'removed the entire pile and swept the footpath clean',
        })
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('cleanup_score', body)
        self.assertTrue(0 <= body['cleanup_score'] <= 100)
        self.assertIn('verified', body)
        self.assertIn('verdict', body)
        self.assertIn('source', body)

    def test_forecast_never_needs_the_llm(self):
        """Forecast is pure maths - it must work with no API key at all."""
        res = self.client.get('/api/ai/forecast/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('forecasts', body)
        self.assertIn('likely_count', body)
        self.assertIn('method', body)
        self.assertIsInstance(body['forecasts'], list)
        for f in body['forecasts']:
            for key in ('risk_score', 'explanation', 'recommendation',
                        'open_reports', 'likely_to_overflow'):
                self.assertIn(key, f)
            self.assertTrue(f['explanation'])


class IncidentsContractTests(ContractTestCase):
    def test_cluster_list(self):
        res = self.client.get('/api/incidents/clusters/')
        self.assertEqual(res.status_code, 200)

    def test_evidence_submit(self):
        res = self.client.post('/api/incidents/evidence/submit/', {
            'report_id': self.report.pk,
            'notes': 'cleared everything',
        })
        self.assertEqual(res.status_code, 201, res.json())
        self.report.refresh_from_db()
        self.assertEqual(self.report.status, 'RESOLVED')

    def test_evidence_submit_does_not_complete_unrelated_tasks(self):
        """report_id given + incident_id omitted must not close other NULL-incident tasks."""
        other_report = WasteReport.objects.create(
            category=self.category, title='other', latitude=1.0, longitude=1.0,
            address='Elsewhere',
        )
        bystander = TaskAssignment.objects.create(
            worker=self.worker, report=other_report, status='ASSIGNED',
        )
        self.client.post('/api/incidents/evidence/submit/', {
            'report_id': self.report.pk,
        })
        bystander.refresh_from_db()
        self.assertEqual(bystander.status, 'ASSIGNED')
