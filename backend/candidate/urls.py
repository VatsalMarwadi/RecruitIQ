from django.urls import path
from . import views

urlpatterns = [
    path("get-candidate-profile/", views.GetCandidateProfile, name="get-candidate-profile"),
    path("update-candidate-profile/", views.UpdateCandidateProfile, name="update-candidate-profile"),

    path("get-education/", views.GetEducation, name="get-education"),
    path("add-update-education/", views.AddOrUpdateEducation, name="add-update-education"),
    path("delete-education/<int:id>/", views.DeleteEducation, name='delete-education'),

    path("get-experience/", views.GetExperience, name="get-experience"),
    path("add-update-experience/", views.AddOrUpdateExperience, name="add-update-experience"),
    path("delete-experience/<int:id>/", views.DeleteExperience, name="delete-experience"),

    path("get-skill/", views.GetSkill, name="get-skill"),
    path("add-update-skill/", views.AddOrUpdateSkill, name="add-update-skill"),
    path("delete-skill/<int:id>/", views.DeleteSkill, name="delete-skill"),

    path("get-project/", views.GetProject, name="get-project"),
    path("add-update-project/", views.AddOrUpdateProject, name="add-update-project"),
    path("delete-project/<int:id>/", views.DeleteProject, name="delete-project"),

    path("get-language/", views.GetLanguage, name="get-language"),
    path("add-update-language/", views.AddOrUpdateLanguage, name="add-update-language"),
    path("delete-language/<int:id>/", views.DeleteLanguage, name="delete-language"),

    path("get-certificate/", views.GetCertificate, name="get-certificate"),
    path("add-update-certificate/", views.AddOrUpdateCertificate, name="add-update-certificate"),
    path("delete-certificate/<int:id>/", views.DeleteCertificate, name="delete-certificate"),

    path("get-available-drives/", views.GetAvailableDrives, name="get-available-drives"),
    path("get-drive-details/<int:drive_id>/", views.GetCandidateDriveDetails, name="get-drive-details"),

    path('get-attempt-status/<int:round_id>/', views.GetAttemptStatus, name='get_attempt_status'),
    path("get-candidate-round-status/<int:drive_id>/", views.GetCandidateRoundStatus, name="get-candidate-round-status"),
    path("get-round-details/<int:round_id>/", views.GetRoundDetails, name="get-round-details"),

    path("start-aptitude-test/<int:round_id>/", views.StartAptitudeTest, name="start-aptitude-test"),
    path("submit-aptitude-test/<int:attempt_id>/", views.SubmitAptitudeTest, name="submit-aptitude-test"),

    path('start-coding-test/<int:round_id>/', views.StartCodingTest, name="start-coding-test"),
    path('save-coding-code/', views.SaveCodingCode, name="save-coding-test"),
    path('run-coding-code/', views.RunCodingCode, name="run-coding-code"),
    path('submit-coding-question/', views.SubmitCodingQuestion, name="submit-coding-question"),
    path('submit-coding-round/', views.SubmitCodingRound, name="submit-coding-round"),
    path('get-saved-submissions/<int:attempt_id>/', views.get_saved_submissions, name="get-saved-submissions"),
]