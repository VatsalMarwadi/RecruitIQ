from django.http import HttpResponse
from .models import UserTable
from .serializers import UserSerializers
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
import jwt
from django.conf import settings
from canadmin.models import InstituteModel
from canadmin.serializers import InstituteSerializer

JWT_EXPIRY = timedelta(days=1)
JWT_ALGORITHM = "HS256"

# Create your views here.
def test(request):
    return HttpResponse("<h1>This Is Testing</h1>")

@api_view(['GET'])
@permission_classes([AllowAny])
def GetInstitute(request):
    institute = InstituteModel.objects.filter(is_active=True).order_by("name")
    serializer = InstituteSerializer(institute, many=True, context={'request': request})
    return Response(
        {
            "success": True,
            "message": "Institute fetched successfully!",
            "data": serializer.data,
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def SignUp(request):
    if UserTable.objects.filter(email=request.data.get("email")).exists():
        return Response({"success": False, "message": "Email Already Exists"}, status= status.HTTP_409_CONFLICT)
    serializer = UserSerializers(data = request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                "success": True, 
                "message": "User Registered Successfully!!!",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "institute": user.institute.name if user.institute else None
                }
            }, 
            status=status.HTTP_201_CREATED
        )
    return Response(
        {
            "success": False,
            "errors": serializer.errors
        }, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def LogIn(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"success": False, "message": "Email and Password are required."}, status= status.HTTP_400_BAD_REQUEST)
 
    try:
        user = UserTable.objects.get(email = email)
    except UserTable.DoesNotExist:
        return Response({"success": False, "message": "Invalid Email Or Password"}, status= status.HTTP_401_UNAUTHORIZED)
    
    if not user.check_password(password):
        return Response({"success": False, "message": "Invalid Email Or Password"}, status= status.HTTP_401_UNAUTHORIZED)
    
    if not user.is_active:
        return Response({"success": False, "message": "User Is No Longer Activated"}, status= status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    access['name'] = user.name
    access["email"] = user.email
    access["role"] = user.role

    return Response(
        {
            "success": True,
            "message": "Login Successful",
            "refresh": str(refresh),
            "access": str(access),
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def ForgotPassword(request):
    email = request.data.get("email")
    password = request.data.get("password")
    if not email or not password:
        return Response({"success": False, "message": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = UserTable.objects.get(email=email)
    except UserTable.DoesNotExist:
        return Response({"success": False, "message": "Email does not exist."}, status=status.HTTP_404_NOT_FOUND)

    if check_password(password, user.password):
        return Response({"success": False, "message": "New password cannot be the same as the old password."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()

    return Response({"success": True, "message": "Password updated successfully."}, status=status.HTTP_200_OK)