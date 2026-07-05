"""
自定义JWT认证类，添加详细的调试日志
"""
import logging
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.user.models import User

logger = logging.getLogger(__name__)


class CustomJWTAuthentication(JWTAuthentication):
    """
    自定义JWT认证类，添加详细的错误日志
    """
    
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            print(f"[JWT Auth DEBUG] No Authorization header found for {request.path}")
            logger.debug(f"[JWT Auth] No Authorization header found for {request.path}")
            return None
        
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            print(f"[JWT Auth DEBUG] No token found in header for {request.path}")
            logger.debug(f"[JWT Auth] No token found in header for {request.path}")
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            print(f"[JWT Auth DEBUG] Token validated successfully for {request.path}")
            logger.debug(f"[JWT Auth] Token validated successfully for {request.path}")
        except TokenError as e:
            print(f"[JWT Auth ERROR] Token validation failed for {request.path}: {str(e)}")
            logger.warning(f"[JWT Auth] Token validation failed for {request.path}: {str(e)}")
            raise InvalidToken(f"Token is invalid or expired: {str(e)}")
        
        user = self.get_user(validated_token)
        if user is None:
            print(f"[JWT Auth ERROR] User not found for token in {request.path}")
            logger.warning(f"[JWT Auth] User not found for token in {request.path}")
            return None
        
        print(f"[JWT Auth SUCCESS] Authentication successful for user {user.id} ({user.username}) on {request.path}")
        logger.debug(f"[JWT Auth] Authentication successful for user {user.id} on {request.path}")
        return (user, validated_token)
    
    def get_user(self, validated_token):
        """
        重写get_user方法，确保正确获取用户
        """
        try:
            user_id = validated_token['user_id']
            print(f"[JWT Auth DEBUG] Attempting to get user with ID: {user_id}")
            logger.debug(f"[JWT Auth] Attempting to get user with ID: {user_id}")
            user = User.objects.get(id=user_id)
            print(f"[JWT Auth DEBUG] User found: {user.username} (ID: {user.id})")
            logger.debug(f"[JWT Auth] User found: {user.username} (ID: {user.id})")
            return user
        except User.DoesNotExist:
            error_msg = f"[JWT Auth ERROR] User with ID {validated_token.get('user_id')} does not exist"
            print(error_msg)
            logger.error(error_msg)
            return None
        except KeyError:
            error_msg = f"[JWT Auth ERROR] Token missing 'user_id' claim. Token claims: {list(validated_token.keys())}"
            print(error_msg)
            logger.error(error_msg)
            return None
        except Exception as e:
            error_msg = f"[JWT Auth ERROR] Error getting user: {str(e)}"
            print(error_msg)
            logger.error(error_msg)
            import traceback
            print(traceback.format_exc())
            return None

