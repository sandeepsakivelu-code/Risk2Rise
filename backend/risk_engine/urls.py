from django.urls import path

from .views import get_student, get_students, interventions, login_user, predict_risk


urlpatterns = [
    path("login/", login_user, name="login"),
    path("predict-risk/", predict_risk, name="predict-risk"),
    path("students/", get_students, name="student-list"),
    path("students/<str:student_id>/", get_student, name="student-detail"),
    path("interventions/", interventions, name="interventions"),
]
