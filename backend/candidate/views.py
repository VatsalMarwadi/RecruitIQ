from django.http import HttpResponse
from .models import CandidateProfile, Education, Experience, Skill, Project, Language, Certificate
from .serializers import CandidateProfileSerializer, EducationSerializer, ExperienceSerializer, SkillSerializer, ProjectSerializer, LanguageSerializer, CertificateSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db import IntegrityError
import cloudinary.uploader
import cloudinary

# Create your views here.
def test(request):
    return HttpResponse("<h1>This Is Candidate Testing!!!</h1>")

def get_public_id(url, resource_type="image"):
    try:
        parts = url.split("/upload/")[1]
        parts = parts.split("/", 1)[1]
        if parts.startswith("v"):
            parts = parts.split("/", 1)[1]
        if resource_type != "raw":
            public_id = parts.rsplit(".", 1)[0]
        else:
            public_id = parts  # keep extension for raw files
        return public_id
    except Exception:
        return None

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def UpdateCandidateProfile(request):
    profile, created = CandidateProfile.objects.get_or_create(user = request.user)
    data = request.data.copy()
    try:
        if "profile_picture" in request.FILES:
            image = request.FILES['profile_picture']
            image_upload = cloudinary.uploader.upload(
                image,
                folder = "profile_images",
                resource_type = "image"
            )
            if profile.profile_picture:
                old_public_id = get_public_id(profile.profile_picture, resource_type="image")
                if old_public_id:
                    cloudinary.uploader.destroy(old_public_id, resource_type="image")
            data['profile_picture'] = image_upload['secure_url']
        if "resume" in request.FILES:
            resume = request.FILES["resume"]
            resume_upload = cloudinary.uploader.upload(
                resume,
                folder="resumes",
                resource_type="raw",
                type="upload",
                access_mode="public"
            )
            if profile.resume:
                old_public_id = get_public_id(profile.resume, resource_type="raw")
                if old_public_id:
                    cloudinary.uploader.destroy(old_public_id, resource_type="raw")
            data["resume"] = resume_upload["secure_url"]
        serializer = CandidateProfileSerializer(profile, data=data, partial= True, context= {"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "success": True, 
                    "message": "Profile Updated Successfully!!!",
                    "data": serializer.data
                },
                status= status.HTTP_200_OK
            )
        return Response(
            {
                "success": False,
                "errors": serializer.errors
            }, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status= status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetCandidateProfile(request):
    try:
        profile = CandidateProfile.objects.get(user= request.user)
        serializer = CandidateProfileSerializer(profile, context={"request": request})
        return Response(
            {
                "success": True,
                "message": "Profile Fetched Successfully!!!",
                "data": serializer.data
            },
            status= status.HTTP_200_OK
        )
    except CandidateProfile.DoesNotExist:
        return Response(
            {
                "success": True,
                "message": "Profile not found. Returning user details.",
                "data": {
                    "user_id": request.user.id,
                    "name": request.user.name,
                    "email": request.user.email,
                    "date_of_birth": request.user.date_of_birth,
                    "phone": "",
                    "gender": "",
                    "nationality": "",
                    "address": "",
                    "city": "",
                    "state": "",
                    "country": "",
                    "zip_code": "",
                    "about": "",
                    "profile_picture": None,
                    "resume": None
                }
            },
            status= status.HTTP_200_OK
        )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def AddOrUpdateEducation(request):
    education_id = request.data.get("id")
    data = request.data.copy()
    if education_id:
        try:
            education = Education.objects.get(
                id=education_id,
                user=request.user
            )
        except Education.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Education record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
    else:
        education = None
    try:
        if "degree_image" in request.FILES:
            image = request.FILES["degree_image"]
            upload = cloudinary.uploader.upload(
                image,
                folder="degree_images",
                resource_type="image"
            )
            if education and education.degree_image:
                old_public_id = get_public_id(education.degree_image)
                if old_public_id:
                    cloudinary.uploader.destroy(
                        old_public_id,
                        resource_type="image"
                    )
            data["degree_image"] = upload["secure_url"]
        if education:
            serializer = EducationSerializer(education, data=data, partial=True, context={"request": request})
        else:
            serializer = EducationSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True,
                    "message": (
                        "Education Updated Successfully!"
                        if education_id
                        else "Education Added Successfully!"
                    ),
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
                if education_id
                else status.HTTP_201_CREATED,
            )
        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except IntegrityError:
        return Response(
            {
                "success": False,
                "message": "This Education already exists."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    except Exception as e:
        return Response(
            {
                "success": False,
                "message": str(e)
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetEducation(request):
    education = Education.objects.filter(user=request.user)
    serializer = EducationSerializer(education, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Education fetched successfully!",
            "count": education.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteEducation(request, id):
    try:
        education = Education.objects.get(
            id=id,
            user=request.user
        )
    except Education.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Education record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    
    if education.degree_image:
        public_id = get_public_id(education.degree_image)
        if public_id:
            cloudinary.uploader.destroy(public_id,resource_type="image")
    education.delete()
    return Response(
        {
            "success": True,
            "message": "Education deleted successfully."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AddOrUpdateExperience(request):
    experience_id = request.data.get("id")
    if experience_id:
        try:
            experience = Experience.objects.get(id=experience_id, user=request.user)
        except Experience.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Experience record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ExperienceSerializer(experience, data=request.data, partial=True, context={"request": request})
    else:
        serializer = ExperienceSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True, 
                    "message": ("Experience Updated Successfully!" if experience_id else "Experience Added Successfully!"), 
                    "data": serializer.data
                },
                status=status.HTTP_200_OK if experience_id else status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "This Experience already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetExperience(request):
    experience = Experience.objects.filter(user=request.user)
    serializer = ExperienceSerializer(experience, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Experience fetched successfully!",
            "count": experience.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteExperience(request, id):
    try:
        experience = Experience.objects.get(id=id, user=request.user)
    except Experience.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Experience record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    experience.delete()
    return Response(
        {
            "success": True,
            "message": "Experience deleted successfully."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AddOrUpdateSkill(request):
    skill_id = request.data.get("id")
    if skill_id:
        try:
            skill = Skill.objects.get(id=skill_id, user=request.user)
        except Skill.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Skill record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = SkillSerializer(skill, data=request.data, partial=True, context={"request": request})
    else:
        serializer = SkillSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True, 
                    "message": ("Skill Updated Successfully!" if skill_id else "Skill Added Successfully!"), 
                    "data": serializer.data
                },
                status=status.HTTP_200_OK if skill_id else status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "This skill already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetSkill(request):
    skill = Skill.objects.filter(user=request.user)
    serializer = SkillSerializer(skill, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Skill fetched successfully!",
            "count": skill.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteSkill(request, id):
    try:
        skill = Skill.objects.get(id=id, user=request.user)
    except Skill.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Skill record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    skill.delete()
    return Response(
        {
            "success": True,
            "message": "Skill deleted successfully."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AddOrUpdateProject(request):
    project_id = request.data.get("id")
    if project_id:
        try:
            project = Project.objects.get(id=project_id, user=request.user)
        except Project.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Project record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ProjectSerializer(project, data=request.data, partial=True, context={"request": request})
    else:
        serializer = ProjectSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True, 
                    "message": ("Project Updated Successfully!" if project_id else "Project Added Successfully!"), 
                    "data": serializer.data
                },
                status=status.HTTP_200_OK if project_id else status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "This Project already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetProject(request):
    project = Project.objects.filter(user=request.user)
    serializer = ProjectSerializer(project, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Project fetched successfully!",
            "count": project.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteProject(request, id):
    try:
        project = Project.objects.get(id=id, user=request.user)
    except Project.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Project record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    project.delete()
    return Response(
        {
            "success": True,
            "message": "Project deleted successfully."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AddOrUpdateLanguage(request):
    language_id = request.data.get("id")
    if language_id:
        try:
            language = Language.objects.get(id=language_id, user=request.user)
        except Language.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Language record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = LanguageSerializer(language, data=request.data, partial=True, context={"request": request})
    else:
        serializer = LanguageSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True, 
                    "message": ("Language Updated Successfully!" if language_id else "Language Added Successfully!"), 
                    "data": serializer.data
                },
                status=status.HTTP_200_OK if language_id else status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "This Language already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetLanguage(request):
    language = Language.objects.filter(user=request.user)
    serializer = LanguageSerializer(language, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Language fetched successfully!",
            "count": language.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteLanguage(request, id):
    try:
        language = Language.objects.get(id=id, user=request.user)
    except Language.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Language record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    language.delete()
    return Response(
        {
            "success": True,
            "message": "Language deleted successfully."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def AddOrUpdateCertificate(request):
    certificate_id = request.data.get("id")
    if certificate_id:
        try:
            certificate = Certificate.objects.get(id=certificate_id, user=request.user)
        except Certificate.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Certificate record not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = CertificateSerializer(certificate, data=request.data, partial=True, context={"request": request})
    else:
        serializer = CertificateSerializer(data=request.data, context={"request": request})

    if serializer.is_valid():
        try:
            serializer.save(user=request.user)
            return Response(
                {
                    "success": True, 
                    "message": ("Certificate Updated Successfully!" if certificate_id else "Certificate Added Successfully!"), 
                    "data": serializer.data
                },
                status=status.HTTP_200_OK if certificate_id else status.HTTP_201_CREATED,
            )
        except IntegrityError:
            return Response(
                {
                    "success": False,
                    "message": "This Certificate already exists."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
    return Response(
        {
            "success": False,
            "errors": serializer.errors,
        },
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetCertificate(request):
    certificate = Certificate.objects.filter(user=request.user)
    serializer = CertificateSerializer(certificate, many=True, context={"request": request})
    return Response(
        {
            "success": True,
            "message": "Certificate fetched successfully!",
            "count": certificate.count(),
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def DeleteCertificate(request, id):
    try:
        certificate = Certificate.objects.get(id=id, user=request.user)
    except Certificate.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Certificate record not found."
            },
            status=status.HTTP_404_NOT_FOUND,
        )
    certificate.delete()
    return Response(
        {
            "success": True,
            "message": "Certificate deleted successfully."
        },
        status=status.HTTP_200_OK,
    )