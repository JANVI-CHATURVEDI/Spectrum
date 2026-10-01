import os
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from reports.models import WasteCategory, WasteReport, CitizenVerification
from incidents.models import Incident, Evidence
from hotspots.models import Hotspot
from pickups.models import PickupRequest
from operations.models import TaskAssignment
from awareness.models import WasteStreamGuide, QuizQuestion, CollectionPoint
from analytics.models import AreaCleanlinessIndex

class Command(BaseCommand):
    help = 'Seeds realistic municipal demo data for SwachDrishti civic platform'

    def handle(self, *args, **options):
        self.stdout.write("Starting SwachDrishti seed demo data process...")

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@swachdrishti.gov',
                'first_name': 'Chief Executive',
                'last_name': 'Admin',
                'role': User.ROLE_ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'zone': 'Citywide Headquarters'
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        supervisor_user, _ = User.objects.get_or_create(
            username='supervisor',
            defaults={
                'email': 'supervisor@swachdrishti.gov',
                'first_name': 'Vikram',
                'last_name': 'Singh',
                'role': User.ROLE_SUPERVISOR,
                'phone': '+91 98110 23456',
                'zone': 'Zone 1 - Central'
            }
        )
        supervisor_user.set_password('supervisor123')
        supervisor_user.save()

        worker1, _ = User.objects.get_or_create(
            username='worker',
            defaults={
                'email': 'worker@swachdrishti.gov',
                'first_name': 'Ramesh',
                'last_name': 'Kumar',
                'role': User.ROLE_WORKER,
                'phone': '+91 98765 43210',
                'zone': 'Zone 1 - Central Route 4'
            }
        )
        worker1.set_password('worker123')
        worker1.save()

        worker2, _ = User.objects.get_or_create(
            username='worker2',
            defaults={
                'email': 'worker2@swachdrishti.gov',
                'first_name': 'Sunita',
                'last_name': 'Devi',
                'role': User.ROLE_WORKER,
                'phone': '+91 98765 88990',
                'zone': 'Zone 2 - North Patrol'
            }
        )
        worker2.set_password('worker123')
        worker2.save()

        citizen1, _ = User.objects.get_or_create(
            username='citizen',
            defaults={
                'email': 'citizen@swachdrishti.gov',
                'first_name': 'Aarav',
                'last_name': 'Sharma',
                'role': User.ROLE_CITIZEN,
                'phone': '+91 94123 00112',
                'zone': 'Zone 1 - Central',
                'impact_points': 140,
                'badges': ['Waste Watcher', 'Clean Street Contributor']
            }
        )
        citizen1.set_password('citizen123')
        citizen1.save()

        citizen2, _ = User.objects.get_or_create(
            username='priya_verma',
            defaults={
                'email': 'priya.verma@example.com',
                'first_name': 'Priya',
                'last_name': 'Verma',
                'role': User.ROLE_CITIZEN,
                'phone': '+91 94123 55667',
                'zone': 'Zone 2 - North Commercial',
                'impact_points': 210,
                'badges': ['Waste Watcher', 'Clean Street Contributor', 'Recycling Advocate']
            }
        )
        citizen2.set_password('citizen123')
        citizen2.save()

        self.stdout.write("-> Seeded users (admin, supervisor, worker, citizen)")

        categories_data = [
            {'name': 'Overflowing bin', 'slug': 'overflowing-bin', 'icon': 'trash', 'color': '#059669', 'description': 'Public waste bin filled past capacity with surrounding spillage.', 'disposal_guide': 'Deposit into municipal mobile compactor or report for immediate high-capacity swap.'},
            {'name': 'Roadside dumping', 'slug': 'roadside-dumping', 'icon': 'alert-circle', 'color': '#D97706', 'description': 'Unsanctioned trash heap along pedestrian sidewalk or curb.', 'disposal_guide': 'Clear using mechanical broom and transport to regional sorting depot.'},
            {'name': 'Illegal dumping', 'slug': 'illegal-dumping', 'icon': 'alert-triangle', 'color': '#E11D48', 'description': 'Commercial or vehicular midnight dumping in vacant plots.', 'disposal_guide': 'Inspect for hazardous material, log license surveillance, penalize violator.'},
            {'name': 'Missed collection', 'slug': 'missed-collection', 'icon': 'clock', 'color': '#2563EB', 'description': 'Scheduled doorstep waste truck did not arrive for scheduled pickup.', 'disposal_guide': 'Dispatch on-demand secondary mini-tipper van.'},
            {'name': 'Mixed waste', 'slug': 'mixed-waste', 'icon': 'layers', 'color': '#6366F1', 'description': 'Wet and dry waste combined without municipal segregation.', 'disposal_guide': 'Requires manual sorting table separation at transfer station.'},
            {'name': 'Plastic accumulation', 'slug': 'plastic-accumulation', 'icon': 'package', 'color': '#10B981', 'description': 'High volume of non-biodegradable single-use plastics and bottles.', 'disposal_guide': 'Route directly to Material Recovery Facility (MRF) baler.'},
            {'name': 'Construction waste', 'slug': 'construction-waste', 'icon': 'hammer', 'color': '#64748B', 'description': 'Debris, bricks, concrete chips (C&D waste).', 'disposal_guide': 'Load into designated tipper truck for C&D recycling aggregate plant.'},
            {'name': 'E-Waste', 'slug': 'e-waste', 'icon': 'cpu', 'color': '#8B5CF6', 'description': 'Dead batteries, circuit boards, obsolete cables, electronics.', 'disposal_guide': 'Take to authorized authorized E-waste collection point kiosk.'},
        ]
        cat_map = {}
        for c in categories_data:
            obj, _ = WasteCategory.objects.get_or_create(name=c['name'], defaults=c)
            cat_map[c['name']] = obj
        self.stdout.write("-> Seeded waste categories")

        BASE_LAT = 28.6280
        BASE_LNG = 77.2180

        hotspot1, _ = Hotspot.objects.get_or_create(
            name='Mall Road Commercial Belt',
            defaults={
                'latitude': BASE_LAT + 0.008,
                'longitude': BASE_LNG - 0.005,
                'radius_meters': 180.0,
                'zone': 'Zone 1 - Central',
                'incident_count': 12,
                'report_count': 27,
                'trend_percentage': 145.0,
                'dominant_category': cat_map['Overflowing bin'],
                'avg_resolution_hours': 5.8,
                'is_recurring': True,
                'recurrence_level': 'CHRONIC',
                'recommendation': 'Deploy twin 1100L heavy-duty compactors. Reschedule evening merchant clearance to 9:30 PM.',
                'status': 'ACTIVE'
            }
        )

        hotspot2, _ = Hotspot.objects.get_or_create(
            name='Civil Lines Crossing & Market',
            defaults={
                'latitude': BASE_LAT - 0.009,
                'longitude': BASE_LNG + 0.007,
                'radius_meters': 150.0,
                'zone': 'Zone 2 - North Commercial',
                'incident_count': 8,
                'report_count': 19,
                'trend_percentage': 62.0,
                'dominant_category': cat_map['Roadside dumping'],
                'avg_resolution_hours': 4.6,
                'is_recurring': True,
                'recurrence_level': 'FREQUENT',
                'recommendation': 'Increase foot-patrol inspections; install surveillance deterrence camera at corner plot.',
                'status': 'ACTIVE'
            }
        )

        hotspot3, _ = Hotspot.objects.get_or_create(
            name='Station Road Transit Plaza',
            defaults={
                'latitude': BASE_LAT + 0.015,
                'longitude': BASE_LNG + 0.012,
                'radius_meters': 200.0,
                'zone': 'Zone 1 - Central',
                'incident_count': 6,
                'report_count': 14,
                'trend_percentage': 35.0,
                'dominant_category': cat_map['Plastic accumulation'],
                'avg_resolution_hours': 3.9,
                'is_recurring': True,
                'recurrence_level': 'FREQUENT',
                'recommendation': 'Install smart Reverse Vending Machine (RVM) for plastic bottles and add dual bins.',
                'status': 'ACTIVE'
            }
        )
        self.stdout.write("-> Seeded recurring hotspots")

        now = timezone.now()
        reports_seed = [
            {
                'title': 'Severe commercial bin overflow outside Plaza',
                'category': cat_map['Overflowing bin'],
                'citizen': citizen1,
                'latitude': BASE_LAT + 0.0082,
                'longitude': BASE_LNG - 0.0048,
                'address': 'Mall Road Commercial Complex, Gate 2',
                'zone': 'Zone 1 - Central',
                'severity': 'CRITICAL',
                'status': 'ASSIGNED',
                'priority_score': 74.0,
                'priority_level': 'CRITICAL',
                'priority_factors': [
                    'Reported severity: CRITICAL (+40 pts)',
                    '6 nearby reports in cluster (+24 pts)',
                    'Unresolved for 8.5 hours (+12 pts)',
                    'Recurring waste hotspot area (+20 pts)'
                ],
                'image_url': 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
                'description': 'Main community dumpster overflowing across pavement. Strong foul odor affecting nearby school bus stop.'
            },
            {
                'title': 'Large plastic bottles and packaging pile near intersection',
                'category': cat_map['Plastic accumulation'],
                'citizen': citizen2,
                'latitude': BASE_LAT + 0.0148,
                'longitude': BASE_LNG + 0.0118,
                'address': 'Station Road Metro Gate 3',
                'zone': 'Zone 1 - Central',
                'severity': 'HIGH',
                'status': 'IN_PROGRESS',
                'priority_score': 58.0,
                'priority_level': 'HIGH',
                'priority_factors': [
                    'Reported severity: HIGH (+30 pts)',
                    '4 nearby reports in area (+16 pts)',
                    'Unresolved for 3 hours (+4.5 pts)',
                    'Sensitive civic zone / high footfall area (+10 pts)'
                ],
                'image_url': 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
                'description': 'Accumulation of disposable plastic containers and beverage bottles along the pedestrian walkway.'
            },
            {
                'title': 'Illegal demolition rubble dumped overnight',
                'category': cat_map['Construction waste'],
                'citizen': citizen1,
                'latitude': BASE_LAT - 0.0088,
                'longitude': BASE_LNG + 0.0072,
                'address': 'Civil Lines Lane 4 Corner',
                'zone': 'Zone 2 - North Commercial',
                'severity': 'HIGH',
                'status': 'REPORTED',
                'priority_score': 62.0,
                'priority_level': 'HIGH',
                'priority_factors': [
                    'Reported severity: HIGH (+30 pts)',
                    'Recurring waste hotspot area (+20 pts)',
                    '3 nearby reports in area (+12 pts)'
                ],
                'image_url': 'https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=600&q=80',
                'description': 'Several bags of broken masonry and tile debris dumped on the road corner blocking storm drain.'
            },
            {
                'title': 'Cleared dumpster at Sector 11 Community Center',
                'category': cat_map['Overflowing bin'],
                'citizen': citizen2,
                'latitude': BASE_LAT - 0.004,
                'longitude': BASE_LNG - 0.006,
                'address': 'Sector 11 Community Center',
                'zone': 'Zone 1 - Central',
                'severity': 'MEDIUM',
                'status': 'RESOLVED',
                'priority_score': 35.0,
                'priority_level': 'MEDIUM',
                'priority_factors': ['Reported severity: MEDIUM (+20 pts)'],
                'image_url': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
                'description': 'Municipal bin was overflowing yesterday evening; resolved by Route 4 morning shift.'
            },
            {
                'title': 'Verified clean park corner after citizen confirmation',
                'category': cat_map['Roadside dumping'],
                'citizen': citizen1,
                'latitude': BASE_LAT + 0.003,
                'longitude': BASE_LNG + 0.005,
                'address': 'Nehru Park East Entrance',
                'zone': 'Zone 1 - Central',
                'severity': 'LOW',
                'status': 'CITIZEN_VERIFIED',
                'priority_score': 20.0,
                'priority_level': 'LOW',
                'priority_factors': ['Reported severity: LOW (+10 pts)'],
                'image_url': 'https://images.unsplash.com/photo-1526951521990-620dc14c214b?auto=format&fit=crop&w=600&q=80',
                'description': 'Leaves and roadside litter cleared; verified and confirmed by citizen Aarav Sharma.'
            },
            {
                'title': 'Reopened: Incomplete clearance behind fruit market',
                'category': cat_map['Mixed waste'],
                'citizen': citizen2,
                'latitude': BASE_LAT - 0.012,
                'longitude': BASE_LNG - 0.003,
                'address': 'Subzi Mandi Back Lane',
                'zone': 'Zone 2 - North Commercial',
                'severity': 'HIGH',
                'status': 'REOPENED',
                'priority_score': 68.0,
                'priority_level': 'CRITICAL',
                'priority_factors': [
                    'Reported severity: HIGH (+30 pts)',
                    'Reopened by citizen: Incomplete cleanup (+25 pts)',
                    'Sensitive commercial food market zone (+10 pts)'
                ],
                'image_url': 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
                'description': 'Worker cleared dry cardboard but left wet organic rotting waste in the gutter.'
            }
        ]

        created_reports = []
        for r_data in reports_seed:
            rep, _ = WasteReport.objects.get_or_create(
                title=r_data['title'],
                defaults=r_data
            )
            created_reports.append(rep)
        self.stdout.write("-> Seeded waste reports with explainable priorities")

        resolved_rep = created_reports[3]
        evidence = Evidence.objects.filter(report=resolved_rep).first()
        if evidence is None:
            evidence = Evidence.objects.create(
                report=resolved_rep,
                worker=worker1,
                before_image_url=resolved_rep.image_url,
                after_image_url='https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
                notes='Route Van 4 completely cleared the bin, swept 10m perimeter, and sprayed disinfectant solution.'
            )

        verified_rep = created_reports[4]
        CitizenVerification.objects.get_or_create(
            report=verified_rep,
            defaults={
                'citizen': citizen1,
                'is_resolved': True,
                'feedback': 'Cleaned up nicely! Thank you for the rapid municipal response.'
            }
        )

        reopened_rep = created_reports[5]
        CitizenVerification.objects.get_or_create(
            report=reopened_rep,
            defaults={
                'citizen': citizen2,
                'is_resolved': False,
                'reopen_reason': 'INCOMPLETE_CLEANUP',
                'feedback': 'Bins were emptied but roadside gutter remains choked with rotting produce.'
            }
        )

        if not TaskAssignment.objects.filter(report=created_reports[0]).exists():
            TaskAssignment.objects.create(
                report=created_reports[0],
                worker=worker1,
                supervisor=supervisor_user,
                status='ASSIGNED',
                priority_level='CRITICAL',
                notes='Immediate dispatch required. Use high-capacity tipper.'
            )
        if not TaskAssignment.objects.filter(report=created_reports[1]).exists():
            TaskAssignment.objects.create(
                report=created_reports[1],
                worker=worker1,
                supervisor=supervisor_user,
                status='IN_PROGRESS',
                priority_level='HIGH',
                notes='Plastic bags collection; bring segregation sacks.'
            )
        self.stdout.write("-> Seeded worker task assignments")

        if not PickupRequest.objects.filter(citizen=citizen1, waste_type='BULK').exists():
            PickupRequest.objects.create(
                citizen=citizen1,
                waste_type='BULK',
                estimated_volume='1 old wooden wardrobe and 2 chairs',
                description='Old furniture during home renovation, neatly kept in driveway.',
                address='House 42, Civil Lines Enclave',
                latitude=BASE_LAT - 0.007,
                longitude=BASE_LNG + 0.006,
                zone='Zone 2 - North Commercial',
                preferred_slot='Morning (9:00 AM - 12:00 PM)',
                scheduled_date=(now + timedelta(days=1)).date(),
                status='SCHEDULED',
                assigned_worker=worker2
            )
        if not PickupRequest.objects.filter(citizen=citizen2, waste_type='E_WASTE').exists():
            PickupRequest.objects.create(
                citizen=citizen2,
                waste_type='E_WASTE',
                estimated_volume='2 CRT monitors, 1 broken UPS, cables',
                description='Obsolete computer parts from society library.',
                address='Flat 302, Green Avenue Towers',
                latitude=BASE_LAT + 0.006,
                longitude=BASE_LNG - 0.008,
                zone='Zone 1 - Central',
                preferred_slot='Afternoon (2:00 PM - 5:00 PM)',
                scheduled_date=(now + timedelta(days=2)).date(),
                status='REQUESTED'
            )
        self.stdout.write("-> Seeded pickup requests")

        CollectionPoint.objects.get_or_create(
            code='CP-MALL-01',
            defaults={
                'name': 'Mall Road Smart Dumpster Point #1',
                'latitude': BASE_LAT + 0.0084,
                'longitude': BASE_LNG - 0.0052,
                'address': 'Main Mall Road Pedestrian Plaza',
                'zone': 'Zone 1 - Central',
                'bin_type': 'Dual 1100L Organic & Recyclable Hub',
                'fill_level': 88,
                'is_active': True
            }
        )
        CollectionPoint.objects.get_or_create(
            code='CP-CIVIL-04',
            defaults={
                'name': 'Civil Lines Commercial Hub Bin',
                'latitude': BASE_LAT - 0.0091,
                'longitude': BASE_LNG + 0.0069,
                'address': 'Civil Lines Market Square',
                'zone': 'Zone 2 - North Commercial',
                'bin_type': 'High-Density Compactor Unit',
                'fill_level': 62,
                'is_active': True
            }
        )
        CollectionPoint.objects.get_or_create(
            code='CP-STATION-08',
            defaults={
                'name': 'Metro Interchange E-Waste & Plastic Kiosk',
                'latitude': BASE_LAT + 0.0152,
                'longitude': BASE_LNG + 0.0125,
                'address': 'Metro Exit 2 Concourse',
                'zone': 'Zone 1 - Central',
                'bin_type': 'Smart E-Waste Deposit Station',
                'fill_level': 35,
                'is_active': True
            }
        )
        self.stdout.write("-> Seeded collection points & QR targets")

        streams = [
            {
                'name': 'Wet Waste (Organic)',
                'slug': 'wet-waste',
                'color': '#059669',
                'icon': 'apple',
                'description': 'Biodegradable kitchen and food waste suitable for composting.',
                'what_belongs': ['Fruit peels', 'Vegetable scraps', 'Leftover food', 'Egg shells', 'Coffee grounds', 'Tea leaves', 'Garden leaves'],
                'what_does_not': ['Plastic wrappers', 'Glass bottles', 'Sanitary napkins', 'Medicines', 'Aluminum foil'],
                'disposal_tips': 'Keep in a green bin. Drain excess liquid before disposal. Avoid using plastic carry bags as bin liners.',
                'order': 1
            },
            {
                'name': 'Dry Waste (Recyclable)',
                'slug': 'dry-waste',
                'color': '#2563EB',
                'icon': 'box',
                'description': 'Clean, dry non-biodegradable items that can be recycled.',
                'what_belongs': ['Paper & Cardboard', 'Newspapers', 'Milk cartons (rinsed)', 'Glass jars', 'Tin cans', 'Metal caps'],
                'what_does_not': ['Soiled food wrappers', 'Greasy pizza boxes', 'Used tissues', 'Hazardous chemicals'],
                'disposal_tips': 'Rinse food residue and dry thoroughly before placing in blue bin. Flatten cardboard boxes to save space.',
                'order': 2
            },
            {
                'name': 'Plastic Waste',
                'slug': 'plastic-waste',
                'color': '#10B981',
                'icon': 'package',
                'description': 'Rigid and flexible plastics for Material Recovery Facilities.',
                'what_belongs': ['PET water bottles', 'HDPE shampoo bottles', 'Buckets and mugs', 'Rigid containers'],
                'what_does_not': ['PVC construction pipes', 'Thermocol with grease', 'Laminated multi-layer sachets'],
                'disposal_tips': 'Crush bottles and replace caps before recycling. Ensure bottles are empty of liquids.',
                'order': 3
            },
            {
                'name': 'E-Waste',
                'slug': 'e-waste',
                'color': '#8B5CF6',
                'icon': 'cpu',
                'description': 'Discarded electrical and electronic equipment containing precious and heavy metals.',
                'what_belongs': ['Mobile phones', 'Laptops & chargers', 'Circuit boards', 'Cables & wires', 'Remote controls'],
                'what_does_not': ['Light bulbs (hazardous)', 'Car lead-acid batteries'],
                'disposal_tips': 'Never toss into normal household bins. Drop off at designated municipal E-waste collection kiosks.',
                'order': 4
            },
            {
                'name': 'Hazardous Waste',
                'slug': 'hazardous-waste',
                'color': '#E11D48',
                'icon': 'alert-triangle',
                'description': 'Chemical, medical, or toxic items requiring specialized treatment.',
                'what_belongs': ['Expired medicines', 'Insecticide cans', 'Paints & thinners', 'Used syringes', 'Sanitary waste'],
                'what_does_not': ['Normal food waste', 'Empty clean plastic containers'],
                'disposal_tips': 'Wrap sanitary waste securely in newspaper. Mark with a red cross. Hand over separately to sanitation workers.',
                'order': 5
            },
            {
                'name': 'Construction & Demolition',
                'slug': 'construction-waste',
                'color': '#64748B',
                'icon': 'hammer',
                'description': 'Heavy masonry, plaster, gravel, and tiling rubble from renovation.',
                'what_belongs': ['Concrete chunks', 'Bricks', 'Tiles', 'Sand and mortar', 'Plasterboard'],
                'what_does_not': ['Domestic trash', 'Chemical paints', 'Electrical wiring'],
                'disposal_tips': 'Do not dump on roadside. Book an on-demand municipal C&D bulk pickup truck through the app.',
                'order': 6
            },
        ]
        for s in streams:
            WasteStreamGuide.objects.get_or_create(slug=s['slug'], defaults=s)
        self.stdout.write("-> Seeded awareness waste stream guides")

        quizzes = [
            {
                'question': 'Where should a used alkaline AA battery go?',
                'options': [
                    'Normal wet waste bin with vegetables',
                    'Authorized E-Waste collection kiosk or designated drop box',
                    'Normal dry waste recyclable bin',
                    'Roadside dumping corner'
                ],
                'correct_option_index': 1,
                'explanation': 'Batteries contain heavy metals and electrolyte chemicals that can leach into soil or spark fires in compactors. They must be routed through authorized E-waste channels.',
                'difficulty': 'Easy'
            },
            {
                'question': 'How should you dispose of a greasy pizza box with melted cheese stuck to the cardboard?',
                'options': [
                    'Clean cardboard top to Dry Waste; greasy bottom to Wet Waste or compost',
                    'Put entire greasy box into blue recyclable bin',
                    'Leave it outside next to the street curb',
                    'Burn it in the backyard'
                ],
                'correct_option_index': 0,
                'explanation': 'Grease and oil ruin the cardboard paper pulping process. Tear off the clean top lid for paper recycling and put the oil-soaked bottom into organic/wet waste.',
                'difficulty': 'Medium'
            },
            {
                'question': 'What is the correct protocol for expired pharmaceutical medicines?',
                'options': [
                    'Flush them down the toilet into sewer lines',
                    'Hand over to designated pharmacy take-back or mark as Domestic Hazardous Waste',
                    'Crush and mix into household compost',
                    'Throw into plastic bottle bin'
                ],
                'correct_option_index': 1,
                'explanation': 'Flushing pharmaceuticals contaminates groundwater and waterways, creating antibiotic resistance in aquatic ecosystems. Always return to take-back kiosks or mark as domestic hazardous waste.',
                'difficulty': 'Hard'
            }
        ]
        for q in quizzes:
            QuizQuestion.objects.get_or_create(question=q['question'], defaults=q)
        self.stdout.write("-> Seeded interactive quiz questions")

        AreaCleanlinessIndex.objects.get_or_create(
            zone='Zone 1 - Central',
            defaults={
                'score': 84.5,
                'grade': 'A',
                'report_frequency_score': 82.0,
                'resolution_speed_score': 86.0,
                'recurrence_prevention_score': 78.0,
                'pickup_reliability_score': 95.0,
                'citizen_satisfaction_score': 89.0
            }
        )
        AreaCleanlinessIndex.objects.get_or_create(
            zone='Zone 2 - North Commercial',
            defaults={
                'score': 76.0,
                'grade': 'B+',
                'report_frequency_score': 71.0,
                'resolution_speed_score': 80.0,
                'recurrence_prevention_score': 68.0,
                'pickup_reliability_score': 88.0,
                'citizen_satisfaction_score': 81.0
            }
        )
        AreaCleanlinessIndex.objects.get_or_create(
            zone='Zone 3 - West Enclave',
            defaults={
                'score': 91.2,
                'grade': 'A+',
                'report_frequency_score': 94.0,
                'resolution_speed_score': 92.0,
                'recurrence_prevention_score': 89.0,
                'pickup_reliability_score': 96.0,
                'citizen_satisfaction_score': 93.0
            }
        )
        AreaCleanlinessIndex.objects.get_or_create(
            zone='Zone 4 - South Industrial',
            defaults={
                'score': 72.8,
                'grade': 'B',
                'report_frequency_score': 68.0,
                'resolution_speed_score': 75.0,
                'recurrence_prevention_score': 64.0,
                'pickup_reliability_score': 85.0,
                'citizen_satisfaction_score': 77.0
            }
        )
        self.stdout.write("-> Seeded Spectrum Area Cleanliness Index")

        self.stdout.write(self.style.SUCCESS("SwachDrishti demo database seeding completed successfully!"))
