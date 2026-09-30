from django.db import models

class AreaCleanlinessIndex(models.Model):
    zone = models.CharField(max_length=100, unique=True)
    score = models.FloatField(default=82.5)  # 0 to 100
    grade = models.CharField(max_length=10, default='A')
    
    report_frequency_score = models.FloatField(default=85.0)
    resolution_speed_score = models.FloatField(default=88.0)
    recurrence_prevention_score = models.FloatField(default=76.0)
    pickup_reliability_score = models.FloatField(default=92.0)
    citizen_satisfaction_score = models.FloatField(default=90.0)
    
    last_computed = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.zone}: Index {self.score} ({self.grade})"
