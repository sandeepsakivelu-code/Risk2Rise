from rest_framework import serializers

from .models import StudentAcademicData,Intervention


class StudentRiskPredictionSerializer(serializers.Serializer):
    """Validate the academic inputs accepted by the risk prediction API."""

    attendance_percentage = serializers.FloatField(min_value=0, max_value=100)
    average_marks_percentage = serializers.FloatField(min_value=0, max_value=100)
    assignment_completion_percentage = serializers.FloatField(
        min_value=0,
        max_value=100,
    )
    recent_performance_trend = serializers.ChoiceField(
        choices=("Improving", "Stable", "Declining")
    )


class StudentAcademicDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAcademicData
        fields = (
            "student_id",
            "student_name",
            "roll_number",
            "department",
            "class_name",
            "attendance_percentage",
            "average_marks_percentage",
            "assignment_completion_percentage",
            "recent_performance_trend",
        )
from .models import Intervention


class InterventionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intervention
        fields = [
            "id",
            "student",
            "intervention_type",
            "assigned_date",
            "follow_up_date",
            "faculty",
            "status",
            "notes",
            "priority",
            "outcome",
        ]