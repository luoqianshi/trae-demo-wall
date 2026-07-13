"""自定义异常"""
from fastapi import HTTPException, status


class BaseAPIException(HTTPException):
    """基础 API 异常"""

    def __init__(
        self,
        code: int,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        self.code = code
        self.message = message
        super().__init__(status_code=status_code, detail={"code": code, "message": message})


class ParameterError(BaseAPIException):
    """参数错误"""

    def __init__(self, message: str = "参数错误"):
        super().__init__(code=40001, message=message, status_code=status.HTTP_400_BAD_REQUEST)


class UnauthorizedError(BaseAPIException):
    """未登录 / Token 无效"""

    def __init__(self, message: str = "未登录或Token无效"):
        super().__init__(code=40101, message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class TokenExpiredError(BaseAPIException):
    """Token 已过期"""

    def __init__(self, message: str = "Token已过期"):
        super().__init__(code=40102, message=message, status_code=status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(BaseAPIException):
    """无权限"""

    def __init__(self, message: str = "无权限访问"):
        super().__init__(code=40301, message=message, status_code=status.HTTP_403_FORBIDDEN)


class NotFoundError(BaseAPIException):
    """资源不存在"""

    def __init__(self, message: str = "资源不存在"):
        super().__init__(code=40401, message=message, status_code=status.HTTP_404_NOT_FOUND)


class ConflictError(BaseAPIException):
    """资源冲突"""

    def __init__(self, code: int, message: str):
        super().__init__(code=code, message=message, status_code=status.HTTP_409_CONFLICT)


class PhoneExistsError(ConflictError):
    """手机号已注册"""

    def __init__(self, message: str = "手机号已注册"):
        super().__init__(code=40901, message=message)


class InternalServerError(BaseAPIException):
    """服务器内部错误"""

    def __init__(self, message: str = "服务器内部错误"):
        super().__init__(code=50001, message=message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AIServiceError(BaseAPIException):
    """AI 服务调用失败"""

    def __init__(self, message: str = "AI服务调用失败"):
        super().__init__(code=50002, message=message, status_code=status.HTTP_502_BAD_GATEWAY)
