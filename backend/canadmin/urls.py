from django.urls import path
from . import views

urlpatterns = [
    path("test/", views.test, name="test"),
    path("get-admin-user/", views.GetUsers, name="get-admin-user"),
    path("update-user-status/<int:user_id>/", views.UpdateUserStatus, name="update-user-status"),
    path("get-admin-user-details/<int:user_id>/", views.GetUserDetails, name="get-admin-user-details"),
]