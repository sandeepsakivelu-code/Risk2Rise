from django.contrib import admin
from .models import StudentAcademicData


@admin.register(StudentAcademicData)
class StudentAcademicDataAdmin(admin.ModelAdmin):
	list_display = (
		'student_name',
		'roll_number',
		'department',
		'class_name',
		'attendance_percentage',
		'average_marks_percentage',
		'recent_performance_trend',
	)
	search_fields = ('student_name', 'student_id', 'roll_number', 'department')
	list_filter = ('department', 'class_name', 'recent_performance_trend')
