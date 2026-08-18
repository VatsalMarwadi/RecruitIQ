import logging
import random
from datetime import timedelta
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
import cloudinary
import cloudinary.uploader
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import (CandidateProfile, Education, Experience, Skill, Project, Language, Certificate)
from .serializers import (CandidateProfileSerializer, EducationSerializer, ExperienceSerializer, SkillSerializer, ProjectSerializer, LanguageSerializer, CertificateSerializer, CandidateDriveSerializer, CandidateDriveDetailSerializer, CandidateAptitudeQuestionSerializer, CandidateCodingQuestionSerializer, SaveCodingSubmissionSerializer, RunCodeSerializer, CodingQuestionSubmissionSerializer, CodingSubmissionSerializer)
from .services.execution_service import execute_code
from canadmin.models import (CodingQuestionSubmissionModel, DriveModel, RoundCandidateDecisionModel, RoundModel, AptitudeQuestionModel, RoundAttemptModel, AptitudeAnswerModel, CodingQuestionModel, CodingSubmissionModel, CodingTestCaseModel)
from canadmin.services import AutoStatusService

logger = logging.getLogger(__name__)

# Create your views here.
def test(request):
    return HttpResponse("<h1>This Is Candidate Testing!!!</h1>")

# candidate/views.py - Updated get_round_display_status

def get_round_display_status(round_obj, now=None):
    """
    Returns the effective display status of a round
    based on database status and configured timing.
    """
    if now is None:
        now = timezone.now()

    # Explicit final states
    if round_obj.status in ["completed", "cancelled"]:
        return round_obj.status

    # No timing configured
    if not round_obj.round_start_datetime:
        return round_obj.status

    start_time = round_obj.round_start_datetime
    
    # Use round_duration_minutes if available, otherwise fallback to duration_minutes
    duration = getattr(round_obj, 'round_duration_minutes', None) or getattr(round_obj, 'duration_minutes', 60)
    end_time = start_time + timedelta(minutes=duration)

    # Before round starts
    if now < start_time:
        return "pending"

    # During round
    if start_time <= now < end_time:
        return "active"

    # Duration completed
    return "completed"


def get_attempt_end_time(attempt):
    """
    Returns the exact expiry time of an attempt.
    """

    if not attempt.started_at:
        return None

    return attempt.started_at + timedelta(
        minutes=attempt.round.duration_minutes
    )


def get_remaining_seconds(attempt):
    """
    Returns remaining seconds for an active attempt.
    Uses test_duration_minutes from the round
    """
    if not attempt.started_at:
        return 0
    
    end_time = attempt.started_at + timedelta(minutes=attempt.round.test_duration_minutes)
    remaining = (end_time - timezone.now()).total_seconds()
    return max(int(remaining), 0)

# Update is_attempt_expired function
def is_attempt_expired(attempt):
    """
    Checks whether the candidate's attempt duration has expired.
    Uses test_duration_minutes from the round
    """
    if not attempt.started_at:
        return False
    
    end_time = attempt.started_at + timedelta(minutes=attempt.round.test_duration_minutes)
    return timezone.now() >= end_time


def validate_candidate_round_access(request, round_obj):
    """
    Validates that the authenticated candidate can access
    the requested round.
    """

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can access this round."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if not request.user.institute_id:
        return Response(
            {
                "success": False,
                "message": "You are not associated with any institute."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not round_obj.drive:
        return Response(
            {
                "success": False,
                "message": "This round is not associated with any drive."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if round_obj.drive.institute_id != request.user.institute_id:
        return Response(
            {
                "success": False,
                "message": "You don't have access to this round."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    return None


def validate_attempt_active(attempt):
    """
    Validates whether an attempt can still be modified.
    """

    if attempt.status in [
        "completed",
        "evaluated",
        "passed",
        "failed"
    ]:
        return Response(
            {
                "success": False,
                "message": "This attempt has already been completed."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if is_attempt_expired(attempt):
        return Response(
            {
                "success": False,
                "message": "The test duration has expired.",
                "attempt_id": attempt.id,
                "remaining_seconds": 0
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return None

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetAvailableDrives(request):
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    if not request.user.institute:
        return Response(
            {
                "success": False,
                "message": "You are not associated with any institute."
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Auto-update all statuses before showing available drives
    AutoStatusService.update_all()
    
    drives = DriveModel.objects.filter(
        institute=request.user.institute
    ).exclude(
        status="draft"
    ).select_related("institute").prefetch_related("rounds").order_by("-drive_date_time")
    
    serializer = CandidateDriveSerializer(drives, many=True)
    return Response(
        {
            "success": True,
            "message": "Drives Fetched Successfully!!",
            "data": serializer.data
        },
        status=status.HTTP_200_OK
    )

# candidate/views.py - Updated GetCandidateDriveDetails

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetCandidateDriveDetails(request, drive_id):
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    if not request.user.institute:
        return Response(
            {
                "success": False,
                "message": "You are not associated with any institute."
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    try:
        drive = (DriveModel.objects.select_related("institute").prefetch_related("rounds").exclude(status="draft").get(id=drive_id, institute=request.user.institute))
    except DriveModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Drive Does Not Found!!!"
            },
            status= status.HTTP_404_NOT_FOUND
        )
    
    # Get serialized drive data
    serializer = CandidateDriveDetailSerializer(drive)
    drive_data = serializer.data
    
    # Add candidate-specific round status for each round
    rounds = drive.rounds.all().order_by("round_order")
    rounds_with_status = []
    now = timezone.now()
    
    for round_obj in rounds:
        # Get the display status (calculated based on time)
        display_status = get_round_display_status(round_obj, now)
        
        attempt = RoundAttemptModel.objects.filter(
            candidate=request.user,
            round=round_obj
        ).first()
        
        # Default values
        final_status = "Not Started"
        attempt_score = None
        attempt_total_marks = None
        attempt_percentage = None
        decision_exists = False
        coding_submission_status = None
        
        if attempt:
            # Check if decision exists
            try:
                decision_obj = RoundCandidateDecisionModel.objects.get(attempt=attempt)
                decision_exists = True
                if decision_obj.decision == "shortlisted":
                    final_status = "Passed"
                elif decision_obj.decision == "rejected":
                    final_status = "Failed"
                else:
                    final_status = "Pending"
                attempt_score = decision_obj.score
                attempt_total_marks = decision_obj.total_marks
                attempt_percentage = float(decision_obj.percentage) if decision_obj.percentage else 0
            except RoundCandidateDecisionModel.DoesNotExist:
                # No decision - check attempt status
                if attempt.status == "completed":

                    if round_obj.round_type == "coding":

                        coding_submission = CodingSubmissionModel.objects.filter(
                            attempt=attempt
                        ).first()

                        if coding_submission:

                            coding_submission_status = {
                                "status": coding_submission.status,
                                "score": coding_submission.score,
                                "total_marks": coding_submission.total_marks,
                                "submitted_at": coding_submission.submitted_at,
                                "evaluated_at": coding_submission.evaluated_at
                            }

                            if coding_submission.status == "evaluated":
                                final_status = "Evaluated"
                            elif coding_submission.status == "submitted":
                                final_status = "Submitted - Awaiting Evaluation"
                            else:
                                final_status = "Awaiting Evaluation"

                        else:
                            final_status = "Awaiting Evaluation"

                    else:
                        final_status = "Awaiting Evaluation"

                elif attempt.status == "in_progress":
                    final_status = "In Progress"
                
                if not decision_exists:
                    attempt_score = attempt.score
                    attempt_total_marks = attempt.total_marks
                    if attempt.total_marks > 0:
                        attempt_percentage = round((attempt.score / attempt.total_marks) * 100, 2)
                    else:
                        attempt_percentage = 0
        
        # Calculate round end time
        round_end_datetime = None
        if round_obj.round_start_datetime:
            duration = getattr(round_obj, 'round_duration_minutes', None) or getattr(round_obj, 'duration_minutes', 60)
            round_end_datetime = round_obj.round_start_datetime + timedelta(minutes=duration)
        
        round_data = {
            "id": round_obj.id,
            "round_type": round_obj.round_type,
            "round_type_display": round_obj.get_round_type_display(),
            "round_order": round_obj.round_order,
            "status": round_obj.status,  # Database status
            "display_status": display_status,  # Calculated display status
            "round_duration_minutes": getattr(round_obj, 'round_duration_minutes', None),
            "test_duration_minutes": getattr(round_obj, 'test_duration_minutes', None),
            "round_start_datetime": round_obj.round_start_datetime,
            "round_end_datetime": round_end_datetime,
            "final_status": final_status,
            "attempt_score": attempt_score,
            "attempt_total_marks": attempt_total_marks,
            "attempt_percentage": attempt_percentage,
            "can_access": False,
            "is_locked": False,
            "lock_reason": None,
            "decision_exists": decision_exists,
            "coding_submission": coding_submission_status
        }
        
        # Check if candidate can access this round - USE DISPLAY STATUS
        if round_obj.round_order == 1:
            round_data["can_access"] = display_status == "active"
            if not round_data["can_access"]:
                if display_status == "pending":
                    round_data["lock_reason"] = "Round has not started yet"
                elif display_status == "completed":
                    round_data["lock_reason"] = "Round has ended"
                else:
                    round_data["lock_reason"] = "Round is not active yet"
        else:
            # Check previous round
            prev_round = RoundModel.objects.filter(
                drive=drive,
                round_order=round_obj.round_order - 1
            ).first()
            
            if prev_round:
                prev_attempt = RoundAttemptModel.objects.filter(
                    candidate=request.user,
                    round=prev_round
                ).first()
                
                if not prev_attempt:
                    round_data["can_access"] = False
                    round_data["is_locked"] = True
                    round_data["lock_reason"] = f"You must complete Round {round_obj.round_order - 1} first"
                elif prev_attempt.status == "in_progress":
                    round_data["can_access"] = False
                    round_data["is_locked"] = True
                    round_data["lock_reason"] = f"Complete your Round {round_obj.round_order - 1} attempt first"
                else:
                    try:
                        decision = RoundCandidateDecisionModel.objects.get(attempt=prev_attempt)
                        if decision.decision == "shortlisted":
                            round_data["can_access"] = display_status == "active"
                            if not round_data["can_access"]:
                                if display_status == "pending":
                                    round_data["lock_reason"] = "Round has not started yet"
                                elif display_status == "completed":
                                    round_data["lock_reason"] = "Round has ended"
                                else:
                                    round_data["lock_reason"] = "Round is not active yet"
                        else:
                            round_data["can_access"] = False
                            round_data["is_locked"] = True
                            round_data["lock_reason"] = f"You were not shortlisted in Round {round_obj.round_order - 1}"
                    except RoundCandidateDecisionModel.DoesNotExist:
                        round_data["can_access"] = False
                        round_data["is_locked"] = True
                        round_data["lock_reason"] = f"Round {round_obj.round_order - 1} result pending evaluation"
            else:
                round_data["can_access"] = False
                round_data["lock_reason"] = "Previous round not found"
        
        rounds_with_status.append(round_data)
    
    drive_data["rounds_with_status"] = rounds_with_status
    
    return Response(
        {
            "success": True,
            "message": "Drive Details Fetched Successfully!!",
            "data": drive_data
        },
        status= status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def StartAptitudeTest(request, round_id):
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can start aptitude tests."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        round_obj = RoundModel.objects.select_related(
            "drive",
            "drive__institute"
        ).get(
            id=round_id,
            round_type="aptitude"
        )
    except RoundModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Aptitude round not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    eligibility_error, eligible = check_candidate_round_eligibility(request.user, round_obj)
    if not eligible:
        return Response(eligibility_error, status=status.HTTP_403_FORBIDDEN)

    access_error = validate_candidate_round_access(request, round_obj)
    if access_error:
        return access_error

    now = timezone.now()

    # Check if test window is open
    is_open, message = is_test_window_open(round_obj, now)
    if not is_open:
        return Response(
            {
                "success": False,
                "message": message,
                "round_status": round_obj.status,
                "test_window_end": round_obj.round_start_datetime + timedelta(minutes=round_obj.test_duration_minutes)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get questions
    questions = list(AptitudeQuestionModel.objects.filter(round=round_obj))
    if not questions:
        return Response(
            {
                "success": False,
                "message": "No aptitude questions found for this round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    total_marks = sum(question.marks for question in questions)

    # Existing attempt
    existing_attempt = RoundAttemptModel.objects.filter(
        candidate=request.user,
        round=round_obj
    ).first()

    if existing_attempt:
        if existing_attempt.status in ["completed", "evaluated", "passed", "failed"]:
            return Response(
                {
                    "success": False,
                    "message": "You have already completed this aptitude test.",
                    "data": {
                        "attempt_id": existing_attempt.id,
                        "status": existing_attempt.status,
                        "score": existing_attempt.score,
                        "total_marks": existing_attempt.total_marks,
                        "submitted_at": existing_attempt.submitted_at
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if test duration expired (based on test_duration_minutes)
        test_end_time = existing_attempt.started_at + timedelta(minutes=round_obj.test_duration_minutes)
        if now >= test_end_time:
            # Auto-submit the attempt
            existing_attempt.status = "completed"
            existing_attempt.submitted_at = now
            existing_attempt.save()
            return Response(
                {
                    "success": False,
                    "message": "Test time has expired. Your answers have been auto-submitted.",
                    "data": {
                        "attempt_id": existing_attempt.id,
                        "status": "completed",
                        "score": existing_attempt.score,
                        "total_marks": existing_attempt.total_marks
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CandidateAptitudeQuestionSerializer(questions, many=True)
        remaining_seconds = int((test_end_time - now).total_seconds())
        
        return Response(
            {
                "success": True,
                "message": "Aptitude test already in progress.",
                "data": {
                    "attempt_id": existing_attempt.id,
                    "round_id": round_obj.id,
                    "round_type": round_obj.round_type,
                    "test_duration_minutes": round_obj.test_duration_minutes,
                    "started_at": existing_attempt.started_at,
                    "remaining_seconds": remaining_seconds,
                    "total_marks": existing_attempt.total_marks,
                    "score": existing_attempt.score,
                    "status": existing_attempt.status,
                    "questions": serializer.data
                }
            },
            status=status.HTTP_200_OK
        )

    # Shuffle only for a new attempt
    random.shuffle(questions)

    attempt = RoundAttemptModel.objects.create(
        candidate=request.user,
        round=round_obj,
        total_marks=total_marks,
        score=0,
        status="in_progress"
    )

    serializer = CandidateAptitudeQuestionSerializer(questions, many=True)
    test_end_time = attempt.started_at + timedelta(minutes=round_obj.test_duration_minutes)
    remaining_seconds = int((test_end_time - now).total_seconds())

    return Response(
        {
            "success": True,
            "message": "Aptitude test started successfully.",
            "data": {
                "attempt_id": attempt.id,
                "round_id": round_obj.id,
                "round_type": round_obj.round_type,
                "test_duration_minutes": round_obj.test_duration_minutes,
                "started_at": attempt.started_at,
                "remaining_seconds": remaining_seconds,
                "total_marks": total_marks,
                "score": 0,
                "status": attempt.status,
                "questions": serializer.data
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def SubmitAptitudeTest(request, attempt_id):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can submit aptitude tests."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        attempt = RoundAttemptModel.objects.select_related(
            "round",
            "round__drive",
            "round__drive__institute"
        ).get(
            id=attempt_id,
            candidate=request.user
        )

    except RoundAttemptModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Aptitude test attempt not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if attempt.round.round_type != "aptitude":
        return Response(
            {
                "success": False,
                "message": "This attempt does not belong to an aptitude round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    access_error = validate_candidate_round_access(
        request,
        attempt.round
    )

    if access_error:
        return access_error

    if attempt.status in [
        "completed",
        "evaluated",
        "passed",
        "failed"
    ]:
        return Response(
            {
                "success": False,
                "message": "This aptitude test has already been submitted."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check expiry
    expired = is_attempt_expired(attempt)

    answers = request.data.get("answers")

    if answers is None:
        answers = []

    if not isinstance(answers, list):
        return Response(
            {
                "success": False,
                "message": "Answers must be provided as a list."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    questions = AptitudeQuestionModel.objects.filter(
        round=attempt.round
    )

    if not questions.exists():
        return Response(
            {
                "success": False,
                "message": "No questions found for this aptitude round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    question_map = {
        question.id: question
        for question in questions
    }

    total_marks = questions.aggregate(
        total=Sum("marks")
    )["total"] or 0

    submitted_question_ids = set()

    for answer in answers:

        if not isinstance(answer, dict):
            return Response(
                {
                    "success": False,
                    "message": "Each answer must be an object."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        question_id = answer.get("question_id")

        if not question_id:
            return Response(
                {
                    "success": False,
                    "message": "Question ID is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if question_id in submitted_question_ids:
            return Response(
                {
                    "success": False,
                    "message": f"Duplicate answer submitted for question {question_id}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        submitted_question_ids.add(question_id)

        if question_id not in question_map:
            return Response(
                {
                    "success": False,
                    "message": f"Question {question_id} does not belong to this round."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        selected_option = answer.get("selected_option")

        if selected_option not in [
            "option_1",
            "option_2",
            "option_3",
            "option_4"
        ]:
            return Response(
                {
                    "success": False,
                    "message": f"Invalid option for question {question_id}."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    try:

        with transaction.atomic():

            for answer in answers:

                question = question_map[
                    answer["question_id"]
                ]

                selected_option = answer["selected_option"]

                is_correct = (
                    selected_option == question.correct_option
                )

                marks_obtained = (
                    question.marks
                    if is_correct
                    else 0
                )

                AptitudeAnswerModel.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={
                        "selected_option": selected_option,
                        "is_correct": is_correct,
                        "marks_obtained": marks_obtained
                    }
                )

            score = AptitudeAnswerModel.objects.filter(
                attempt=attempt
            ).aggregate(
                total=Sum("marks_obtained")
            )["total"] or 0

            submitted_at = timezone.now()

            attempt.score = score
            attempt.total_marks = total_marks
            attempt.submitted_at = submitted_at
            attempt.status = "completed"

            attempt.save(
                update_fields=[
                    "score",
                    "total_marks",
                    "submitted_at",
                    "status"
                ]
            )

    except Exception as e:

        logger.error(
            f"Error submitting aptitude test: "
            f"attempt={attempt_id}, error={str(e)}",
            exc_info=True
        )

        return Response(
            {
                "success": False,
                "message": "An error occurred while submitting the aptitude test."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    percentage = (
        round((score / total_marks) * 100, 2)
        if total_marks > 0
        else 0
    )

    attempted_questions = (
        AptitudeAnswerModel.objects.filter(
            attempt=attempt
        )
        .values("question")
        .distinct()
        .count()
    )

    total_questions = questions.count()

    return Response(
        {
            "success": True,
            "message": (
                "Aptitude test submitted successfully."
                if not expired
                else "Aptitude test submitted successfully after time limit."
            ),
            "data": {
                "attempt_id": attempt.id,
                "round_id": attempt.round.id,

                "total_questions": total_questions,
                "attempted_questions": attempted_questions,

                "score": score,
                "total_marks": total_marks,
                "percentage": percentage,

                "status": attempt.status,

                "started_at": attempt.started_at,
                "submitted_at": attempt.submitted_at,

                "time_expired": expired
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetAttemptStatus(request, round_id):
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can check attempt status."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        round_obj = RoundModel.objects.select_related(
            "drive",
            "drive__institute"
        ).get(
            id=round_id
        )
    except RoundModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Round not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    access_error = validate_candidate_round_access(
        request,
        round_obj
    )

    if access_error:
        return access_error

    now = timezone.now()
    display_status = get_round_display_status(round_obj, now)

    attempt = RoundAttemptModel.objects.filter(
        round=round_obj,
        candidate=request.user
    ).first()

    if not attempt:
        return Response(
            {
                "success": True,
                "message": "No attempt found for this round.",
                "data": {
                    "attempt_exists": False,
                    "round_id": round_obj.id,
                    "round_type": round_obj.round_type,
                    "round_status": round_obj.status,
                    "display_status": display_status
                }
            },
            status=status.HTTP_200_OK
        )

    score = attempt.score or 0
    total_marks = attempt.total_marks or 0

    percentage = (
        round((score / total_marks) * 100, 2)
        if total_marks > 0
        else 0
    )

    # Use test_duration_minutes for remaining time
    remaining_seconds = 0
    if attempt.status == "in_progress":
        test_duration = getattr(round_obj, 'test_duration_minutes', None) or getattr(round_obj, 'duration_minutes', 60)
        end_time = attempt.started_at + timedelta(minutes=test_duration)
        remaining = (end_time - now).total_seconds()
        remaining_seconds = max(int(remaining), 0)

    data = {
        "attempt_exists": True,
        "attempt_id": attempt.id,
        "round_id": round_obj.id,
        "round_type": round_obj.round_type,
        "round_status": round_obj.status,
        "display_status": display_status,
        "status": attempt.status,
        "score": score,
        "total_marks": total_marks,
        "percentage": percentage,
        "started_at": attempt.started_at,
        "submitted_at": attempt.submitted_at,
        "remaining_seconds": remaining_seconds
    }

    # ---------------------------------------------
    # CODING
    # ---------------------------------------------
    if round_obj.round_type == "coding":
        total_questions = CodingQuestionModel.objects.filter(
            round=round_obj
        ).count()

        question_submissions = CodingQuestionSubmissionModel.objects.filter(
            attempt=attempt
        )

        attempted_questions = question_submissions.values(
            "question"
        ).distinct().count()

        submitted_questions = question_submissions.filter(
            status="submitted"
        ).values(
            "question"
        ).distinct().count()

        saved_questions = question_submissions.filter(
            status="saved"
        ).values(
            "question"
        ).distinct().count()

        coding_submission = CodingSubmissionModel.objects.filter(
            attempt=attempt
        ).first()

        data.update(
            {
                "total_questions": total_questions,
                "attempted_questions": attempted_questions,
                "submitted_questions": submitted_questions,
                "saved_questions": saved_questions,
                "remaining_questions": max(
                    total_questions - submitted_questions,
                    0
                ),
                "coding_submission_exists": coding_submission is not None,
                "coding_submission_id": coding_submission.id if coding_submission else None
            }
        )

    # ---------------------------------------------
    # APTITUDE
    # ---------------------------------------------
    elif round_obj.round_type == "aptitude":
        total_questions = AptitudeQuestionModel.objects.filter(
            round=round_obj
        ).count()

        attempted_questions = AptitudeAnswerModel.objects.filter(
            attempt=attempt
        ).values(
            "question"
        ).distinct().count()

        data.update(
            {
                "total_questions": total_questions,
                "attempted_questions": attempted_questions,
                "remaining_questions": max(
                    total_questions - attempted_questions,
                    0
                )
            }
        )

    return Response(
        {
            "success": True,
            "message": "Attempt status fetched successfully.",
            "data": data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetRoundDetails(request, round_id):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can view round details."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        round_obj = RoundModel.objects.select_related(
            "drive",
            "drive__institute"
        ).get(
            id=round_id
        )

    except RoundModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Round not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    access_error = validate_candidate_round_access(
        request,
        round_obj
    )

    if access_error:
        return access_error

    now = timezone.now()

    display_status = get_round_display_status(
        round_obj,
        now
    )

    attempt = RoundAttemptModel.objects.filter(
        round=round_obj,
        candidate=request.user
    ).first()

    attempt_data = {
        "attempt_exists": False,
        "attempt_id": None,
        "attempt_status": None,
        "score": 0,
        "total_marks": 0,
        "percentage": 0,
        "started_at": None,
        "submitted_at": None,
        "remaining_seconds": 0
    }

    if attempt:
        score = attempt.score or 0
        total_marks = attempt.total_marks or 0

        percentage = (
            round((score / total_marks) * 100, 2)
            if total_marks > 0
            else 0
        )

        # Use test_duration_minutes for remaining time
        remaining_seconds = 0
        if attempt.status == "in_progress":
            test_duration = getattr(round_obj, 'test_duration_minutes', None) or getattr(round_obj, 'duration_minutes', 60)
            end_time = attempt.started_at + timedelta(minutes=test_duration)
            remaining = (end_time - now).total_seconds()
            remaining_seconds = max(int(remaining), 0)

        attempt_data = {
            "attempt_exists": True,
            "attempt_id": attempt.id,
            "attempt_status": attempt.status,
            "score": score,
            "total_marks": total_marks,
            "percentage": percentage,
            "started_at": attempt.started_at,
            "submitted_at": attempt.submitted_at,
            "remaining_seconds": remaining_seconds
        }

    total_questions = 0
    attempted_questions = 0
    submitted_questions = 0
    saved_questions = 0

    # ---------------------------------------------
    # APTITUDE
    # ---------------------------------------------

    if round_obj.round_type == "aptitude":
        total_questions = AptitudeQuestionModel.objects.filter(
            round=round_obj
        ).count()

        if attempt:
            attempted_questions = AptitudeAnswerModel.objects.filter(
                attempt=attempt
            ).values(
                "question"
            ).distinct().count()

    # ---------------------------------------------
    # CODING
    # ---------------------------------------------

    elif round_obj.round_type == "coding":
        total_questions = CodingQuestionModel.objects.filter(
            round=round_obj
        ).count()

        if attempt:
            submissions = CodingQuestionSubmissionModel.objects.filter(
                attempt=attempt
            )

            attempted_questions = submissions.values(
                "question"
            ).distinct().count()

            submitted_questions = submissions.filter(
                status="submitted"
            ).values(
                "question"
            ).distinct().count()

            saved_questions = submissions.filter(
                status="saved"
            ).values(
                "question"
            ).distinct().count()

    # ---------------------------------------------
    # Final coding submission
    # ---------------------------------------------

    coding_submission_data = None

    if round_obj.round_type == "coding" and attempt:
        coding_submission = CodingSubmissionModel.objects.filter(
            attempt=attempt
        ).first()

        if coding_submission:
            coding_submission_data = {
                "submission_id": coding_submission.id,
                "total_questions": coding_submission.total_questions,
                "attempted_questions": coding_submission.attempted_questions,
                "total_marks": coding_submission.total_marks,
                "score": coding_submission.score,
                "status": coding_submission.status,
                "submitted_at": coding_submission.submitted_at,
                "evaluated_at": coding_submission.evaluated_at
            }

    # ---------------------------------------------
    # Aptitude result
    # ---------------------------------------------

    aptitude_result_data = None

    if round_obj.round_type == "aptitude" and attempt:
        aptitude_result_data = {
            "score": attempt.score or 0,
            "total_marks": attempt.total_marks or 0,
            "percentage": (
                round(
                    ((attempt.score or 0) /
                     attempt.total_marks) * 100,
                    2
                )
                if attempt.total_marks
                else 0
            ),
            "status": attempt.status,
            "submitted_at": attempt.submitted_at
        }

    # Get duration values
    round_duration = getattr(round_obj, 'round_duration_minutes', None) or getattr(round_obj, 'duration_minutes', 60)
    test_duration = getattr(round_obj, 'test_duration_minutes', None) or round_duration

    response_data = {
        "round": {
            "id": round_obj.id,
            "round_type": round_obj.round_type,
            "round_type_display": round_obj.get_round_type_display(),
            "round_order": round_obj.round_order,
            "status": round_obj.status,
            "display_status": display_status,
            "round_duration_minutes": round_duration,
            "test_duration_minutes": test_duration,
            "duration_minutes": round_duration,  # For backward compatibility
            "round_start_datetime": round_obj.round_start_datetime,
            "meeting_link": round_obj.meeting_link,
            "created_at": round_obj.created_at,
            "updated_at": round_obj.updated_at
        },

        "drive": {
            "id": round_obj.drive.id,
            "title": round_obj.drive.title,
            "status": round_obj.drive.status
        },

        "questions": {
            "total_questions": total_questions,
            "attempted_questions": attempted_questions,
            "submitted_questions": submitted_questions,
            "saved_questions": saved_questions,
            "remaining_questions": max(
                total_questions - submitted_questions,
                0
            )
        },

        "attempt": attempt_data,
        "aptitude_result": aptitude_result_data,
        "coding_submission": coding_submission_data
    }

    return Response(
        {
            "success": True,
            "message": "Round details fetched successfully.",
            "data": response_data
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def StartCodingTest(request, round_id):
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can start coding tests."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        round_obj = RoundModel.objects.select_related(
            "drive",
            "drive__institute"
        ).get(
            id=round_id,
            round_type="coding"
        )
    except RoundModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Coding round not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    eligibility_error, eligible = check_candidate_round_eligibility(request.user, round_obj)
    if not eligible:
        return Response(eligibility_error, status=status.HTTP_403_FORBIDDEN)

    access_error = validate_candidate_round_access(request, round_obj)
    if access_error:
        return access_error

    now = timezone.now()

    # Check if test window is open
    is_open, message = is_test_window_open(round_obj, now)
    if not is_open:
        return Response(
            {
                "success": False,
                "message": message,
                "round_status": round_obj.status,
                "test_window_end": round_obj.round_start_datetime + timedelta(minutes=round_obj.test_duration_minutes)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    questions = list(CodingQuestionModel.objects.filter(round=round_obj).order_by("id"))
    if not questions:
        return Response(
            {
                "success": False,
                "message": "No coding questions found for this round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    total_marks = sum(question.marks for question in questions)

    attempt, created = RoundAttemptModel.objects.get_or_create(
        candidate=request.user,
        round=round_obj,
        defaults={
            "total_marks": total_marks,
            "score": 0,
            "status": "in_progress"
        }
    )

    if not created:
        if attempt.status in ["completed", "evaluated", "passed", "failed"]:
            return Response(
                {
                    "success": False,
                    "message": "You have already completed this coding test.",
                    "data": {
                        "attempt_id": attempt.id,
                        "status": attempt.status,
                        "score": attempt.score,
                        "total_marks": attempt.total_marks,
                        "submitted_at": attempt.submitted_at
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if test duration expired
        test_end_time = attempt.started_at + timedelta(minutes=round_obj.test_duration_minutes)
        if now >= test_end_time:
            attempt.status = "completed"
            attempt.submitted_at = now
            attempt.save()
            return Response(
                {
                    "success": False,
                    "message": "Test time has expired. Your coding round has been auto-submitted.",
                    "data": {
                        "attempt_id": attempt.id,
                        "status": "completed",
                        "score": attempt.score,
                        "total_marks": attempt.total_marks
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

    question_submissions = (
        CodingQuestionSubmissionModel.objects
        .filter(attempt=attempt)
        .values(
            "id",
            "question_id",
            "language",
            "status",
            "total_test_cases",
            "passed_test_cases",
            "score",
            "submitted_at",
            "evaluated_at"
        )
    )

    serializer = CandidateCodingQuestionSerializer(questions, many=True)
    test_end_time = attempt.started_at + timedelta(minutes=round_obj.test_duration_minutes)
    remaining_seconds = int((test_end_time - now).total_seconds())

    return Response(
        {
            "success": True,
            "message": "Coding test started successfully." if created else "Coding test already in progress.",
            "data": {
                "attempt_id": attempt.id,
                "round_id": round_obj.id,
                "round_type": round_obj.round_type,
                "test_duration_minutes": round_obj.test_duration_minutes,
                "started_at": attempt.started_at,
                "remaining_seconds": remaining_seconds,
                "total_marks": attempt.total_marks,
                "score": attempt.score,
                "status": attempt.status,
                "questions": serializer.data,
                "question_submissions": list(question_submissions)
            }
        },
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def SaveCodingCode(request):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can save code."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    attempt_id = request.data.get("attempt")
    question_id = request.data.get("question")
    language = request.data.get("language")
    code = request.data.get("code", "")

    if not attempt_id or not question_id or not language:
        return Response(
            {
                "success": False,
                "message": (
                    "attempt, question and language are required."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        attempt = RoundAttemptModel.objects.select_related(
            "round",
            "round__drive",
            "round__drive__institute"
        ).get(
            id=attempt_id,
            candidate=request.user
        )

    except RoundAttemptModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Invalid attempt."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if attempt.round.round_type != "coding":
        return Response(
            {
                "success": False,
                "message": "This is not a coding attempt."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    access_error = validate_candidate_round_access(
        request,
        attempt.round
    )

    if access_error:
        return access_error

    attempt_error = validate_attempt_active(attempt)

    if attempt_error:
        return attempt_error

    try:
        question = CodingQuestionModel.objects.get(
            id=question_id,
            round=attempt.round
        )

    except CodingQuestionModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Question does not belong to this coding round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    valid_languages = [
        "python",
        "java",
        "cpp",
        "c",
        "javascript"
    ]

    if language not in valid_languages:
        return Response(
            {
                "success": False,
                "message": "Invalid programming language."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    submission, created = (
        CodingQuestionSubmissionModel.objects
        .update_or_create(
            attempt=attempt,
            question=question,
            defaults={
                "language": language,
                "code": code
            }
        )
    )

    return Response(
        {
            "success": True,
            "message": (
                "Code saved successfully."
                if created
                else "Code updated successfully."
            ),
            "data": {
                "submission_id": submission.id,
                "attempt_id": attempt.id,
                "question_id": question.id,
                "language": submission.language,
                "status": submission.status,
                "code": submission.code,
                "submitted_at": submission.submitted_at,
                "evaluated_at": submission.evaluated_at,
                "remaining_seconds": get_remaining_seconds(attempt)
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def RunCodingCode(request):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can run code."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = RunCodeSerializer(
        data=request.data
    )

    if not serializer.is_valid():

        return Response(
            {
                "success": False,
                "message": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    attempt = serializer.validated_data["attempt"]
    question = serializer.validated_data["question"]
    language = serializer.validated_data["language"]
    code = serializer.validated_data["code"]

    if attempt.candidate != request.user:

        return Response(
            {
                "success": False,
                "message": "Invalid attempt."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    if attempt.round.round_type != "coding":

        return Response(
            {
                "success": False,
                "message": "This is not a coding attempt."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    attempt_error = validate_attempt_active(
        attempt
    )

    if attempt_error:
        return attempt_error

    if question.round_id != attempt.round_id:

        return Response(
            {
                "success": False,
                "message": (
                    "This question does not belong "
                    "to this coding round."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    sample_test_cases = CodingTestCaseModel.objects.filter(
        question=question,
        is_sample=True
    )

    if not sample_test_cases.exists():

        return Response(
            {
                "success": False,
                "message": "No sample test cases found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    results = []

    for test_case in sample_test_cases:

        execution = execute_code(
            language=language,
            code=code,
            stdin=test_case.input_data
        )

        stdout = execution.get("stdout", "")
        stderr = execution.get("stderr", "")

        passed = (
            stdout.strip()
            == test_case.expected_output.strip()
        )

        results.append(
            {
                "test_case_id": test_case.id,

                "input": test_case.input_data,

                # Sample expected output can be shown
                "expected_output": (
                    test_case.expected_output
                ),

                "your_output": stdout,

                "stderr": stderr,

                "passed": passed,

                "execution_status": (
                    execution.get(
                        "status",
                        "completed"
                    )
                )
            }
        )

    return Response(
        {
            "success": True,
            "message": "Code executed successfully.",

            "data": {
                "question_id": question.id,

                "language": language,

                "results": results,

                "remaining_seconds": (
                    get_remaining_seconds(attempt)
                )
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def SubmitCodingQuestion(request):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can submit code."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    attempt_id = request.data.get("attempt")
    question_id = request.data.get("question")
    language = request.data.get("language")
    code = request.data.get("code")

    if not attempt_id or not question_id or not language:
        return Response(
            {
                "success": False,
                "message": (
                    "Missing required fields: "
                    "attempt, question, language"
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        attempt = RoundAttemptModel.objects.select_related(
            "round",
            "round__drive",
            "round__drive__institute"
        ).get(
            id=attempt_id,
            candidate=request.user
        )

    except RoundAttemptModel.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "Invalid coding attempt."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if attempt.round.round_type != "coding":

        return Response(
            {
                "success": False,
                "message": "This attempt does not belong to a coding round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    access_error = validate_candidate_round_access(
        request,
        attempt.round
    )

    if access_error:
        return access_error

    attempt_error = validate_attempt_active(
        attempt
    )

    if attempt_error:
        return attempt_error

    try:

        question = CodingQuestionModel.objects.get(
            id=question_id,
            round=attempt.round
        )

    except CodingQuestionModel.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "Invalid coding question."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if language not in [
        "python",
        "java",
        "cpp",
        "c",
        "javascript"
    ]:

        return Response(
            {
                "success": False,
                "message": "Invalid programming language."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    test_cases = CodingTestCaseModel.objects.filter(
        question=question
    )

    if not test_cases.exists():

        return Response(
            {
                "success": False,
                "message": "No test cases found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    total_test_cases = test_cases.count()

    passed_test_cases = 0

    results = []

    for test_case in test_cases:

        execution = execute_code(
            language=language,
            code=code or "",
            stdin=test_case.input_data
        )

        stdout = execution.get(
            "stdout",
            ""
        )

        stderr = execution.get(
            "stderr",
            ""
        )

        passed = (
            stdout.strip()
            == test_case.expected_output.strip()
        )

        if passed:
            passed_test_cases += 1

        result = {
            "test_case_id": test_case.id,

            "passed": passed,

            "your_output": stdout,

            "error": stderr,

            "execution_status": execution.get(
                "status",
                "completed"
            )
        }

        # DO NOT expose expected output
        # for hidden test cases.
        if test_case.is_sample:
            result["expected_output"] = (
                test_case.expected_output
            )

        results.append(result)

    score = (
        int(
            (passed_test_cases / total_test_cases)
            * question.marks
        )
        if total_test_cases > 0
        else 0
    )

    evaluated_at = timezone.now()

    question_submission, created = (
        CodingQuestionSubmissionModel.objects.update_or_create(
            attempt=attempt,
            question=question,

            defaults={
                "language": language,

                "code": code or "",

                "total_test_cases": total_test_cases,

                "passed_test_cases": passed_test_cases,

                "score": score,

                "status": "submitted",

                "evaluated_at": evaluated_at
            }
        )
    )

    submitted_count = (
        CodingQuestionSubmissionModel.objects.filter(
            attempt=attempt,
            status="submitted"
        )
        .values("question")
        .distinct()
        .count()
    )

    total_questions = CodingQuestionModel.objects.filter(
        round=attempt.round
    ).count()

    return Response(
        {
            "success": True,

            "message": (
                "Question submitted successfully."
                if created
                else "Question submission updated successfully."
            ),

            "data": {

                "question_submission_id": (
                    question_submission.id
                ),

                "attempt_id": attempt.id,

                "question_id": question.id,

                "score": score,

                "total_test_cases": total_test_cases,

                "passed_test_cases": passed_test_cases,

                "status": question_submission.status,

                "submitted_questions": submitted_count,

                "total_questions": total_questions,

                "remaining_questions": max(
                    total_questions - submitted_count,
                    0
                ),

                "results": results,

                "evaluated_at": (
                    question_submission.evaluated_at
                ),

                "remaining_seconds": (
                    get_remaining_seconds(attempt)
                )
            }
        },
        status=status.HTTP_200_OK
    )

# views.py - Updated SubmitCodingRound

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def SubmitCodingRound(request):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can submit coding round."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    attempt_id = request.data.get("attempt")

    if not attempt_id:
        return Response(
            {
                "success": False,
                "message": "Attempt ID is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        attempt = RoundAttemptModel.objects.select_related(
            "round",
            "round__drive",
            "round__drive__institute"
        ).get(
            id=attempt_id,
            candidate=request.user
        )

    except RoundAttemptModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Invalid coding round attempt."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if attempt.round.round_type != "coding":
        return Response(
            {
                "success": False,
                "message": "This attempt does not belong to a coding round."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    access_error = validate_candidate_round_access(
        request,
        attempt.round
    )

    if access_error:
        return access_error

    if attempt.status in [
        "completed",
        "evaluated",
        "passed",
        "failed"
    ]:
        return Response(
            {
                "success": False,
                "message": "Coding round already submitted."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    expired = is_attempt_expired(attempt)

    try:
        with transaction.atomic():

            questions = CodingQuestionModel.objects.filter(
                round=attempt.round
            )

            total_questions = questions.count()

            if total_questions == 0:
                return Response(
                    {
                        "success": False,
                        "message": "No coding questions found."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            question_submissions = (
                CodingQuestionSubmissionModel.objects.filter(
                    attempt=attempt
                )
            )

            submitted_questions = (
                question_submissions
                .filter(status="submitted")
                .values("question")
                .distinct()
                .count()
            )

            # Require every question
            if submitted_questions != total_questions:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Please submit all coding questions "
                            "before final submission."
                        ),
                        "data": {
                            "total_questions": total_questions,
                            "submitted_questions": submitted_questions,
                            "remaining_questions": (
                                total_questions -
                                submitted_questions
                            )
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            total_marks = (
                questions.aggregate(
                    total=Sum("marks")
                )["total"] or 0
            )

            total_score = (
                question_submissions
                .filter(status="submitted")
                .aggregate(
                    total=Sum("score")
                )["total"] or 0
            )

            attempted_questions = (
                question_submissions
                .filter(status="submitted")
                .values("question")
                .distinct()
                .count()
            )

            percentage = (
                round(
                    (total_score / total_marks) * 100,
                    2
                )
                if total_marks > 0
                else 0
            )

            submitted_at = timezone.now()

            # ---------------------------------------
            # FINAL CODING SUBMISSION
            # ---------------------------------------

            coding_submission = (
                CodingSubmissionModel.objects.create(
                    attempt=attempt,
                    total_questions=total_questions,
                    attempted_questions=attempted_questions,
                    total_marks=total_marks,
                    score=total_score,
                    status="evaluated",
                    submitted_at=submitted_at,
                    evaluated_at=submitted_at
                )
            )

            # ---------------------------------------
            # UPDATE ROUND ATTEMPT
            # ---------------------------------------

            attempt.score = total_score
            attempt.total_marks = total_marks
            attempt.submitted_at = submitted_at
            attempt.status = "completed"

            attempt.save(
                update_fields=[
                    "score",
                    "total_marks",
                    "submitted_at",
                    "status"
                ]
            )

        return Response(
            {
                "success": True,
                "message": (
                    "Coding round submitted successfully."
                ),
                "data": {
                    "submission_id": coding_submission.id,
                    "attempt_id": attempt.id,
                    "round_id": attempt.round.id,

                    "total_questions": total_questions,
                    "attempted_questions": attempted_questions,

                    "total_marks": total_marks,
                    "score": total_score,
                    "percentage": percentage,

                    "status": coding_submission.status,

                    "submitted_at": coding_submission.submitted_at,
                    "evaluated_at": coding_submission.evaluated_at,

                    "time_expired": expired
                }
            },
            status=status.HTTP_201_CREATED
        )

    except Exception as e:

        logger.error(
            f"Error submitting coding round "
            f"attempt={attempt_id}: {str(e)}",
            exc_info=True
        )

        return Response(
            {
                "success": False,
                "message": (
                    "An error occurred while "
                    "submitting the coding round."
                )
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_saved_submissions(request, attempt_id):

    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Only candidates can view submissions."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    try:

        attempt = RoundAttemptModel.objects.select_related(
            "round"
        ).get(
            id=attempt_id,
            candidate=request.user
        )

    except RoundAttemptModel.DoesNotExist:

        return Response(
            {
                "success": False,
                "message": "Attempt not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    if attempt.round.round_type != "coding":

        return Response(
            {
                "success": False,
                "message": "This is not a coding attempt."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    submissions = (
        CodingQuestionSubmissionModel.objects
        .filter(
            attempt=attempt
        )
        .select_related("question")
        .order_by("question_id")
    )

    data = []

    for submission in submissions:

        data.append(
            {
                "id": submission.id,

                "question_id": submission.question.id,

                "language": submission.language,

                "code": submission.code,

                "status": submission.status,

                "score": submission.score,

                "total_test_cases": (
                    submission.total_test_cases
                ),

                "passed_test_cases": (
                    submission.passed_test_cases
                ),

                "submitted_at": (
                    submission.submitted_at
                ),

                "evaluated_at": (
                    submission.evaluated_at
                )
            }
        )

    submitted_count = submissions.filter(
        status="submitted"
    ).values(
        "question"
    ).distinct().count()

    saved_count = submissions.filter(
        status="saved"
    ).values(
        "question"
    ).distinct().count()

    total_questions = CodingQuestionModel.objects.filter(
        round=attempt.round
    ).count()

    return Response(
        {
            "success": True,

            "data": {

                "attempt_id": attempt.id,

                "total_questions": total_questions,

                "attempted_questions": (
                    submissions.values(
                        "question"
                    )
                    .distinct()
                    .count()
                ),

                "submitted_questions": submitted_count,

                "saved_questions": saved_count,

                "remaining_questions": max(
                    total_questions - submitted_count,
                    0
                ),

                "submissions": data
            }
        },
        status=status.HTTP_200_OK
    )

def check_candidate_round_eligibility(candidate, round_obj):
    """
    Check if a candidate is eligible to access a round.
    - First round (round_order=1): Always accessible if active
    - Subsequent rounds: Candidate must have passed (shortlisted) the previous round
    """
    # If it's the first round, allow access
    if round_obj.round_order == 1:
        return None, True
    
    # Get the previous round
    previous_round = RoundModel.objects.filter(
        drive=round_obj.drive,
        round_order=round_obj.round_order - 1
    ).first()
    
    if not previous_round:
        return None, False
    
    # Check if candidate has an attempt for the previous round
    previous_attempt = RoundAttemptModel.objects.filter(
        candidate=candidate,
        round=previous_round
    ).first()
    
    if not previous_attempt:
        return {
            "success": False,
            "message": f"You must complete Round {round_obj.round_order - 1} before accessing this round.",
            "eligible": False
        }, False
    
    # Check if candidate passed the previous round
    try:
        decision = RoundCandidateDecisionModel.objects.get(attempt=previous_attempt)
        if decision.decision == "shortlisted":
            return None, True
        else:
            return {
                "success": False,
                "message": f"You were not shortlisted in Round {round_obj.round_order - 1}. You cannot access this round.",
                "eligible": False,
                "decision": decision.decision
            }, False
    except RoundCandidateDecisionModel.DoesNotExist:
        return {
            "success": False,
            "message": f"Your Round {round_obj.round_order - 1} result is pending evaluation.",
            "eligible": False
        }, False

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def GetCandidateRoundStatus(request, drive_id):
    """Get candidate's status for all rounds in a drive"""
    
    if request.user.role != "candidate":
        return Response(
            {
                "success": False,
                "message": "Permission denied."
            },
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        drive = DriveModel.objects.get(id=drive_id)
    except DriveModel.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Drive not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get all rounds for this drive, ordered by round_order
    rounds = RoundModel.objects.filter(drive=drive).order_by("round_order")
    
    round_statuses = []
    
    for round_obj in rounds:
        attempt = RoundAttemptModel.objects.filter(
            candidate=request.user,
            round=round_obj
        ).first()
        
        # Default values
        candidate_decision = None
        final_status = "Not Started"
        coding_submission_status = None
        decision_exists = False
        score = None
        total_marks = None
        percentage = None
        
        if attempt:
            score = attempt.score
            total_marks = attempt.total_marks
            if attempt.total_marks and attempt.total_marks > 0:
                percentage = round((attempt.score / attempt.total_marks) * 100, 2)
            else:
                percentage = 0
                
            # Check if decision exists
            try:
                decision_obj = RoundCandidateDecisionModel.objects.get(attempt=attempt)
                candidate_decision = {
                    "decision": decision_obj.decision,
                    "score": decision_obj.score,
                    "total_marks": decision_obj.total_marks,
                    "percentage": float(decision_obj.percentage) if decision_obj.percentage else 0
                }
                decision_exists = True
                if decision_obj.decision == "shortlisted":
                    final_status = "Passed"
                elif decision_obj.decision == "rejected":
                    final_status = "Failed"
                else:
                    final_status = "Pending"
                    
                # Override score with decision values
                score = decision_obj.score
                total_marks = decision_obj.total_marks
                percentage = float(decision_obj.percentage) if decision_obj.percentage else 0
                
            except RoundCandidateDecisionModel.DoesNotExist:
                # No decision - check attempt status
                if attempt.status == "completed":
                    # Check if it's a coding round
                    if round_obj.round_type == "coding":
                        coding_submission = CodingSubmissionModel.objects.filter(attempt=attempt).first()
                        if coding_submission:
                            coding_submission_status = {
                                "status": coding_submission.status,
                                "score": coding_submission.score,
                                "total_marks": coding_submission.total_marks,
                                "submitted_at": coding_submission.submitted_at,
                                "evaluated_at": coding_submission.evaluated_at
                            }
                            # Always set to "Submitted - Awaiting Evaluation" for coding rounds with submission
                            if coding_submission.status == "evaluated":
                                final_status = "Evaluated"
                            elif coding_submission.status == "submitted":
                                final_status = "Submitted - Awaiting Evaluation"
                            else:
                                final_status = "Awaiting Evaluation"
                            
                            # Override score with submission values
                            score = coding_submission.score
                            total_marks = coding_submission.total_marks
                            if coding_submission.total_marks and coding_submission.total_marks > 0:
                                percentage = round((coding_submission.score / coding_submission.total_marks) * 100, 2)
                            else:
                                percentage = 0
                        else:
                            final_status = "Awaiting Evaluation"
                    else:
                        final_status = "Awaiting Evaluation"
                elif attempt.status == "in_progress":
                    final_status = "In Progress"
        
        status_data = {
            "round_id": round_obj.id,
            "round_order": round_obj.round_order,
            "round_type": round_obj.round_type,
            "round_type_display": round_obj.get_round_type_display(),
            "round_status": round_obj.status,
            "can_access": False,
            "attempt_status": attempt.status if attempt else None,
            "decision": candidate_decision["decision"] if candidate_decision else None,
            "is_locked": False,
            "lock_reason": None,
            "candidate_decision": candidate_decision,
            "final_status": final_status,
            "decision_exists": decision_exists,
            "coding_submission": coding_submission_status,
            "score": score,
            "total_marks": total_marks,
            "percentage": percentage
        }
        
        # Check if candidate can access this round
        if round_obj.round_order == 1:
            status_data["can_access"] = round_obj.status == "active"
            if not status_data["can_access"]:
                status_data["lock_reason"] = "Round is not active yet"
        else:
            # Check previous round
            prev_round = RoundModel.objects.filter(
                drive=drive,
                round_order=round_obj.round_order - 1
            ).first()
            
            if prev_round:
                prev_attempt = RoundAttemptModel.objects.filter(
                    candidate=request.user,
                    round=prev_round
                ).first()
                
                if not prev_attempt:
                    status_data["can_access"] = False
                    status_data["is_locked"] = True
                    status_data["lock_reason"] = f"You must complete Round {round_obj.round_order - 1} first"
                elif prev_attempt.status == "in_progress":
                    status_data["can_access"] = False
                    status_data["is_locked"] = True
                    status_data["lock_reason"] = f"Complete your Round {round_obj.round_order - 1} attempt first"
                else:
                    try:
                        decision = RoundCandidateDecisionModel.objects.get(attempt=prev_attempt)
                        if decision.decision == "shortlisted":
                            status_data["can_access"] = round_obj.status == "active"
                            if not status_data["can_access"]:
                                status_data["lock_reason"] = "Round is not active yet"
                        else:
                            status_data["can_access"] = False
                            status_data["is_locked"] = True
                            status_data["lock_reason"] = f"You were not shortlisted in Round {round_obj.round_order - 1}"
                    except RoundCandidateDecisionModel.DoesNotExist:
                        status_data["can_access"] = False
                        status_data["is_locked"] = True
                        status_data["lock_reason"] = f"Round {round_obj.round_order - 1} result pending evaluation"
            else:
                status_data["can_access"] = False
                status_data["lock_reason"] = "Previous round not found"
        
        round_statuses.append(status_data)
    
    return Response(
        {
            "success": True,
            "message": "Round status fetched successfully.",
            "data": {
                "drive_id": drive.id,
                "drive_title": drive.title,
                "rounds": round_statuses
            }
        },
        status=status.HTTP_200_OK
    )

def is_test_window_open(round_obj, now=None):
    """
    Check if the test window is currently open.
    Test window is open when round is active AND current time is within
    test_duration_minutes from round_start_datetime
    """
    if now is None:
        now = timezone.now()
    
    if round_obj.status != 'active':
        return False, "Round is not active"
    
    # Test window is from round_start to round_start + test_duration_minutes
    test_window_end = round_obj.round_start_datetime + timedelta(minutes=round_obj.test_duration_minutes)
    
    if now < round_obj.round_start_datetime:
        return False, "Round has not started yet"
    
    if now > test_window_end:
        return False, "Test window has closed"
    
    return True, "Test window is open"