from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, StaffCreateSerializer
from .permissions import IsSupervisor, IsAdminRole

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully.'
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful.'
        })

class DemoLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        role_req = request.data.get('role', 'admin').lower()
        role_map = {
            'admin': User.ROLE_ADMIN,
            'supervisor': User.ROLE_SUPERVISOR,
            'worker': User.ROLE_WORKER,
            'citizen': User.ROLE_CITIZEN,
        }
        target_role = role_map.get(role_req, User.ROLE_ADMIN)
        
        user = User.objects.filter(role=target_role).first()
        if not user:
            username = f"demo_{role_req}"
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f"{role_req}@swachdrishti.gov",
                    'role': target_role,
                    'first_name': role_req.capitalize(),
                    'last_name': 'Official' if role_req != 'citizen' else 'Resident',
                    'zone': 'Zone 1 - Central',
                    'badges': ['Waste Watcher'] if target_role == User.ROLE_CITIZEN else []
                }
            )
            if created:
                user.set_password(f"{role_req}123")
                user.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': f'Switched to {user.get_role_display()} demo account successfully.'
        })

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from core.badges import get_user_stats, badge_catalog
        return Response({
            'user': UserSerializer(request.user).data,
            'stats': get_user_stats(request.user),
            'badge_catalog': badge_catalog(),
        })

class WorkersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role=User.ROLE_WORKER)

class StaffCreateView(APIView):
    permission_classes = [IsSupervisor]

    def post(self, request):
        role = (request.data.get('role') or User.ROLE_WORKER).upper()
        if role not in (User.ROLE_WORKER, User.ROLE_SUPERVISOR):
            return Response(
                {'role': 'Only WORKER or SUPERVISOR accounts can be created here.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if role == User.ROLE_SUPERVISOR and request.user.role != User.ROLE_ADMIN and not request.user.is_superuser:
            return Response(
                {'role': 'Only administrators can create supervisor accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        data['role'] = role
        serializer = StaffCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': f'{user.get_role_display()} account created. Credentials work immediately.',
        }, status=status.HTTP_201_CREATED)
