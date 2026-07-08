import type { FamilyMember, EmergencyContact } from '@/types';

export const familyMembers: FamilyMember[] = [
  {
    id: '1',
    name: '张明',
    avatar: 'https://picsum.photos/id/64/200/200',
    relationship: '儿子',
    phone: '138****8888',
    isOnline: true,
    lastContact: '2分钟前'
  },
  {
    id: '2',
    name: '李娜',
    avatar: 'https://picsum.photos/id/91/200/200',
    relationship: '女儿',
    phone: '139****6666',
    isOnline: false,
    lastContact: '1小时前'
  },
  {
    id: '3',
    name: '王芳',
    avatar: 'https://picsum.photos/id/177/200/200',
    relationship: '老伴',
    phone: '137****5555',
    isOnline: true,
    lastContact: '刚刚'
  }
];

export const emergencyContacts: EmergencyContact[] = [
  {
    id: '1',
    name: '张明',
    phone: '13800138888',
    relationship: '儿子',
    priority: 1,
    avatar: ''
  },
  {
    id: '2',
    name: '王芳',
    phone: '13700137555',
    relationship: '老伴',
    priority: 2,
    avatar: ''
  },
  {
    id: '3',
    name: '社区服务中心',
    phone: '010-12345678',
    relationship: '社区',
    priority: 3,
    avatar: ''
  }
];