from django.db import models

class WasteStreamGuide(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    color = models.CharField(max_length=30, default='#10B981')
    icon = models.CharField(max_length=50, default='recycle')
    description = models.TextField()
    what_belongs = models.JSONField(default=list)
    what_does_not = models.JSONField(default=list)
    disposal_tips = models.TextField()
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

class QuizQuestion(models.Model):
    question = models.CharField(max_length=300)
    options = models.JSONField(default=list)  # list of strings
    correct_option_index = models.IntegerField(default=0)
    explanation = models.TextField()
    difficulty = models.CharField(max_length=20, default='Medium')

    def __str__(self):
        return self.question

class CollectionPoint(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=300)
    zone = models.CharField(max_length=100, default='Zone 1 - Central')
    bin_type = models.CharField(max_length=100, default='Dual Organic & Recyclable Hub')
    fill_level = models.IntegerField(default=45)  # 0 to 100%
    is_active = models.BooleanField(default=True)
    last_cleared_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code}) - {self.fill_level}% full"
