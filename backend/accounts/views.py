from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
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
        return Response({
            'user': UserSerializer(request.user).data
        })

class WorkersListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role=User.ROLE_WORKER)
