from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MaxValueValidator, MinValueValidator


class StudentAcademicData(models.Model):
	class PerformanceTrend(models.TextChoices):
		IMPROVING = 'Improving', 'Improving'
		STABLE = 'Stable', 'Stable'
		DECLINING = 'Declining', 'Declining'

	student_id = models.CharField(max_length=50, unique=True)
	student_name = models.CharField(max_length=150)
	roll_number = models.CharField(max_length=50, unique=True)
	department = models.CharField(max_length=150)
	class_name = models.CharField(max_length=50)
	attendance_percentage = models.FloatField(
		validators=[MinValueValidator(0), MaxValueValidator(100)],
	)
	average_marks_percentage = models.FloatField(
		validators=[MinValueValidator(0), MaxValueValidator(100)],
	)
	assignment_completion_percentage = models.FloatField(
		validators=[MinValueValidator(0), MaxValueValidator(100)],
	)
	recent_performance_trend = models.CharField(
		max_length=20,
		choices=PerformanceTrend.choices,
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ['student_name']

	def __str__(self):
		return f'{self.student_name} ({self.roll_number})'
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("Student", "Student"),
        ("Faculty", "Faculty"),
        ("HOD", "HOD"),
        ("Principal", "Principal"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} - {self.role}"
class Intervention(models.Model):
    STATUS_CHOICES = [
        ("Not Started", "Not Started"),
        ("Assigned", "Assigned"),
        ("In Progress", "In Progress"),
        ("Completed", "Completed"),
    ]

    PRIORITY_CHOICES = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]

    OUTCOME_CHOICES = [
        ("Improving", "Improving"),
        ("No Significant Change", "No Significant Change"),
        ("Needs Further Support", "Needs Further Support"),
    ]

    student = models.ForeignKey(
        StudentAcademicData,
        on_delete=models.CASCADE,
        related_name="interventions",
    )
    intervention_type = models.CharField(max_length=100)
    assigned_date = models.DateField()
    follow_up_date = models.DateField()
    faculty = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_interventions",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Assigned",
    )
    notes = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="Medium",
    )
    outcome = models.CharField(
        max_length=30,
        choices=OUTCOME_CHOICES,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.student_name} - {self.intervention_type}"