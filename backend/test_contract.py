from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from accounts.models import User
from reports.models import WasteCategory, WasteReport
from pickups.models import PickupRequest
from operations.models import TaskAssignment
from awareness.models import QuizQuestion


class ContractTestCase(TestCase):

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

    def test_staff_create_by_supervisor(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_supervisor', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/staff/', {
            'username': 'crew_rookie', 'password': 'worker1234', 'role': 'WORKER',
            'first_name': 'Rookie', 'phone': '+919999888877', 'zone': 'Zone 2 - South',
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['user']['role'], 'WORKER')
        summary = self.client.get('/api/operations/team-summary/').json()
        names = [w.get('username') or w.get('name') for w in summary['workers_status']]
        self.assertIn('crew_rookie', names)
        dup = self.client.post('/api/auth/staff/', {
            'username': 'crew_rookie', 'password': 'worker1234', 'role': 'WORKER',
        })
        self.assertEqual(dup.status_code, 400)

    def test_staff_create_forbidden_for_citizen(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_citizen', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/staff/', {
            'username': 'sneaky', 'password': 'worker1234', 'role': 'WORKER',
        })
        self.assertEqual(res.status_code, 403)

    def test_staff_create_admin_creates_supervisor(self):
        from accounts.models import User
        User.objects.create_user(username='contract_admin', password='secret123', role='ADMIN')
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_admin', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/staff/', {
            'username': 'crew_boss', 'password': 'boss12345', 'role': 'SUPERVISOR',
            'first_name': 'Boss',
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()['user']['role'], 'SUPERVISOR')
        self.client.credentials()
        login = self.client.post('/api/auth/login/', {'username': 'crew_boss', 'password': 'boss12345'})
        self.assertEqual(login.status_code, 200)

    def test_staff_create_supervisor_cannot_create_supervisor(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_supervisor', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/staff/', {
            'username': 'boss2', 'password': 'boss12345', 'role': 'SUPERVISOR',
        })
        self.assertEqual(res.status_code, 403)

    def test_staff_create_rejects_admin_role(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_supervisor', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/auth/staff/', {
            'username': 'boss', 'password': 'worker1234', 'role': 'ADMIN',
        })
        self.assertEqual(res.status_code, 400)

    def test_workers_list_is_bare_array(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_supervisor', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.get('/api/auth/workers/')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)
        self.assertTrue(any(w['role'] == 'WORKER' for w in res.json()))


    def test_profile_update_email(self):
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_citizen', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.patch('/api/auth/me/', {
            'email': 'real@citizen.com', 'phone': '+911234567890',
            'first_name': 'Real', 'role': 'ADMIN',
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['user']['email'], 'real@citizen.com')
        self.assertEqual(res.json()['user']['role'], 'CITIZEN')

    def test_profile_requires_auth(self):
        res = self.client.patch('/api/auth/me/', {'email': 'x@y.com'}, format='json')
        self.assertEqual(res.status_code, 401)


class NotificationContractTests(ContractTestCase):
    def _token(self, username):
        return self.client.post(
            '/api/auth/login/',
            {'username': username, 'password': 'secret123'},
        ).json()['token']

    def test_anonymous_blocked(self):
        self.assertEqual(self.client.get('/api/notifications/').status_code, 401)
        self.assertEqual(self.client.get('/api/notifications/unread-count/').status_code, 401)
        self.assertEqual(self.client.post('/api/notifications/mark-read/', {}).status_code, 401)

    def test_task_assign_notifies_worker_everywhere(self):
        token = self._token('contract_supervisor')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/operations/assign/', {
            'worker_id': self.worker.id, 'report_id': self.report.id,
        })
        self.assertEqual(res.status_code, 201)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self._token("contract_worker")}')
        count = self.client.get('/api/notifications/unread-count/').json()
        self.assertGreaterEqual(count['unread'], 1)
        rows = self.client.get('/api/notifications/').json()['results']
        self.assertTrue(any(r['kind'] == 'TASK_ASSIGNED' for r in rows))
        marked = self.client.post('/api/notifications/mark-read/', {}).json()
        self.assertGreaterEqual(marked['marked_read'], 1)
        count2 = self.client.get('/api/notifications/unread-count/').json()
        self.assertEqual(count2['unread'], 0)

    def test_report_submit_creates_citizen_notification(self):
        token = self._token('contract_citizen')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res = self.client.post('/api/reports/', {
            'title': 'Bin spill', 'description': 'spill near gate',
            'category': self.category.id, 'latitude': 28.63, 'longitude': 77.22,
            'address': 'Lane 5', 'severity': 'LOW',
        })
        self.assertEqual(res.status_code, 201)
        rows = self.client.get('/api/notifications/').json()['results']
        self.assertTrue(any(r['kind'] == 'REPORT_SUBMITTED' for r in rows))


    def test_location_and_address_required(self):
        base = {'title': 'No spot', 'description': 'x', 'category': self.category.id, 'severity': 'LOW'}
        no_addr = dict(base, latitude=28.63, longitude=77.22, address='')
        self.assertEqual(self.client.post('/api/reports/', no_addr).status_code, 400)
        no_coords = dict(base, address='Lane 5')
        self.assertEqual(self.client.post('/api/reports/', no_coords).status_code, 400)
        bad_coords = dict(base, address='Lane 5', latitude=999, longitude=77.22)
        self.assertEqual(self.client.post('/api/reports/', bad_coords).status_code, 400)


class ReportsContractTests(ContractTestCase):
    def test_report_list_lives_at_root(self):
        res = self.client.get('/api/reports/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        rows = data.get('results', data)
        self.assertEqual(len(rows), 1)
        self.assertIn('citizen_verification', rows[0])
        self.assertIn('category_details', rows[0])

    def test_every_issue_is_visible_to_a_citizen(self):
        for i in range(3):
            WasteReport.objects.create(
                citizen=None, category=self.category,
                title=f'Other resident issue {i}', latitude=28.64 + i * 0.001,
                longitude=77.22, address=f'Road {i}',
            )
        token = self.client.post(
            '/api/auth/login/',
            {'username': 'contract_citizen', 'password': 'secret123'},
        ).json()['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        rows = self.client.get('/api/reports/').json()['results']
        self.assertEqual(len(rows), 4)

        mine = self.client.get('/api/reports/?my_reports=1').json()['results']
        self.assertEqual(len(mine), 1)
        self.assertEqual(mine[0]['citizen'], self.citizen.pk)

    def test_uploaded_photo_gets_a_public_url(self):
        import io
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        buf = io.BytesIO()
        Image.new('RGB', (8, 8), (16, 185, 129)).save(buf, format='JPEG')
        res = self.client.post('/api/reports/', {
            'title': 'with photo', 'description': 'see image',
            'category': self.category.id, 'severity': 'LOW',
            'latitude': 28.65, 'longitude': 77.23, 'address': 'Photo Road',
            'image': SimpleUploadedFile('pile.jpg', buf.getvalue(),
                                        content_type='image/jpeg'),
        })
        self.assertEqual(res.status_code, 201, res.json())
        body = res.json()
        self.assertTrue(body['image'], 'image field should hold the stored URL')
        self.assertTrue(body['image_url'], 'image_url must be synced by save()')
        self.assertTrue(body['image_url'].startswith('http'))
        self.assertNotIn('X-Amz-Signature', body['image_url'],
                         'stored URLs must be stable, not presigned')
        self.assertEqual(body['image'], body['image_url'])

    def test_legacy_incidents_alias_still_works(self):
        res = self.client.get('/api/reports/incidents/')
        self.assertEqual(res.status_code, 200)

    def test_categories_bare_array(self):
        res = self.client.get('/api/reports/categories/')
        self.assertEqual(res.status_code, 200)
        self.assertIsInstance(res.json(), list)

    def test_check_duplicate_get_and_post(self):
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
        res = self.client.get('/api/analytics/overview/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        for key in ('resolved_reports_count', 'average_resolution_hours',
                    'active_reports', 'total_reports', 'resolution_rate'):
            self.assertIn(key, body)

    def test_cleanliness_index_returns_zones_array(self):
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
        for url in ('/api/analytics/transparency/', '/api/analytics/public/'):
            res = self.client.get(url)
            self.assertEqual(res.status_code, 200, url)
            body = res.json()
            self.assertIn('total_reports_count', body)
            self.assertIn('resolved_percentage', body)
            self.assertIn('summary', body)
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
        res = self.client.get('/api/ai/search/?q=critical unresolved')
        self.assertEqual(res.status_code, 200)
        self.assertIn('results', res.json())
        self.assertIsInstance(res.json()['results'], list)

    def test_nl_search_post_still_works(self):
        res = self.client.post('/api/ai/search/', {'query': 'show resolved'})
        self.assertEqual(res.status_code, 200)
        self.assertIn('results', res.json())

    def test_insights_exposes_summary(self):
        res = self.client.get('/api/ai/insights/')
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertIn('summary', body)
        self.assertTrue(body['summary'])
        self.assertIn('insights', body)
        self.assertIsInstance(body['insights'], list)
        self.assertIn('actions', body)
        self.assertIn('stats', body)
        for key in ('total_reports', 'active_reports', 'reports_this_week',
                    'avg_resolution_hours', 'overdue_reports', 'top_category'):
            self.assertIn(key, body['stats'])

    def test_insights_are_cached_for_15_minutes(self):
        from django.core.cache import cache
        from ai_service.views import INSIGHTS_CACHE_KEY
        cache.delete(INSIGHTS_CACHE_KEY)
        first = self.client.get('/api/ai/insights/').json()
        second = self.client.get('/api/ai/insights/').json()
        self.assertFalse(first['cached'])
        self.assertTrue(second['cached'])
        self.assertEqual(first['summary'], second['summary'])

    def test_classify_with_uploaded_photo(self):
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
