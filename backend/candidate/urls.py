from django.urls import path
from . import views

urlpatterns = [
    path("test/", views.test, name="test"),
    path("update-candidate-profile/", views.UpdateCandidateProfile, name="update-candidate-profile"),
    path("get-candidate-profile/", views.GetCandidateProfile, name="get-candidate-profile"),

    path("add-update-education/", views.AddOrUpdateEducation, name="add-update-education"),
    path("get-education/", views.GetEducation, name="get-education"),
    path("delete-education/<int:id>/", views.DeleteEducation, name='delete-education'),
    
    path("add-update-experience/", views.AddOrUpdateExperience, name="add-update-experience"),
    path("get-experience/", views.GetExperience, name="get-experience"),
    path("delete-experience/<int:id>/", views.DeleteExperience, name="delete-experience"),
    
    path("add-update-skill/", views.AddOrUpdateSkill, name="add-update-skill"),
    path("get-skill/", views.GetSkill, name="get-skill"),
    path("delete-skill/<int:id>/", views.DeleteSkill, name="delete-skill"),
    
    path("add-update-project/", views.AddOrUpdateProject, name="add-update-project"),
    path("get-project/", views.GetProject, name="get-project"),
    path("delete-project/<int:id>/", views.DeleteProject, name="delete-project"),
    
    path("add-update-language/", views.AddOrUpdateLanguage, name="add-update-language"),
    path("get-language/", views.GetLanguage, name="get-language"),
    path("delete-language/<int:id>/", views.DeleteLanguage, name="delete-language"),
    
    path("add-update-certificate/", views.AddOrUpdateCertificate, name="add-update-certificate"),
    path("get-certificate/", views.GetCertificate, name="get-certificate"),
    path("delete-certificate/<int:id>/", views.DeleteCertificate, name="delete-certificate"),
]