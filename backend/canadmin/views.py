from django.shortcuts import render
from django.http import HttpResponse
from .models import InstituteModel
from .serializers import InstituteSerializer
from candidate.models import CandidateProfile, Education, Experience, Project, Skill, Certificate, Language
from candidate.serializers import ProjectSerializer, EducationSerializer, ExperienceSerializer, SkillSerializer, CertificateSerializer, LanguageSerializer, CandidateProfileSerializer
from authentication.models import UserTable
from authentication.serializers import UserSerializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Create your views here.
def test(request):
    return HttpResponse("<h1>This Is Admin Test</h1>")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetUsers(request):
    if request.user.role != "admin":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    users = UserTable.objects.filter(role="candidate").order_by("-date_joined")
    serializer = UserSerializers(users, many=True, context={'request': request})
    return Response(
        {
            "success": True,
            "message": "Users fetched successfully!",
            "count": users.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def UpdateUserStatus(request, user_id):
    if request.user.role != "admin":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        user = UserTable.objects.get(id=user_id, role="candidate")
    except UserTable.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "User Not Found"
            },
            status= status.HTTP_404_NOT_FOUND
        )
    user.is_active = not user.is_active
    user.save()
    return Response(
        {
            "success": True,
            "message": f"User {'activated' if user.is_active else 'deactivated'} successfully!!",
            "data": {
                "id": user.id,
                "is_active": user.is_active
            }
        },
        status= status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetUserDetails(request, user_id):
    if request.user.role != "admin":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    try:
        user = UserTable.objects.select_related("profile").get(id=user_id, role="candidate")
    except UserTable.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "User Not Found"
            },
            status= status.HTTP_404_NOT_FOUND
        )
    try:
        profile = user.profile
    except CandidateProfile.DoesNotExist:
        profile = None
    response = {
        "user": UserSerializers(user).data,
        "profile": CandidateProfileSerializer(profile).data if profile else None,
        "educations": EducationSerializer(Education.objects.filter(user=user), many= True).data,
        "experiences": ExperienceSerializer(Experience.objects.filter(user=user), many= True).data,
        "skills": SkillSerializer(Skill.objects.filter(user=user), many= True).data,
        "projects": ProjectSerializer(Project.objects.filter(user=user), many= True).data,
        "languages": LanguageSerializer(Language.objects.filter(user=user), many= True).data,
        "certificates": CertificateSerializer(Certificate.objects.filter(user=user), many= True).data,
    }
    return Response(
        {
            "success": True,
            "message": "User Profile Fetched Successfully!!!",
            "data": response
        },
        status= status.HTTP_200_OK
    )