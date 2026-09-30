from rest_framework import serializers
from .models import AreaCleanlinessIndex

class AreaCleanlinessIndexSerializer(serializers.ModelSerializer):
    class Meta:
        model = AreaCleanlinessIndex
        fields = '__all__'
