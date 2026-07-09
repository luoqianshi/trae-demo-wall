import React, { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'

const guides = [
  {
    id: '1',
    title: '城乡居民养老保险办理',
    icon: '🏦',
    category: '社保',
    steps: [
      { step: 1, title: '准备材料', desc: '身份证、户口本、一寸照片2张' },
      { step: 2, title: '前往办理点', desc: '携带材料到社区服务中心或乡镇社保所' },
      { step: 3, title: '填写申请表', desc: '填写《城乡居民养老保险参保登记表》' },
      { step: 4, title: '审核录入', desc: '工作人员审核材料并录入系统' },
      { step: 5, title: '领取凭证', desc: '领取《城乡居民养老保险缴费手册》' }
    ],
    materials: ['身份证原件及复印件', '户口本原件及复印件', '一寸免冠照片2张', '银行卡（可选）'],
    tips: ['每年缴费截止日期为12月31日', '可选择不同缴费档次', '享受政府补贴政策']
  },
  {
    id: '2',
    title: '就业援助申请',
    icon: '💼',
    category: '就业',
    steps: [
      { step: 1, title: '资格认定', desc: '确认是否符合就业困难人员条件' },
      { step: 2, title: '准备材料', desc: '身份证、就业失业登记证、相关证明' },
      { step: 3, title: '申请登记', desc: '到公共就业服务机构申请' },
      { step: 4, title: '审核公示', desc: '审核通过后进行公示' },
      { step: 5, title: '享受政策', desc: '享受岗位补贴、社保补贴等政策' }
    ],
    materials: ['身份证原件及复印件', '《就业失业登记证》', '困难证明材料'],
    tips: ['就业困难人员包括：大龄失业人员、残疾人、零就业家庭成员等', '补贴政策具体以当地规定为准']
  },
  {
    id: '3',
    title: '义务教育学生资助',
    icon: '🎓',
    category: '教育',
    steps: [
      { step: 1, title: '了解政策', desc: '了解当地义务教育资助政策' },
      { step: 2, title: '提出申请', desc: '向学校提交资助申请' },
      { step: 3, title: '审核确认', desc: '学校审核家庭经济状况' },
      { step: 4, title: '公示名单', desc: '公示拟资助学生名单' },
      { step: 5, title: '发放资助', desc: '按时发放资助资金' }
    ],
    materials: ['家庭经济困难证明', '户口本复印件', '申请表'],
    tips: ['资助包括：免学杂费、免教科书费、生活补助等', '每年秋季学期申请']
  },
  {
    id: '4',
    title: '农村危房改造',
    icon: '🏠',
    category: '住房',
    steps: [
      { step: 1, title: '申请登记', desc: '向村委会提出书面申请' },
      { step: 2, title: '民主评议', desc: '村委会组织民主评议' },
      { step: 3, title: '公示上报', desc: '公示无异议后上报乡镇' },
      { step: 4, title: '审核鉴定', desc: '乡镇审核并组织危房鉴定' },
      { step: 5, title: '组织实施', desc: '签订改造协议并组织施工' },
      { step: 6, title: '验收拨付', desc: '验收合格后拨付补助资金' }
    ],
    materials: ['申请书', '身份证复印件', '危房鉴定报告'],
    tips: ['补助标准根据危房等级确定', '优先保障五保户、低保户']
  }
]

export default function GuidePage() {
  const [selectedGuide, setSelectedGuide] = useState<any>(null)
  
  const handleGuideClick = (guide: any) => {
    setSelectedGuide(guide)
  }
  
  const handleBack = () => {
    setSelectedGuide(null)
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>{selectedGuide ? '办事详情' : '办事指引'}</Text>
      </View>
      
      {selectedGuide ? (
        <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)', marginTop: '88rpx' }}>
          <View className={styles.detailHeader}>
            <Text className={styles.detailIcon}>{selectedGuide.icon}</Text>
            <Text className={styles.detailTitle}>{selectedGuide.title}</Text>
            <Text className={styles.detailCategory}>{selectedGuide.category}</Text>
          </View>
          
          <View className={styles.detailSection}>
            <Text className={styles.detailSectionTitle}>办理流程</Text>
            <View className={styles.steps}>
              {selectedGuide.steps.map((item: any, idx: number) => (
                <View key={item.step} className={styles.stepItem}>
                  <View className={styles.stepNumber}>
                    <Text className={styles.stepNum}>{item.step}</Text>
                  </View>
                  <View className={styles.stepContent}>
                    <Text className={styles.stepTitle}>{item.title}</Text>
                    <Text className={styles.stepDesc}>{item.desc}</Text>
                  </View>
                  {idx < selectedGuide.steps.length - 1 && (
                    <View className={styles.stepLine}></View>
                  )}
                </View>
              ))}
            </View>
          </View>
          
          <View className={styles.detailSection}>
            <Text className={styles.detailSectionTitle}>所需材料</Text>
            <View className={styles.materials}>
              {selectedGuide.materials.map((mat: string, idx: number) => (
                <View key={idx} className={styles.materialItem}>
                  <Text className={styles.materialCheck}>✓</Text>
                  <Text className={styles.materialText}>{mat}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className={styles.detailSection}>
            <Text className={styles.detailSectionTitle}>温馨提示</Text>
            <View className={styles.tips}>
              {selectedGuide.tips.map((tip: string, idx: number) => (
                <View key={idx} className={styles.tipItem}>
                  <Text className={styles.tipIcon}>💡</Text>
                  <Text className={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className={styles.backButton}>
            <View className={styles.backBtn} onClick={handleBack}>
              <Text className={styles.backBtnText}>返回列表</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView scrollY style={{ height: 'calc(100vh - 88rpx)', marginTop: '88rpx' }}>
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>热门办事指引</Text>
            <Text className={styles.sectionDesc}>为您整理常见办事流程，让办事更简单</Text>
            
            <View className={styles.guideList}>
              {guides.map(guide => (
                <View key={guide.id} className={styles.guideCard} onClick={() => handleGuideClick(guide)}>
                  <View className={styles.guideIcon}>
                    <Text>{guide.icon}</Text>
                  </View>
                  <View className={styles.guideContent}>
                    <Text className={styles.guideTitle}>{guide.title}</Text>
                    <Text className={styles.guideSteps}>共 {guide.steps.length} 步 · {guide.category}</Text>
                  </View>
                  <Text className={styles.guideArrow}>›</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>办事小贴士</Text>
            <View className={styles.tipCards}>
              <View className={styles.tipCard}>
                <Text className={styles.tipCardIcon}>🕐</Text>
                <Text className={styles.tipCardTitle}>办事时间</Text>
                <Text className={styles.tipCardDesc}>工作日 9:00-17:00</Text>
              </View>
              <View className={styles.tipCard}>
                <Text className={styles.tipCardIcon}>📞</Text>
                <Text className={styles.tipCardTitle}>咨询电话</Text>
                <Text className={styles.tipCardDesc}>12345 政务服务热线</Text>
              </View>
              <View className={styles.tipCard}>
                <Text className={styles.tipCardIcon}>📍</Text>
                <Text className={styles.tipCardTitle}>办理地点</Text>
                <Text className={styles.tipCardDesc}>社区服务中心大厅</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  )
}