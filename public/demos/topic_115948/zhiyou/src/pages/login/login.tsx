import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useRef } from 'react'
import authStore from '../../store/auth'
import { PhoneIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../components/svg/icons'
import './login.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '登录',
  backgroundColor: '#FFF9F5',
})

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!phone) {
      Taro.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(phone)) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (password.length < 8) {
      Taro.showToast({ title: '密码至少8位', icon: 'none' })
      return
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        Taro.showToast({ title: '请确认密码', icon: 'none' })
        return
      }
      if (password !== confirmPassword) {
        Taro.showToast({ title: '两次密码不一致', icon: 'none' })
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await authStore.login(phone, password)
      } else {
        await authStore.register(phone, password)
      }
      Taro.showToast({ title: mode === 'login' ? '登录成功' : '注册成功', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/index/index' })
      }, 500)
    } catch (e) {
      // 错误已在 request 中提示
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <View className='login-page'>
      {/* 状态栏占位 */}
      <View className='status-bar'>
        <Text className='status-time'>9:41</Text>
        <View className='status-icons'>
          <View className='icon-signal'>
            <View className='signal-bar s1' />
            <View className='signal-bar s2' />
            <View className='signal-bar s3' />
            <View className='signal-bar s4' />
          </View>
          <View className='icon-wifi'>
            <View className='wifi-dot' />
            <View className='wifi-ring r1' />
            <View className='wifi-ring r2' />
            <View className='wifi-ring r3' />
          </View>
          <View className='icon-battery'>
            <View className='battery-body' />
            <View className='battery-level' />
            <View className='battery-tip' />
          </View>
        </View>
      </View>

      {/* 吉祥物 */}
      <View className='mascot-container'>
        <View className='mascot'>
          <View className='sparkle sparkle-1'>
            <svg viewBox="0 0 12 12" fill="none">
              <path d="M6 0L7.5 4.5L12 6L7.5 7.5L6 12L4.5 7.5L0 6L4.5 4.5L6 0Z" fill="#FFD4A0"/>
            </svg>
          </View>
          <View className='sparkle sparkle-2'>
            <svg viewBox="0 0 10 10" fill="none">
              <path d="M5 0L6.2 3.8L10 5L6.2 6.2L5 10L3.8 6.2L0 5L3.8 3.8L5 0Z" fill="#FFB4B4"/>
            </svg>
          </View>
          <View className='sparkle sparkle-3'>
            <svg viewBox="0 0 8 8" fill="none">
              <path d="M4 0L5 3L8 4L5 5L4 8L3 5L0 4L3 3L4 0Z" fill="#FFE8CC"/>
            </svg>
          </View>
          <View className='mascot-hair' />
          <View className='mascot-head'>
            <View className='mascot-eyes'>
              <View className='mascot-eye' />
              <View className='mascot-eye' />
            </View>
            <View className='mascot-blush'>
              <View className='mascot-blush-left' />
              <View className='mascot-blush-right' />
            </View>
            <View className='mascot-mouth' />
          </View>
          <View className='mascot-body' />
          <View className='mascot-arm mascot-arm-left' />
          <View className='mascot-arm mascot-arm-right'>
            <View className='mascot-hand' />
          </View>
          <View className='mascot-feet'>
            <View className='mascot-foot' />
            <View className='mascot-foot' />
          </View>
        </View>
        <Text className='app-name'>我的智友</Text>
        <Text className='app-tagline'>创建属于你的 AI 朋友</Text>
      </View>

      {/* 表单 */}
      <View className='login-form'>
        {/* 手机号输入 */}
        <View className='input-group' onClick={() => phoneInputRef.current?.focus?.()}>
          <PhoneIcon className='input-icon-left' color="#9B9BAB" />
          <Input
            type='number'
            className='input-field'
            placeholder='请输入手机号'
            maxlength={11}
            value={phone}
            onInput={(e) => setPhone(e.detail.value)}
            ref={phoneInputRef}
          />
        </View>

        {/* 密码输入 */}
        <View className='input-group' onClick={() => passwordInputRef.current?.focus?.()}>
          <LockIcon className='input-icon-left' color="#9B9BAB" />
          <Input
            password={!showPassword}
            className='input-field'
            placeholder='请输入密码'
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
            ref={passwordInputRef}
          />
          <View className='input-icon-right' onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword) }}>
            {showPassword ? <EyeOffIcon color="#9B9BAB" /> : <EyeIcon color="#9B9BAB" />}
          </View>
        </View>

        {/* 确认密码（注册时显示） */}
        {mode === 'register' && (
          <View className='input-group' onClick={() => confirmInputRef.current?.focus?.()}>
            <LockIcon className='input-icon-left' color="#9B9BAB" />
            <Input
              password={!showPassword}
              className='input-field'
              placeholder='请确认密码'
              value={confirmPassword}
              onInput={(e) => setConfirmPassword(e.detail.value)}
              ref={confirmInputRef}
            />
          </View>
        )}

        {/* 忘记密码（仅登录显示） */}
        {mode === 'login' && (
          <View className='forgot-password'>
            <Text className='forgot-text'>忘记密码?</Text>
          </View>
        )}

        {/* 登录/注册按钮 */}
        <Button
          className='login-btn'
          loading={loading}
          disabled={loading}
          onClick={handleSubmit}
        >
          {mode === 'login' ? '登录' : '注册'}
        </Button>
      </View>

      {/* 分割线 */}
      {/* <View className='divider'>
        <View className='divider-line' />
        <Text className='divider-text'>—— 或者 ——</Text>
        <View className='divider-line' />
      </View>

      {/* 第三方登录 */}
      {/* <View className='social-login'>
        <View className='social-btns'>
          <View className='social-btn wechat'>
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05a6.127 6.127 0 01-.253-1.728c0-3.571 3.279-6.467 7.327-6.467.249 0 .492.017.735.04C16.431 4.678 12.914 2.188 8.691 2.188zm-2.6 4.408c.56 0 1.016.457 1.016 1.02 0 .563-.456 1.02-1.016 1.02-.56 0-1.016-.457-1.016-1.02 0-.563.456-1.02 1.016-1.02zm5.24 0c.56 0 1.016.457 1.016 1.02 0 .563-.456 1.02-1.016 1.02-.56 0-1.016-.457-1.016-1.02 0-.563.456-1.02 1.016-1.02zm5.695 3.478c-3.543 0-6.416 2.49-6.416 5.56 0 3.07 2.873 5.56 6.416 5.56.678 0 1.33-.097 1.945-.273a.722.722 0 01.598.082l1.58.924a.272.272 0 00.14.045.246.246 0 00.24-.246c0-.06-.024-.12-.04-.178l-.325-1.233a.49.49 0 01.178-.554C22.053 18.577 23 16.832 23 14.834c0-3.07-2.873-5.56-6.416-5.56h-.058zm-2.34 3.27c.467 0 .846.38.846.85s-.38.85-.846.85-.846-.38-.846-.85.38-.85.846-.85zm4.68 0c.467 0 .846.38.846.85s-.38.85-.846.85-.846-.38-.846-.85.38-.85.846-.85z"/>
            </svg>
          </View>
          <View className='social-btn apple'>
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          </View>
        </View>
        <Text className='social-label'>其他方式登录</Text>
      </View> */}

      {/* 底部注册/登录切换 */}
      <View className='bottom-switch'>
        <Text className='switch-text'>
          {mode === 'login' ? '还没有账号？' : '已有账号？'}
        </Text>
        <Text className='switch-link' onClick={toggleMode}>
          {mode === 'login' ? '立即注册' : '去登录'}
        </Text>
      </View>
    </View>
  )
}