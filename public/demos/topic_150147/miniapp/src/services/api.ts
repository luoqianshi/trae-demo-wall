import Taro from '@tarojs/taro';

// API基础地址 — 开发环境默认localhost，生产环境需替换为实际域名
const BASE_URL = process.env.TARO_APP_API_BASE || 'http://localhost:3000/api';

function getToken(): string {
  return Taro.getStorageSync('token') || '';
}

async function request<T = any>(url: string, options: any = {}): Promise<T> {
  const token = getToken();
  const header: any = { 'Content-Type': 'application/json' };
  if (token) header['Authorization'] = `Bearer ${token}`;

  try {
    const res = await Taro.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data,
      header,
    });

    if (res.statusCode === 401) {
      Taro.removeStorageSync('token');
      Taro.reLaunch({ url: '/pages/index/index' });
      throw new Error('未登录');
    }

    if (res.statusCode >= 400) {
      throw new Error((res.data as any)?.message || '请求失败');
    }

    return res.data as T;
  } catch (err: any) {
    Taro.showToast({ title: err.message || '网络错误', icon: 'none' });
    throw err;
  }
}

export const authAPI = {
  login: (username: string, password: string) => request('/auth/login', { method: 'POST', data: { username, password } }),
  getProfile: () => request('/auth/profile'),
};

export const campAPI = {
  list: (params?: any) => request('/camps', { data: params }),
  detail: (id: number) => request(`/camps/${id}`),
  enroll: (campId: number) => request(`/camps/${campId}/enroll`, { method: 'POST' }),
  getStudents: (campId: number) => request(`/camps/${campId}/students`),
};

export const submissionAPI = {
  submit: (taskId: number, data: any) => request(`/submissions/tasks/${taskId}/submit`, { method: 'POST', data }),
  getMy: (campId: number) => request(`/submissions/my-submissions/${campId}`),
  getPortfolio: (userId: number) => request(`/submissions/portfolio/${userId}`),
};

export const certAPI = {
  getMy: () => request('/certificates/my'),
};

export const orderAPI = {
  create: (campId: number) => request('/orders', { method: 'POST', data: { campId } }),
  pay: (orderNo: string) => request(`/orders/${orderNo}/pay`, { method: 'POST' }),
};

export const templateAPI = {
  list: (params?: any) => request('/templates', { data: params }),
};

// ========== 文件上传 ==========
export const uploadAPI = {
  upload: (filePath: string) => {
    return Taro.uploadFile({
      url: BASE_URL + '/upload',
      filePath: filePath,
      name: 'file',
      header: { 'Authorization': `Bearer ${getToken()}` },
    });
  },
};

// ========== 学分 ==========
export const creditAPI = {
  getMy: () => request('/credits/my'),
};

// ========== 资源库 ==========
export const resourceAPI = {
  list: (params?: any) => request('/resources', { data: params }),
  detail: (id: number) => request(`/resources/${id}`),
  download: (id: number) => request(`/resources/${id}/download`, { method: 'POST' }),
};

// ========== 实习 ==========
export const internshipAPI = {
  list: (params?: any) => request('/internship/opportunities', { data: params }),
  apply: (data: any) => request('/internship/apply', { method: 'POST', data }),
  getMyApplications: () => request('/internship/applications/my'),
};

// ========== 通知 ==========
export const notificationAPI = {
  getMy: (params?: any) => request('/notifications/my', { data: params }),
  getUnreadCount: () => request('/notifications/unread-count'),
  markRead: (id: number) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
};

// ========== 企业需求 ==========
export const enterpriseAPI = {
  getDemands: (params?: any) => request('/enterprise/demands/list', { data: params }),
  getDemandDetail: (id: number) => request(`/enterprise/demands/${id}`),
  acceptDemand: (id: number) => request(`/enterprise/demands/${id}/accept`, { method: 'POST' }),
};

// ========== 跨学段协作 ==========
export const crossLevelAPI = {
  getMyAssignments: () => request('/cross-level/my-assignments'),
  getAssignments: (moduleId: number) => request(`/cross-level/assignments/${moduleId}`),
  respond: (id: number, data: any) => request(`/cross-level/assignments/${id}/respond`, { method: 'PUT', data }),
  submit: (assignmentId: number, data: any) => request(`/cross-level/submit/${assignmentId}`, { method: 'POST', data }),
};

// ========== PBL项目制学习 ==========
export const pblAPI = {
  // 工作台
  getWorkspace: (campId: number) => request(`/pbl/workspace/${campId}`),
  getMyWorkspaces: () => request('/pbl/my-workspaces'),
  updatePhase: (workspaceId: number, phase: string) => request(`/pbl/workspace/${workspaceId}/phase`, { method: 'PUT', data: { phase } }),
  getActivity: (workspaceId: number, limit?: number) => request(`/pbl/workspace/${workspaceId}/activity?limit=${limit || 30}`),
  // 探究板
  getNTK: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/ntk`),
  createNTK: (workspaceId: number, data: any) => request(`/pbl/workspace/${workspaceId}/ntk`, { method: 'POST', data }),
  updateNTK: (id: number, data: any) => request(`/pbl/ntk/${id}`, { method: 'PUT', data }),
  deleteNTK: (id: number) => request(`/pbl/ntk/${id}`, { method: 'DELETE' }),
  // KWL
  getKWL: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/kwl`),
  saveKWL: (workspaceId: number, data: any) => request(`/pbl/workspace/${workspaceId}/kwl`, { method: 'POST', data }),
  // 研究笔记
  getResearchNotes: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/research`),
  createResearchNote: (workspaceId: number, data: any) => request(`/pbl/workspace/${workspaceId}/research`, { method: 'POST', data }),
  updateResearchNote: (id: number, data: any) => request(`/pbl/research/${id}`, { method: 'PUT', data }),
  deleteResearchNote: (id: number) => request(`/pbl/research/${id}`, { method: 'DELETE' }),
  // 反思日志
  getReflections: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/reflections`),
  createReflection: (workspaceId: number, data: any) => request(`/pbl/workspace/${workspaceId}/reflections`, { method: 'POST', data }),
  updateReflection: (id: number, data: any) => request(`/pbl/reflections/${id}`, { method: 'PUT', data }),
  getReflectionPrompts: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/reflections/prompts`),
  // 反馈修订
  createCritiqueRound: (submissionId: number) => request(`/pbl/submissions/${submissionId}/critique`, { method: 'POST' }),
  getCritiqueRounds: (submissionId: number) => request(`/pbl/submissions/${submissionId}/critique-rounds`),
  getCritiqueRound: (roundId: number) => request(`/pbl/critique-rounds/${roundId}`),
  submitFeedback: (roundId: number, data: any) => request(`/pbl/critique-rounds/${roundId}/feedback`, { method: 'POST', data }),
  submitRevision: (roundId: number, data: any) => request(`/pbl/critique-rounds/${roundId}/revision`, { method: 'POST', data }),
  updateRoundStatus: (roundId: number, status: string) => request(`/pbl/critique-rounds/${roundId}/status`, { method: 'PUT', data: { status } }),
  // 量规
  createRubric: (data: any) => request('/pbl/rubrics', { method: 'POST', data }),
  getRubrics: (campId: number) => request(`/pbl/rubrics/camp/${campId}`),
  getRubricDetail: (id: number) => request(`/pbl/rubrics/${id}`),
  updateRubric: (id: number, data: any) => request(`/pbl/rubrics/${id}`, { method: 'PUT', data }),
  deleteRubric: (id: number) => request(`/pbl/rubrics/${id}`, { method: 'DELETE' }),
  // 小组讨论
  getGroupMessages: (groupId: number, before?: number) => request(`/pbl/groups/${groupId}/discussions${before ? `?before=${before}` : ''}`),
  sendGroupMessage: (groupId: number, data: any) => request(`/pbl/groups/${groupId}/discussions`, { method: 'POST', data }),
  // 成果展示
  getShowcase: (workspaceId: number) => request(`/pbl/workspace/${workspaceId}/showcase`),
  saveShowcase: (workspaceId: number, data: any) => request(`/pbl/workspace/${workspaceId}/showcase`, { method: 'POST', data }),
  getShowcaseList: (params?: any) => request('/pbl/showcase', { data: params }),
  getShowcaseDetail: (id: number) => request(`/pbl/showcase/${id}`),
  publishShowcase: (id: number) => request(`/pbl/showcase/${id}/publish`, { method: 'PUT' }),
  likeShowcase: (id: number) => request(`/pbl/showcase/${id}/like`, { method: 'POST' }),
  addShowcaseFeedback: (id: number, data: any) => request(`/pbl/showcase/${id}/feedback`, { method: 'POST', data }),
};

export default request;