from django.test import TestCase
from rest_framework.test import APIClient

from .models import StudentAcademicData


class StudentDetailApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()
		self.student = StudentAcademicData.objects.create(
			student_id="STU-001",
			student_name="Asha Rao",
			roll_number="R-001",
			department="Computer Science",
			class_name="CSE-A",
			attendance_percentage=92.5,
			average_marks_percentage=88.0,
			assignment_completion_percentage=95.0,
			recent_performance_trend="Improving",
		)

	def test_returns_student_details(self):
		response = self.client.get("/api/students/STU-001/")

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data["student_id"], "STU-001")
		self.assertEqual(response.data["student_name"], "Asha Rao")
		self.assertEqual(response.data["attendance_percentage"], 92.5)

	def test_returns_json_404_for_unknown_student(self):
		response = self.client.get("/api/students/unknown/")

		self.assertEqual(response.status_code, 404)
		self.assertEqual(response.data, {"error": "Student not found."})
