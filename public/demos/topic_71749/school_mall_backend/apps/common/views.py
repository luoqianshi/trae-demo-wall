import os
import uuid
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

class FileUploadView(APIView):
    """文件上传视图"""
    permission_classes = [AllowAny]

    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({
                'code': 400,
                'message': '没有上传文件'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 验证文件类型
        ext = os.path.splitext(file_obj.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.gif']:
            return Response({
                'code': 400,
                'message': '仅支持上传图片 (jpg, jpeg, png, gif)'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 生成唯一文件名
        file_name = f"{uuid.uuid4().hex}{ext}"
        
        # 确保目录存在
        upload_path = os.path.join(settings.MEDIA_ROOT, 'uploads')
        if not os.path.exists(upload_path):
            os.makedirs(upload_path)

        # 保存文件
        file_path = os.path.join(upload_path, file_name)
        with open(file_path, 'wb+') as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        # 返回访问链接
        file_url = f"{request.build_absolute_uri(settings.MEDIA_URL)}uploads/{file_name}"
        
        return Response({
            'code': 200,
            'message': '上传成功',
            'data': {
                'url': file_url,
                'path': f"uploads/{file_name}"
            }
        }, status=status.HTTP_200_OK)
