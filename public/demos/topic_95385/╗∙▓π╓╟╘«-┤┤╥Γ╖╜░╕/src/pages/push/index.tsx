import React, { useState } from 'react'
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

const templates = [
  { id: 'policy', name: '政策通知', icon: '📋', desc: '发布新政策解读和执行要求' },
  { id: 'meeting', name: '会议通知', icon: '📅', desc: '通知会议时间、地点和议程' },
  { id: 'emergency', name: '紧急通知', icon: '🚨', desc: '突发事件、安全预警等紧急信息' },
  { id: 'activity', name: '活动通知', icon: '🎉', desc: '社区活动、培训课程等活动信息' },
  { id: 'daily', name: '日常通知', icon: '📝', desc: '日常事务、温馨提示等' }
]

export default function PushPage() {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)
  
  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id)
    if (id === 'policy') {
      setTitle('关于开展城乡居民养老保险政策宣传的通知')
      setContent('各位居民朋友：\n\n为切实做好城乡居民养老保险政策宣传工作，提高居民参保意识，现将有关事项通知如下：\n\n一、宣传时间：即日起至本周五\n二、宣传内容：养老保险参保条件、缴费标准、待遇领取等\n三、咨询地点：社区服务中心大厅\n\n请各位居民相互转告，积极参与政策学习。')
    } else if (id === 'meeting') {
      setTitle('关于召开社区工作例会的通知')
      setContent('各位社区工作人员：\n\n定于明天下午3点在社区会议室召开工作例会，请准时参加。\n\n会议议程：\n1. 近期工作汇报\n2. 重点工作部署\n3. 政策学习交流\n\n请提前做好准备。')
    } else if (id === 'emergency') {
      setTitle('防汛安全紧急通知')
      setContent('紧急通知：\n\n根据气象部门预报，未来24小时将有强降雨，请各位居民注意：\n\n1. 关好门窗，检查排水设施\n2. 低洼地区居民做好防范准备\n3. 如遇紧急情况，请及时联系社区\n\n社区24小时值班电话：xxxx-xxxxxxx')
    } else if (id === 'activity') {
      setTitle('社区健康讲座活动通知')
      setContent('尊敬的居民：\n\n为提升居民健康意识，社区将举办健康知识讲座：\n\n主题：老年人健康管理\n时间：本周六上午9点\n地点：社区活动中心\n\n欢迎广大居民积极参与！')
    } else {
      setTitle('')
      setContent('')
    }
  }
  
  const handlePreview = () => {
    if (!title.trim() || !content.trim()) {
      Taro.showToast({ title: '请填写完整内容', icon: 'none' })
      return
    }
    setPreviewVisible(true)
  }
  
  const handleCopy = () => {
    Taro.setClipboardData({
      data: `【${title}】\n\n${content}`,
      success: () => {
        Taro.showToast({ title: '已复制到剪贴板', icon: 'success' })
        setPreviewVisible(false)
      }
    })
  }
  
  const handleShare = () => {
    Taro.showToast({ title: '已生成分享图片', icon: 'success' })
    setPreviewVisible(false)
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>信息推送</Text>
      </View>
      
      <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)' }}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>选择通知模板</Text>
          <View className={styles.templateGrid}>
            {templates.map(tpl => (
              <View 
                key={tpl.id} 
                className={`${styles.templateItem} ${selectedTemplate === tpl.id ? styles.active : ''}`}
                onClick={() => handleTemplateSelect(tpl.id)}
              >
                <Text className={styles.templateIcon}>{tpl.icon}</Text>
                <Text className={styles.templateName}>{tpl.name}</Text>
                <Text className={styles.templateDesc}>{tpl.desc}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>编辑通知内容</Text>
          <View className={styles.form}>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>通知标题</Text>
              <Input 
                className={styles.formInput} 
                placeholder="请输入通知标题"
                placeholderStyle="color: #999999"
                value={title}
                onChange={(e: any) => setTitle(e.detail.value)}
              />
            </View>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>通知内容</Text>
              <Textarea 
                className={styles.formTextarea} 
                placeholder="请输入通知内容..."
                placeholderStyle="color: #999999"
                value={content}
                onChange={(e: any) => setContent(e.detail.value)}
                autoHeight
                maxLength={2000}
              />
            </View>
            <View className={styles.wordCount}>
              <Text className={styles.wordCountText}>{content.length}/2000</Text>
            </View>
          </View>
        </View>
        
        <View className={styles.section}>
          <View className={styles.actionButtons}>
            <View className={styles.actionBtn} onClick={handlePreview}>
              <Text className={styles.actionBtnText}>预览</Text>
            </View>
            <View className={styles.actionBtnPrimary} onClick={handlePreview}>
              <Text className={styles.actionBtnText}>生成通知</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {previewVisible && (
        <View className={styles.modal} onClick={() => setPreviewVisible(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>通知预览</Text>
              <Text className={styles.modalClose} onClick={() => setPreviewVisible(false)}>✕</Text>
            </View>
            <ScrollView scrollY className={styles.modalBody}>
              <Text className={styles.previewTitle}>{title}</Text>
              <Text className={styles.previewContent}>{content}</Text>
            </ScrollView>
            <View className={styles.modalFooter}>
              <View className={styles.modalBtn} onClick={handleCopy}>
                <Text className={styles.modalBtnText}>复制文本</Text>
              </View>
              <View className={styles.modalBtnPrimary} onClick={handleShare}>
                <Text className={styles.modalBtnText}>生成图片分享</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}