import Layout from '@/layout/index.vue'

export const constantRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/login/register.vue'),
    meta: { title: '学生注册', hidden: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled', affix: true }
      }
    ]
  },
  {
    path: '/profile',
    component: Layout,
    meta: { hidden: true },
    children: [
      {
        path: 'index',
        name: 'Profile',
        component: () => import('@/views/user/profile.vue'),
        meta: { title: '个人中心', icon: 'User' }
      }
    ]
  }
]

export const asyncRoutes = [
  {
    path: '/system',
    component: Layout,
    redirect: '/system/user',
    name: 'System',
    meta: { title: '系统管理', icon: 'Setting', permission: 'system:manage' },
    children: [
      {
        path: 'user',
        name: 'UserManage',
        component: () => import('@/views/user/index.vue'),
        meta: { title: '用户管理', icon: 'UserFilled', permission: 'user:list' }
      },
      {
        path: 'role',
        name: 'RoleManage',
        component: () => import('@/views/role/index.vue'),
        meta: { title: '角色管理', icon: 'User', permission: 'role:list' }
      },
      {
        path: 'class',
        name: 'ClassManage',
        component: () => import('@/views/class/index.vue'),
        meta: { title: '班级管理', icon: 'OfficeBuilding', permission: 'class:list' }
      },
      {
        path: 'operationLog',
        name: 'OperationLog',
        component: () => import('@/views/system/operationLog.vue'),
        meta: { title: '操作日志', icon: 'Document', permission: 'operationLog:view' }
      }
    ]
  },
  {
    path: '/student',
    component: Layout,
    redirect: '/student/index',
    name: 'Student',
    meta: { title: '学生管理', icon: 'School', permission: 'student:manage' },
    children: [
      {
        path: 'index',
        name: 'StudentList',
        component: () => import('@/views/student/index.vue'),
        meta: { title: '学生列表', icon: 'List', permission: 'student:list' }
      },
      {
        path: 'detail/:id',
        name: 'StudentDetail',
        component: () => import('@/views/student/detail.vue'),
        meta: { title: '学生详情', icon: 'View', hidden: true, permission: 'student:detail' }
      },
      {
        path: 'recycle',
        name: 'StudentRecycle',
        component: () => import('@/views/student/recycle.vue'),
        meta: { title: '回收站', icon: 'Delete', permission: 'student:recycle' }
      }
    ]
  },
  {
    path: '/score',
    component: Layout,
    redirect: '/score/record',
    name: 'Score',
    meta: { title: '操行分管理', icon: 'Medal', permission: 'score:manage' },
    children: [
      {
        path: 'record',
        name: 'ScoreRecord',
        component: () => import('@/views/score/record.vue'),
        meta: { title: '操行分记录', icon: 'Document', permission: 'score:record:list' }
      },
      {
        path: 'rule',
        name: 'ScoreRule',
        component: () => import('@/views/score/rule.vue'),
        meta: { title: '规则管理', icon: 'List', permission: 'score:rule:list' }
      },
      {
        path: 'audit',
        name: 'ScoreAudit',
        component: () => import('@/views/score/audit.vue'),
        meta: { title: '审核页面', icon: 'CircleCheck', permission: 'score:audit' }
      },
      {
        path: 'recycle',
        name: 'ScoreRecycle',
        component: () => import('@/views/score/recycle.vue'),
        meta: { title: '回收站', icon: 'Delete', permission: 'score:recycle' }
      }
    ]
  },
  {
    path: '/leave',
    component: Layout,
    redirect: '/leave/index',
    name: 'Leave',
    meta: { title: '请假管理', icon: 'Calendar', permission: 'leave:manage' },
    children: [
      {
        path: 'index',
        name: 'LeaveList',
        component: () => import('@/views/leave/index.vue'),
        meta: { title: '请假列表', icon: 'Document', permission: 'leave:list' }
      },
      {
        path: 'statistics',
        name: 'LeaveStatistics',
        component: () => import('@/views/leave/statistics.vue'),
        meta: { title: '请假统计', icon: 'DataAnalysis', permission: 'leave:statistics' }
      }
    ]
  },
  {
    path: '/phone',
    component: Layout,
    redirect: '/phone/index',
    name: 'Phone',
    meta: { title: '收手机管理', icon: 'Iphone', permission: 'phone:manage' },
    children: [
      {
        path: 'index',
        name: 'PhoneIndex',
        component: () => import('@/views/phone/index.vue'),
        meta: { title: '收手机总览', icon: 'View', permission: 'phone:view' }
      },
      {
        path: 'records',
        name: 'PhoneRecords',
        component: () => import('@/views/phone/records.vue'),
        meta: { title: '变动明细', icon: 'List', permission: 'phone:records' }
      }
    ]
  },
  {
    path: '/ai',
    component: Layout,
    redirect: '/ai/chat',
    name: 'AI',
    meta: { title: 'AI智能', icon: 'MagicStick', permission: 'ai:manage' },
    children: [
      {
        path: 'chat',
        name: 'AIChat',
        component: () => import('@/views/ai/chat.vue'),
        meta: { title: 'AI聊天助手', icon: 'ChatDotRound', permission: 'ai:chat' }
      },
      {
        path: 'judgment',
        name: 'AIJudgment',
        component: () => import('@/views/ai/judgment.vue'),
        meta: { title: '智能研判', icon: 'View', permission: 'ai:judgment' }
      },
      {
        path: 'warning',
        name: 'AIWarning',
        component: () => import('@/views/ai/warning.vue'),
        meta: { title: '心理预警', icon: 'Warning', permission: 'ai:warning' }
      },
      {
        path: 'knowledge',
        name: 'AIKnowledge',
        component: () => import('@/views/ai/knowledge.vue'),
        meta: { title: '知识库管理', icon: 'Notebook', permission: 'ai:knowledge' }
      },
      {
        path: 'modelConfig',
        name: 'AIModelConfig',
        component: () => import('@/views/ai/modelConfig.vue'),
        meta: { title: '模型配置', icon: 'Tools', permission: 'ai:modelConfig' }
      }
    ]
  },
  {
    path: '/report',
    component: Layout,
    children: [
      {
        path: 'index',
        name: 'ReportIndex',
        component: () => import('@/views/report/index.vue'),
        meta: { title: '报表中心', icon: 'DataLine', permission: 'report:view' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404',
    meta: { hidden: true }
  }
]
