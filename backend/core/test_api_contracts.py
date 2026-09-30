from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from accounts.models import User
from reports.models import WasteCategory, WasteReport, CitizenVerification
from hotspots.models import Hotspot
from pickups.models import PickupRequest
from operations.models import TaskAssignment
from awareness.models import WasteStreamGuide, QuizQuestion, CollectionPoint
from analytics.models import AreaCleanlinessIndex

class APIContractTestSuite(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.citizen = User.objects.create_user(
            username='contract_citizen',
            email='citizen@contract.test',
            password='password123',
            role=User.ROLE_CITIZEN,
            zone='Zone 1 - Central'
        )
        self.worker = User.objects.create_user(
            username='contract_worker',
            email='worker@contract.test',
            password='password123',
            role=User.ROLE_WORKER,
            zone='Zone 1 - Central'
        )
        self.supervisor = User.objects.create_user(
            username='contract_supervisor',
            email='supervisor@contract.test',
            password='password123',
            role=User.ROLE_SUPERVISOR,
            zone='Zone 1 - Central'
        )
        self.admin = User.objects.create_user(
            username='contract_admin',
            email='admin@contract.test',
            password='password123',
            role=User.ROLE_ADMIN
        )

        self.category = WasteCategory.objects.create(
            name='Overflowing bin',
            slug='overflowing-bin',
            icon='trash'
        )

        self.report = WasteReport.objects.create(
            citizen=self.citizen,
            category=self.category,
            title='Contract Test Overflowing Bin',
            description='Test heap near market',
            latitude=28.6280,
            longitude=77.2180,
            address='Connaught Place Market',
            zone='Zone 1 - Central',
            severity='HIGH',
            status='REPORTED'
        )

        self.hotspot = Hotspot.objects.create(
            name='CP Market Hotspot',
            latitude=28.6280,
            longitude=77.2180,
            radius_meters=100.0,
            status='ACTIVE'
        )

        self.quiz = QuizQuestion.objects.create(
            question='Which bin does fruit peel go to?',
            options=['Green Bin', 'Blue Bin', 'Red Bin'],
            correct_option_index=0,
            explanation='Fruit peels are organic wet waste for composting.',
            difficulty='EASY'
        )

        self.guide = WasteStreamGuide.objects.create(
            name='Organic Waste',
            slug='organic-waste',
            color='#10B981',
            description='Compostable items only',
            disposal_tips='Rinse and compost'
        )
        self.point = CollectionPoint.objects.create(
            name='Smart Depot 1',
            code='CP01',
            address='Block A, CP',
            latitude=28.6280,
            longitude=77.2180
        )

    def test_auth_demo_login_and_current_user(self):
        res = self.client.post('/api/auth/demo-login/', {'role': 'citizen'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('token', res.data)
        self.assertIn('user', res.data)

        token = res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        me_res = self.client.get('/api/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertIn('user', me_res.data)

        work_res = self.client.get('/api/auth/workers/')
        self.assertEqual(work_res.status_code, status.HTTP_200_OK)
        self.client.credentials()

    def test_reports_list_and_create_contract(self):
        res = self.client.get('/api/reports/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        post_data = {
            'title': 'New street garbage',
            'description': 'Plastic bottles on curb',
            'category': self.category.id,
            'severity': 'MEDIUM',
            'latitude': 28.6285,
            'longitude': 77.2185,
            'address': 'Radial Road 1, CP'
        }
        res_post = self.client.post('/api/reports/', post_data, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)
        self.assertIn('citizen_verification', res_post.data)
        self.assertIn('verification', res_post.data)

        cat_res = self.client.get('/api/reports/categories/')
        self.assertEqual(cat_res.status_code, status.HTTP_200_OK)

    def test_duplicate_check_contract_get_and_post(self):
        get_res = self.client.get(
            f'/api/reports/check-duplicate/?latitude={self.report.latitude}&longitude={self.report.longitude}&radius_meters=100'
        )
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertTrue(get_res.data.get('has_duplicate'))
        self.assertIn('existing_reports', get_res.data)
        self.assertIn('nearby_incidents', get_res.data)
        self.assertGreater(len(get_res.data['existing_reports']), 0)

        post_res = self.client.post(
            '/api/reports/check-duplicate/',
            {'latitude': self.report.latitude, 'longitude': self.report.longitude, 'radius_meters': 100},
            format='json'
        )
        self.assertEqual(post_res.status_code, status.HTTP_200_OK)
        self.assertTrue(post_res.data.get('has_duplicate'))

    def test_citizen_verification_contract(self):
        self.report.status = 'RESOLVED'
        self.report.save()

        res = self.client.post(
            f'/api/reports/{self.report.id}/verify/',
            {'is_resolved': True, 'feedback': 'Clean and spotless!'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('verification', res.data)
        self.assertIn('citizen_verification', res.data)
        self.assertEqual(res.data['report_status'], 'CITIZEN_VERIFIED')

    def test_pickups_contract(self):
        payload = {
            'waste_type': 'BULK',
            'estimated_volume': 'MEDIUM',
            'latitude': 28.6300,
            'longitude': 77.2200,
            'address': 'House 12, Janpath',
            'preferred_time': 'Tomorrow Morning (9 AM - 12 PM)',
            'citizen': self.citizen.id
        }
        res = self.client.post('/api/pickups/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['preferred_slot'], 'Tomorrow Morning (9 AM - 12 PM)')

        list_res = self.client.get('/api/pickups/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)

    def test_hotspots_contract(self):
        res = self.client.get('/api/hotspots/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_analytics_endpoints_and_transparency(self):
        ov = self.client.get('/api/analytics/overview/')
        self.assertEqual(ov.status_code, status.HTTP_200_OK)
        self.assertIn('resolved_reports_count', ov.data)
        self.assertIn('average_resolution_hours', ov.data)

        cl = self.client.get('/api/analytics/cleanliness-index/')
        self.assertEqual(cl.status_code, status.HTTP_200_OK)
        self.assertIn('zones', cl.data)
        self.assertIn('results', cl.data)
        self.assertIsInstance(cl.data['zones'], list)
        if len(cl.data['zones']) > 0:
            self.assertIn('ward_name', cl.data['zones'][0])
            self.assertIn('resolution_rate', cl.data['zones'][0])

        charts = self.client.get('/api/analytics/charts/')
        self.assertEqual(charts.status_code, status.HTTP_200_OK)
        self.assertIn('trend', charts.data)
        self.assertIn('categories', charts.data)

        pub = self.client.get('/api/analytics/public/')
        self.assertEqual(pub.status_code, status.HTTP_200_OK)
        self.assertIn('reports', pub.data)

        trans = self.client.get('/api/analytics/transparency/')
        self.assertEqual(trans.status_code, status.HTTP_200_OK)
        self.assertIn('reports', trans.data)

    def test_ai_service_contract_classify_search_insights(self):
        classify_res = self.client.post('/api/ai/classify/', {
            'text': 'Piles of empty plastic mineral water bottles blocking road',
            'latitude': 28.6280,
            'longitude': 77.2180
        }, format='json')
        self.assertEqual(classify_res.status_code, status.HTTP_200_OK)
        self.assertIn('suggested_severity', classify_res.data)
        self.assertIn('suggested_category_name', classify_res.data)
        self.assertIn('category', classify_res.data)
        self.assertIn('severity', classify_res.data)

        search_get = self.client.get('/api/ai/search/?q=overflowing+bin+in+market')
        self.assertEqual(search_get.status_code, status.HTTP_200_OK)
        self.assertIn('results', search_get.data)
        self.assertIn('report_ids', search_get.data)

        search_post = self.client.post('/api/ai/search/', {'query': 'high priority incidents'}, format='json')
        self.assertEqual(search_post.status_code, status.HTTP_200_OK)
        self.assertIn('results', search_post.data)

        insights_res = self.client.get('/api/ai/insights/')
        self.assertEqual(insights_res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', insights_res.data)
        self.assertIn('insights', insights_res.data)

    def test_awareness_and_quiz_check_contract(self):
        self.assertEqual(self.client.get('/api/awareness/streams/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('/api/awareness/guides/').status_code, status.HTTP_200_OK)

        self.assertEqual(self.client.get('/api/awareness/points/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('/api/awareness/collection-points/').status_code, status.HTTP_200_OK)

        q_list = self.client.get('/api/awareness/quiz/')
        self.assertEqual(q_list.status_code, status.HTTP_200_OK)
        questions = q_list.data.get('results', q_list.data)
        self.assertNotIn('correct_option_index', questions[0])

        check_res = self.client.post(
            f'/api/awareness/quiz/{self.quiz.id}/check/',
            {'selected_option_index': 0},
            format='json'
        )
        self.assertEqual(check_res.status_code, status.HTTP_200_OK)
        self.assertTrue(check_res.data['is_correct'])
        self.assertIn('explanation', check_res.data)

    def test_operations_tasks_and_team_summary_contract(self):
        sum_res = self.client.get('/api/operations/team-summary/')
        self.assertEqual(sum_res.status_code, status.HTTP_200_OK)
        self.assertIn('total_workers', sum_res.data)
        self.assertIn('in_progress_tasks', sum_res.data)
        self.assertIn('workers_status', sum_res.data)

        assign_res = self.client.post('/api/operations/assign/', {
            'report_id': self.report.id,
            'worker_id': self.worker.id,
            'notes': 'Clear quickly'
        }, format='json')
        self.assertEqual(assign_res.status_code, status.HTTP_201_CREATED)
        task_id = assign_res.data['assignment']['id']

        tasks_res = self.client.get('/api/operations/tasks/')
        self.assertEqual(tasks_res.status_code, status.HTTP_200_OK)
        task_data = tasks_res.data[0] if isinstance(tasks_res.data, list) else tasks_res.data['results'][0]
        self.assertIn('report_details', task_data)
        self.assertEqual(task_data['report_details']['id'], self.report.id)

        trans_res = self.client.post(
            f'/api/operations/tasks/{task_id}/transition/',
            {'status': 'IN_PROGRESS'},
            format='json'
        )
        self.assertEqual(trans_res.status_code, status.HTTP_200_OK)
        self.assertEqual(trans_res.data['task']['status'], 'IN_PROGRESS')
