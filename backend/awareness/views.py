from rest_framework import viewsets, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import WasteStreamGuide, QuizQuestion, CollectionPoint
from .serializers import WasteStreamGuideSerializer, QuizQuestionSerializer, CollectionPointSerializer

class WasteStreamGuideListView(generics.ListAPIView):
    queryset = WasteStreamGuide.objects.all()
    serializer_class = WasteStreamGuideSerializer
    permission_classes = [AllowAny]

class QuizQuestionListView(generics.ListAPIView):
    queryset = QuizQuestion.objects.all()
    serializer_class = QuizQuestionSerializer
    permission_classes = [AllowAny]

class QuizAnswerCheckView(APIView):
    """
    Validates user selected quiz option, returns explanation and correctness.
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            q = QuizQuestion.objects.get(pk=pk)
        except QuizQuestion.DoesNotExist:
            return Response({'error': 'Quiz question not found'}, status=status.HTTP_404_NOT_FOUND)

        selected_val = request.data.get('selected_option_index')
        if selected_val is None:
            selected_val = request.data.get('selected_index')
        if selected_val is None:
            selected_val = request.data.get('option_index', -1)
        try:
            selected = int(selected_val)
        except (ValueError, TypeError):
            selected = -1

        is_correct = (selected == q.correct_option_index)

        return Response({
            'is_correct': is_correct,
            'correct_option_index': q.correct_option_index,
            'explanation': q.explanation
        })

class CollectionPointViewSet(viewsets.ModelViewSet):
    queryset = CollectionPoint.objects.filter(is_active=True)
    serializer_class = CollectionPointSerializer
    permission_classes = [AllowAny]

class QRCollectionPointLookupView(APIView):
    """
    Resolves a scanned QR code to pre-filled collection point location for instant reporting.
    Section 19: 'A QR scan should open Report an issue at this location with location already known.'
    """
    permission_classes = [AllowAny]

    def get(self, request, code):
        try:
            cp = CollectionPoint.objects.get(code=code)
            return Response(CollectionPointSerializer(cp).data)
        except CollectionPoint.DoesNotExist:
            return Response({'error': f'Collection point with code {code} not found.'}, status=status.HTTP_404_NOT_FOUND)
