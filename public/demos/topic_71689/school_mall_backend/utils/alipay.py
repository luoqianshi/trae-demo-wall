"""
支付宝支付工具类 - 沙箱环境
使用 python-alipay-sdk 库
"""
from alipay import AliPay


class AlipayService:
    """支付宝支付服务"""

    # 沙箱环境配置
    # TODO: 请填写你的支付宝沙箱配置
    APP_ID = '9021000162629072'  # 应用ID
    APP_PRIVATE_KEY = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCbmavH0lyiyG7u4wIaKoV6i6l422SDvWQpR+l/MkXmTAl2hccx2pTeSIZX9BPsS+IfPj2qoLy0h2+pr/I9jY8OF3jrYZRm6t0k6UZ1T75S9EMBhAQRxzpHhbwTnMUtzFJFaXAtUFp//7GqBcScYt2C6NbU+F6eex3PVDDnmh6yKXtbb9XReNguqHPepeUKC+ifu5XGaZO2Pn5mOJ1alAJRfssFp6onPcf2ZEdr9y/sBxdFbruBKkY06KY+QO8xR4QUgb1iUgDTe4wj/LQG0r6wUe5u1Lc12EIcvIyqtFrqqGqZwLEiWKdiVyz/5TwHGw4In+uPeJ7CYXZCEMsow8e/AgMBAAECggEALCfxzaTu0OscQAJ/yDkk49/aWge4gIIweF6F7qivmWkejlnsa0NiV6oxJaiINthZ9Q/OpCs1Ie4FTBw4HCud2xviHrn0STiBRUZFzmiw1A2pLjbuiLUG3uEevFoSwqpm9nezc8iHxicjneJBJzgPMGUvAgTxpPu/O+Tic/cSmvAlMieKtn5BEvz614suJJ09YZ5GTqCK7Svfw8gGgbuWVw4wWli1gnx9IcvFL+pr5kJp5OFyr4CM1pbLnA+8iX+q0se/LB2/7b2OPXuu1oadXVJcO+wHMtGqatsu8sQThp9dz4jmC9BXLnv7GbeWiQ8d2H6dxABNrOtZX5wNgGDSgQKBgQDTNl5hFUTL3h0GOVNKPWE8vTDloWDlJJu4QS4ElvJ6LIcMCpZSYXFOUlN+E+a3Vm9mbdj2xZ2Jrza1x/KtDmHQwaCtOV/rGNhU3FnDmSiAri6Mlfb3seEnsBeXxZeSY1USX1DQOqxPEVbvHIe3ShB0YuPafHHy+jcAxQ4wTFQZIQKBgQC8mGh3RHZ0vuk5jVgISdp2mlXxIVVNuQwsQfNbiohlZJT6Io72qI/jIZ3kFG3Mu9PCQC4RzZeiMCMqtBd3OXD/PrEiYvdChvGQ7iNVfNBfYBnyEnR8cO4jlatYouOZjZcP5Ry+gqkxYLtlNHVwP1FBv/3jED6duY+Ze/HE1pFk3wKBgA4HYXNvVzd3VFQygI7AzvGa22GVO3tc2B7/7U+OuyJUTNAG7/8ey8jY/QS1y7BHxHR4PV3+uD0J70dZtYu7FdIo2kRHOFDEQLI6RJgSVzdc2miqGVJQdVUOhDKnhC7L/D2RKSv7ibBixXRyX61T9Q3V965ub58k8XxSmmOo3jkhAoGBALaPkhBh5Yj9hSaA/EaJt0A4Bhl0+u5RwsbU0I48e+wqgUvhSCLc6OwlDoJKhD87UrEnD3GMYsxNbL1Zt51hrVBnj3CJ/HAZ0J1K6ElImSy6CmOaGcicSOmJaGRUyZ1KwoBQeJKySLXTvZMqRMRzhmTvRQUYJITpq2gX4uF4EyZhAoGAFn+KfHFwnZsPI51eojbkjHcLiN23jiThVnSAHn9osiWXGfeYLuBoOOdTfeZ1KXu+dIhmL6OfJkS41UJpuqiZvRXuNjNuhTFeSdtr3SHygxm4UBDuoQuDHUrF02t1iqoxnevBmkjjiGP/P6treNi6OHNaba72Xv+6ywoNtivDuFM='  # 应用私钥
    ALIPAY_PUBLIC_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh6Vw1TJ6lrCBbvlY1cSCPT5+N3lZqhU/ij19e51Z5+XNWalJ/d0MH+eBPkkYZxkj8f62urfQ6wDBsL3OfTzoj9Gxan/g0M4vWz25nGxz/GVB+Jyqx2ybpsdmZFY/6aZp36d1sbtr42dWyTigzND/2mQ65cFrRzvRWzKGRzULVa+alyZFUU0dXOD7kVZzcluTrKRvsGylClZF+ex1wvQ/S+YrXpk45nkKOKcPcOw5ijrECBAsRuWsX0M9t3RyxiMYHRXX5prWxO5IThmzOfFYeE69oAMo3TsEGKuFmm8qHd8GVA4WWkYFj8YLMZo68CXW8ELih27tbClfLflCyTYvvQIDAQAB'  # 支付宝公钥

    # 沙箱环境网关
    GATEWAY_URL = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'

    # 回调地址配置
    # TODO: 请配置你的回调地址
    RETURN_URL = 'http://localhost:5173/pay/success'  # 支付成功同步跳转地址
    NOTIFY_URL = 'http://da94a94d.natappfree.cc/api/order/alipay/notify/'  # 异步通知地址

    def __init__(self):
        """初始化支付宝客户端"""
        self._alipay = None

    @property
    def alipay(self):
        """懒加载支付宝客户端"""
        if self._alipay is None:
            if not self.APP_ID or not self.APP_PRIVATE_KEY or not self.ALIPAY_PUBLIC_KEY:
                raise ValueError(
                    "支付宝配置未填写，请在 utils/alipay.py 中配置 "
                    "APP_ID, APP_PRIVATE_KEY, ALIPAY_PUBLIC_KEY"
                )

            # 处理密钥格式
            app_private_key = self._format_private_key(self.APP_PRIVATE_KEY)
            alipay_public_key = self._format_public_key(self.ALIPAY_PUBLIC_KEY)

            print(f"[Alipay Debug] APP_ID: {self.APP_ID}")
            print(f"[Alipay Debug] Private Key starts with: {app_private_key[:50]}...")
            print(f"[Alipay Debug] Public Key starts with: {alipay_public_key[:50]}...")

            try:
                self._alipay = AliPay(
                    appid=self.APP_ID,
                    app_notify_url=self.NOTIFY_URL,
                    app_private_key_string=app_private_key,
                    alipay_public_key_string=alipay_public_key,
                    sign_type="RSA2",
                    debug=True  # 沙箱环境设置为 True
                )
            except Exception as e:
                print(f"[Alipay Debug] Init Error: {str(e)}")
                raise

        return self._alipay

    def _format_private_key(self, key):
        """格式化私钥，确保包含正确的头部和尾部"""
        key = key.strip()
        if not key:
            return key

        # 如果已经包含头部，直接返回
        if 'BEGIN' in key and 'PRIVATE KEY' in key:
            return key

        # 清理密钥内容（移除换行和空格）
        key_content = key.replace('\n', '').replace(' ', '').replace('\r', '')

        # 添加头部和尾部
        return f"-----BEGIN RSA PRIVATE KEY-----\n{key_content}\n-----END RSA PRIVATE KEY-----"

    def _format_public_key(self, key):
        """格式化公钥，确保包含正确的头部和尾部"""
        key = key.strip()
        if not key:
            return key

        # 如果已经包含头部，直接返回
        if 'BEGIN' in key and 'PUBLIC KEY' in key:
            return key

        # 清理密钥内容（移除换行和空格）
        key_content = key.replace('\n', '').replace(' ', '').replace('\r', '')

        # 添加头部和尾部
        return f"-----BEGIN PUBLIC KEY-----\n{key_content}\n-----END PUBLIC KEY-----"

    def is_configured(self):
        """检查是否已配置支付宝参数"""
        return bool(self.APP_ID and self.APP_PRIVATE_KEY and self.ALIPAY_PUBLIC_KEY)

    def create_pc_payment(self, order_no, total_amount, subject, body='', notify_url=None):
        """
        创建电脑网站支付

        :param order_no: 商户订单号
        :param total_amount: 订单总金额，单位为元
        :param subject: 订单标题
        :param body: 订单描述
        :param notify_url: 自定义异步通知地址（可选）
        :return: 支付宝支付页面URL
        """
        print(f"[Alipay Debug] Creating PC payment: order_no={order_no}, amount={total_amount}")

        try:
            # 使用自定义通知地址或默认地址
            callback_url = notify_url if notify_url else self.NOTIFY_URL
            
            # 生成支付URL
            order_string = self.alipay.api_alipay_trade_page_pay(
                out_trade_no=order_no,
                total_amount=str(total_amount),
                subject=subject,
                body=body,
                return_url=self.RETURN_URL,
                notify_url=callback_url
            )

            # 拼接完整URL
            pay_url = f"{self.GATEWAY_URL}?{order_string}"
            print(f"[Alipay Debug] Pay URL: {pay_url[:200]}...")
            return pay_url

        except Exception as e:
            print(f"[Alipay Debug] Create payment error: {str(e)}")
            raise

    def create_wap_payment(self, order_no, total_amount, subject, body='', notify_url=None):
        """
        创建手机网站支付

        :param order_no: 商户订单号
        :param total_amount: 订单总金额，单位为元
        :param subject: 订单标题
        :param body: 订单描述
        :param notify_url: 自定义异步通知地址（可选）
        :return: 支付宝支付页面URL
        """
        print(f"[Alipay Debug] Creating WAP payment: order_no={order_no}, amount={total_amount}")

        try:
            # 使用自定义通知地址或默认地址
            callback_url = notify_url if notify_url else self.NOTIFY_URL
            
            # 生成支付URL
            order_string = self.alipay.api_alipay_trade_wap_pay(
                out_trade_no=order_no,
                total_amount=str(total_amount),
                subject=subject,
                body=body,
                return_url=self.RETURN_URL,
                notify_url=callback_url
            )

            # 拼接完整URL
            pay_url = f"{self.GATEWAY_URL}?{order_string}"
            print(f"[Alipay Debug] Pay URL: {pay_url[:200]}...")
            return pay_url

        except Exception as e:
            print(f"[Alipay Debug] Create payment error: {str(e)}")
            raise

    def query_order(self, order_no):
        """
        查询订单支付状态

        :param order_no: 商户订单号
        :return: 订单查询结果字典
        """
        try:
            result = self.alipay.api_alipay_trade_query(out_trade_no=order_no)
            return result
        except Exception as e:
            print(f"[Alipay Debug] Query order error: {str(e)}")
            return {'code': 'QUERY_ERROR', 'msg': str(e)}

    def verify_notify(self, data):
        """
        验证支付宝异步通知签名

        :param data: 异步通知参数字典
        :return: 验证结果
        """
        # 从data中移除sign和sign_type
        signature = data.pop("sign", None)
        sign_type = data.pop("sign_type", None)

        if not signature:
            return False

        # 验签
        return self.alipay.verify(data, signature)


# 单例模式
alipay_service = AlipayService()
