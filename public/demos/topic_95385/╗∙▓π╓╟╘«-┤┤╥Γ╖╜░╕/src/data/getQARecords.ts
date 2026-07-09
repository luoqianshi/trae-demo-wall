import type { QARecord } from '@/types'

const mockRecords: QARecord[] = [
  {
    id: 'qa_1',
    question: '请问城乡居民养老保险的缴费标准是多少？',
    answer: '您好！城乡居民养老保险缴费标准分为多个档次，具体标准由各市县根据本地实际情况确定。建议您前往当地社保经办机构咨询详细信息。',
    createTime: '2024-03-20T10:30:00Z'
  },
  {
    id: 'qa_2',
    question: '就业困难人员如何申请就业援助？',
    answer: '您好！就业困难人员可携带身份证、户口本等相关材料前往当地就业服务中心申请就业援助。就业援助月活动期间，各地会组织专场招聘会，您可以关注当地通知。',
    createTime: '2024-03-18T14:20:00Z'
  },
  {
    id: 'qa_3',
    question: '义务教育阶段学生资助如何申请？',
    answer: '您好！义务教育阶段家庭经济困难学生资助申请流程为：学生申请→学校审核→县级教育部门审批→资金发放。具体可向所在学校咨询。',
    createTime: '2024-03-15T09:15:00Z'
  }
]

export default function getQARecords(params?: { page?: number; pageSize?: number }) {
  const page = params?.page || 1
  const pageSize = params?.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    records: mockRecords.slice(start, end),
    total: mockRecords.length
  }
}