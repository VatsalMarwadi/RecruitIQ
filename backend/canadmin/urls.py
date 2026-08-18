from django.urls import path
from . import views

urlpatterns = [
    path("test/", views.test, name="test"),

    path("get-admin-institute/", views.GetInstitute, name="get-admin-institute"),
    path("add-update-institute/", views.AddUpdateInstitute, name="add-update-institute"),
    path("update-institute-status/<int:institute_id>/", views.UpdateInstituteStatus, name="update-institute-status"),

    path("get-admin-user/", views.GetUsers, name="get-admin-user"),
    path("update-user-status/<int:user_id>/", views.UpdateUserStatus, name="update-user-status"),
    path("get-admin-user-details/<int:user_id>/", views.GetUserDetails, name="get-admin-user-details"),

    path("add-update-drive/", views.AddUpdateDrive, name="add-update-drive"),
    path("get-drive/", views.GetDrive, name="get-drive"),
    path("update-drive-status/<int:drive_id>/", views.UpdateDriveStatus, name="update-drive-status"),

    path("add-update-round/", views.AddUpdateRound, name="add-update-round"),
    path("update-round-status/<int:round_id>/", views.UpdateRoundStatus, name="update-round-status"),
    path("delete-round/<int:round_id>/", views.DeleteRound, name="delete-round"),

    path("get-drive-details/<int:drive_id>/", views.GetDriveDetails,name="get-drive-details"),
    path("get-round-details/<int:round_id>/", views.GetRoundDetails, name="get-round-details"),

    path("upload-aptitude-question/", views.UploadAptitudeQuestion, name="upload-aptitude-question"),
    path("get-aptitude-questions/<int:round_id>/", views.GetAptitudeQuestions, name="get-aptitude-questions"),
    path("add-update-aptitude-question/", views.AddUpdateAptitudeQuestion, name="add-update-aptitude-question"),
    path("delete-aptitude-question/<int:aptitude_question_id>/", views.DeleteAptitudeQuestion, name="delete-aptitude-question"),
    path("list-aptitude-results/<int:round_id>/", views.ListAptitudeResults, name="list-aptitude-results"),

    path("auto-update-drive-statuses/", views.AutoUpdateDriveStatuses, name="auto-update-drive-statuses"),
    path("auto-update-round-statuses/", views.AutoUpdateRoundStatuses, name="auto-update-round-statuses"),

    path("get-coding-questions/<int:round_id>/", views.GetCodingQuestions, name="get-coding-questions"),
    path("add-update-coding-question/", views.AddUpdateCodingQuestion, name="add-update-coding-question"),
    path("delete-coding-question/<int:coding_question_id>/", views.DeleteCodingQuestion, name="delete-coding-question"),

    path("get-coding-test-cases/<int:coding_question_id>/", views.GetCodingTestCases, name="get-coding-test-cases"),
    path("add-update-coding-test-case/", views.AddUpdateCodingTestCase, name="add-update-coding-test-case"),
    path("delete-coding-test-case/<int:coding_test_case_id>/", views.DeleteCodingTestCase, name="delete-coding-test-case"),
    path("list-coding-results/<int:round_id>/", views.ListCodingResults, name="list-coding-results"),

    path("preview-round-results/<int:round_id>/", views.PreviewRoundResults, name="preview-round-results"),
    path("confirm-round-results/<int:round_id>/", views.ConfirmRoundResults, name="confirm-round-results"),

    path('get-user-drive-attempts/<int:user_id>/', views.GetUserDriveAttempts, name='get_user_drive_attempts'),
]