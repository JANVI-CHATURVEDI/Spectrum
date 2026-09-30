from rest_framework import serializers
from .models import WasteCategory, WasteReport, CitizenVerification
from accounts.serializers import UserSerializer

class WasteCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteCategory
        fields = '__all__'

class CitizenVerificationSerializer(serializers.ModelSerializer):
    citizen = UserSerializer(read_only=True)

    class Meta:
        model = CitizenVerification
        fields = ['id', 'report', 'citizen', 'is_resolved', 'reopen_reason', 'feedback', 'verified_at']
        read_only_fields = ['id', 'verified_at']

class WasteReportSerializer(serializers.ModelSerializer):
    category_details = WasteCategorySerializer(source='category', read_only=True)
    citizen_details = UserSerializer(source='citizen', read_only=True)
    citizen_verification = CitizenVerificationSerializer(read_only=True)
    verification = CitizenVerificationSerializer(source='citizen_verification', read_only=True)
    duplicates_count = serializers.SerializerMethodField()

    class Meta:
        model = WasteReport
        fields = [
            'id', 'citizen', 'citizen_details', 'category', 'category_details',
            'title', 'description', 'image', 'image_url', 'latitude', 'longitude',
            'address', 'zone', 'severity', 'status', 'priority_score', 'priority_level',
            'priority_factors', 'is_duplicate', 'duplicate_of', 'duplicates_count',
            'citizen_verification', 'verification', 'after_image', 'after_image_url',
            'cleanup_score', 'cleanup_verified', 'cleanup_verdict',
            'created_at', 'updated_at', 'resolved_at', 'verified_at'
        ]
        read_only_fields = ['id', 'priority_score', 'priority_level', 'priority_factors', 'created_at', 'updated_at']

    def get_duplicates_count(self, obj):
        annotated = getattr(obj, 'duplicates_count', None)
        if annotated is not None:
            return annotated
        try:
            return obj.duplicates.count()
        except Exception:
            return 0

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for url_field, file_field in (('image_url', 'image'),
                                      ('after_image_url', 'after_image')):
            if not data.get(url_field) and getattr(instance, file_field, None):
                try:
                    data[url_field] = getattr(instance, file_field).url
                except Exception:
                    pass
        return data
