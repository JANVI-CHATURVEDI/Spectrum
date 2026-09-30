from rest_framework import serializers
from .models import WasteStreamGuide, QuizQuestion, CollectionPoint

class WasteStreamGuideSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteStreamGuide
        fields = '__all__'

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'options', 'difficulty']

class QuizAnswerSerializer(serializers.Serializer):
    selected_option_index = serializers.IntegerField()

class CollectionPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionPoint
        fields = '__all__'
