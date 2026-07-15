from django.urls import path
from . import views

urlpatterns = [
    path('test/', views.test, name='test'),

    path('get-institute/', views.GetInstitute, name='get-institute'),
    path('signup/', views.SignUp, name='signup'),
    path('login/', views.LogIn, name='login'),
    path('forgot-password/', views.ForgotPassword, name='forgot-password'),
]