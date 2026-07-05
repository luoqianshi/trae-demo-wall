from django.apps import AppConfig


class OrderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.order'
    
    def ready(self):
        """应用启动时启动支付状态轮询任务"""
        import sys
        # 只在非管理命令模式下启动（即runserver时）
        if 'runserver' in sys.argv:
            from .tasks import payment_polling_task
            payment_polling_task.start()
