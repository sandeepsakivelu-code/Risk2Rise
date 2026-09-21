from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .ml.explanation import generate_risk_explanation
from .models import StudentAcademicData
from .ml.predictor import predict_student_risk
from .ml.recommendation import generate_recommendations
from .serializers import  InterventionSerializer, StudentAcademicDataSerializer, StudentRiskPredictionSerializer
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny
from .models import Intervention, StudentAcademicData, UserProfile
@api_view(["GET"])
def get_student(request, student_id):
	"""Return academic data for one student."""
	try:
		student = StudentAcademicData.objects.get(student_id=student_id)
	except StudentAcademicData.DoesNotExist:
		return Response(
			{"error": "Student not found."},
			status=status.HTTP_404_NOT_FOUND,
		)

	return Response(StudentAcademicDataSerializer(student).data)
@api_view(["GET"])
def get_students(request):
        """Return all students for faculty-level listing."""
        students = StudentAcademicData.objects.all()
        serializer = StudentAcademicDataSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["POST"])
def predict_risk(request):
	"""Validate academic data and return the saved model's risk prediction."""
	serializer = StudentRiskPredictionSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(
			{"success": False, "errors": serializer.errors},
			status=status.HTTP_400_BAD_REQUEST,
		)

	try:
		prediction = predict_student_risk(**serializer.validated_data)
		explanation = generate_risk_explanation(
			**serializer.validated_data,
			risk_level=prediction["risk_level"],
		)
		recommendations = generate_recommendations(
			**serializer.validated_data,
			risk_level=prediction["risk_level"],
		)
	except Exception as error:
		return Response(
			{"success": False, "error": f"Prediction, explanation, or recommendation processing failed: {error}"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR,
		)

	return Response(
		{
			"success": True,
			"prediction": prediction,
			"explanation": {
				"summary": explanation["summary"],
				"risk_factors": explanation["risk_factors"],
			},
			"recommendations": recommendations,
		},
		status=status.HTTP_200_OK,
	)
@api_view(["POST"])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"success": False, "error": "Username and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"success": False, "error": "Invalid username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    try:
        profile = user.userprofile
    except UserProfile.DoesNotExist:
        return Response(
            {"success": False, "error": "User role is not configured."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(
        {
            "success": True,
            "username": user.username,
            "role": profile.role,
        },
        status=status.HTTP_200_OK,
    )
@api_view(["GET", "POST"])
def interventions(request):
    if request.method == "GET":
        student_id = request.query_params.get("student_id")

        if student_id:
            interventions = Intervention.objects.filter(
                student__student_id=student_id
            )
        else:
            interventions = Intervention.objects.all()

        serializer = InterventionSerializer(interventions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    serializer = InterventionSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    intervention = serializer.save()

    return Response(
        {
            "success": True,
            "intervention": InterventionSerializer(intervention).data,
        },
        status=status.HTTP_201_CREATED,
    )