import request from '@/utils/request'

export const authApi = {
  sendEmailCode(data) {
    return request.post('/auth/email-code', data)
  },
  login(data) {
    return request.post('/auth/login', data)
  },
  register(data) {
    return request.post('/auth/register', data)
  },
  getProfile() {
    return request.get('/auth/profile')
  }
}

export const merchantApi = {
  getProfile() {
    return request.get('/merchants/profile')
  },
  updateProfile(data) {
    return request.put('/merchants/profile', data)
  },
  getStores(config = {}) {
    return request.get('/merchants/stores', config)
  },
  createStore(data, config = {}) {
    return request.post('/merchants/stores', data, config)
  },
  getStore(id) {
    return request.get(`/merchants/stores/${id}`)
  },
  updateStore(id, data, config = {}) {
    return request.put(`/merchants/stores/${id}`, data, config)
  },
  deleteStore(id, config = {}) {
    return request.delete(`/merchants/stores/${id}`, config)
  }
}

export const employeeApi = {
  getEmployees(params = {}) {
    return request.get('/employees/', { params })
  },
  createEmployee(data) {
    return request.post('/employees/', data)
  },
  updateEmployee(id, data) {
    return request.put(`/employees/${id}`, data)
  },
  updateEmployeeStatus(id, status) {
    return request.patch(`/employees/${id}/status`, { status })
  },
  assignEmployeeStores(id, storeIds = []) {
    return request.post(`/employees/${id}/stores`, { store_ids: storeIds })
  },
  getRoles() {
    return request.get('/roles/')
  },
  createRole(data) {
    return request.post('/roles/', data)
  },
  getPermissions(params = {}) {
    return request.get('/permissions/', { params })
  },
  updateRolePermissions(roleId, permissionIds = []) {
    return request.put(`/roles/${roleId}/permissions`, { permission_ids: permissionIds })
  }
}

export const tableApi = {
  getTableAreas(params = {}, config = {}) {
    return request.get('/table-areas/', { params, ...config })
  },
  createTableArea(data) {
    return request.post('/table-areas/', data)
  },
  updateTableArea(id, data) {
    return request.put(`/table-areas/${id}`, data)
  },
  updateTableAreaStatus(id, status) {
    return request.patch(`/table-areas/${id}/status`, { status })
  },
  getTables(params = {}, config = {}) {
    return request.get('/tables/', { params, ...config })
  },
  createTable(data) {
    return request.post('/tables/', data)
  },
  updateTable(id, data) {
    return request.put(`/tables/${id}`, data)
  },
  updateTableStatus(id, enabled) {
    return request.patch(`/tables/${id}/status`, { enabled })
  },
  openTable(id, data) {
    return request.post(`/tables/${id}/open`, data)
  },
  clearTable(id, data = {}) {
    return request.post(`/tables/${id}/clear`, data)
  },
  transferTable(id, data) {
    return request.post(`/tables/${id}/transfer`, data)
  },
  getTableOperationLogs(params = {}, config = {}) {
    return request.get('/table-operation-logs/', { params, ...config })
  }
}

export const posApi = {
  getOrders(params = {}, config = {}) {
    return request.get('/pos/orders/', { params, ...config })
  },
  getOrder(id, config = {}) {
    return request.get(`/pos/orders/${id}`, config)
  },
  createOrder(data) {
    return request.post('/pos/orders/', data)
  },
  addOrderItem(orderId, data) {
    return request.post(`/pos/orders/${orderId}/items`, data)
  },
  updateOrderItemQuantity(orderId, itemId, quantity) {
    return request.patch(`/pos/orders/${orderId}/items/${itemId}`, { quantity })
  },
  suspendOrder(orderId, data = {}) {
    return request.post(`/pos/orders/${orderId}/suspend`, data)
  },
  cancelOrder(orderId, data = {}) {
    return request.post(`/pos/orders/${orderId}/cancel`, data)
  },
  checkoutOrder(orderId, data = {}) {
    return request.post(`/pos/orders/${orderId}/checkout`, data)
  },
  refundOrder(orderId, data = {}) {
    return request.post(`/pos/orders/${orderId}/refunds`, data)
  },
  getOrderLogs(params = {}, config = {}) {
    return request.get('/pos/order-logs/', { params, ...config })
  }
}

export const paymentApi = {
  getPayments(params = {}, config = {}) {
    return request.get('/payments/', { params, ...config })
  },
  createPayment(data) {
    return request.post('/payments/', data)
  },
  getRefunds(params = {}, config = {}) {
    return request.get('/payments/refunds/', { params, ...config })
  },
  createRefund(paymentId, data) {
    return request.post(`/payments/${paymentId}/refunds`, data)
  }
}

export const reconciliationApi = {
  getDailySummary(params = {}, config = {}) {
    return request.get('/reconciliations/daily', { params, ...config })
  },
  generateDaily(data) {
    return request.post('/reconciliations/daily/generate', data)
  },
  getDailyRecords(params = {}, config = {}) {
    return request.get('/reconciliations/daily/records', { params, ...config })
  },
  getVariances(params = {}, config = {}) {
    return request.get('/reconciliations/variances', { params, ...config })
  }
}

export const advancedApi = {
  getKitchenTasks(params = {}, config = {}) {
    return request.get('/advanced/kitchen/tasks', { params, ...config })
  },
  createKitchenTask(data) {
    return request.post('/advanced/kitchen/tasks', data)
  },
  updateKitchenTaskStatus(id, data) {
    return request.patch(`/advanced/kitchen/tasks/${id}/status`, data)
  },
  urgeKitchenTask(id) {
    return request.post(`/advanced/kitchen/tasks/${id}/urge`)
  },
  getSuppliers(params = {}, config = {}) {
    return request.get('/advanced/suppliers', { params, ...config })
  },
  createSupplier(data) {
    return request.post('/advanced/suppliers', data)
  },
  getPurchases(params = {}, config = {}) {
    return request.get('/advanced/purchases', { params, ...config })
  },
  createPurchase(data) {
    return request.post('/advanced/purchases', data)
  },
  receivePurchase(id) {
    return request.post(`/advanced/purchases/${id}/receive`)
  },
  getStockIn(params = {}, config = {}) {
    return request.get('/advanced/stock-in', { params, ...config })
  },
  createStockIn(data) {
    return request.post('/advanced/stock-in', data)
  },
  getPurchaseReturns(params = {}, config = {}) {
    return request.get('/advanced/purchase-returns', { params, ...config })
  },
  createPurchaseReturn(data) {
    return request.post('/advanced/purchase-returns', data)
  },
  getFinancialDaily(params = {}, config = {}) {
    return request.get('/advanced/finance/daily', { params, ...config })
  },
  getCouponTemplates(params = {}, config = {}) {
    return request.get('/advanced/coupons/templates', { params, ...config })
  },
  createCouponTemplate(data) {
    return request.post('/advanced/coupons/templates', data)
  },
  issueCoupon(data) {
    return request.post('/advanced/coupons/issue', data)
  },
  quoteCoupon(data) {
    return request.post('/advanced/coupons/quote', data)
  },
  redeemCoupon(data) {
    return request.post('/advanced/coupons/redeem', data)
  },
  getDeliveryStores(params = {}, config = {}) {
    return request.get('/advanced/delivery/stores', { params, ...config })
  },
  createDeliveryStore(data) {
    return request.post('/advanced/delivery/stores', data)
  },
  getDeliveryOrders(params = {}, config = {}) {
    return request.get('/advanced/delivery/orders', { params, ...config })
  },
  createDeliveryOrder(data) {
    return request.post('/advanced/delivery/orders', data)
  },
  getDeliveryVoucherRedemptions(params = {}, config = {}) {
    return request.get('/advanced/delivery/voucher-redemptions', { params, ...config })
  },
  redeemDeliveryVoucher(data) {
    return request.post('/advanced/delivery/voucher-redemptions', data)
  },
  getAudits(params = {}, config = {}) {
    return request.get('/advanced/audits', { params, ...config })
  },
  createAudit(data) {
    return request.post('/advanced/audits', data)
  },
  getRisks(params = {}, config = {}) {
    return request.get('/advanced/risks', { params, ...config })
  },
  createRisk(data) {
    return request.post('/advanced/risks', data)
  },
  getSummary(config = {}) {
    return request.get('/advanced/summary', config)
  }
}

export const dashboardApi = {
  getDashboard() {
    return request.get('/dashboard/')
  },
  getSalesSummary() {
    return request.get('/dashboard/sales-summary')
  },
  getRevenueTrend(days = 7) {
    return request.get(`/dashboard/revenue-trend?days=${days}`)
  }
}

export const aiApi = {
  chat(data) {
    return request.post('/ai/chat', data)
  },
  chatStream(data) {
    return request.post('/ai/chat/stream', data, { responseType: 'stream' })
  },
  generatePlan(data) {
    return request.post('/ai/generate-plan', data)
  },
  analyzeData(data) {
    return request.post('/ai/analyze-data', data)
  },
  structuredDiagnosis(data = {}, config = {}) {
    return request.post('/ai/structured-diagnosis', data, config)
  },
  getDailyBrief() {
    return request.get('/ai/daily-brief')
  },
  generateProactiveAlerts(data = {}) {
    return request.post('/ai/proactive-alerts', data)
  },
  createActionCard(data) {
    return request.post('/ai/action-cards', data)
  },
  previewActionCard(data) {
    return request.post('/ai/action-cards/preview', data)
  },
  getActionCards(params = {}) {
    return request.get('/ai/action-cards', { params })
  },
  updateActionCard(id, data) {
    return request.patch(`/ai/action-cards/${id}`, data)
  },
  updateActionCardStatus(id, status, extra = {}) {
    return request.patch(`/ai/action-cards/${id}/status`, { status, ...extra })
  },
  generateActionMaterial(id, materialType = 'marketing_copy') {
    return request.post(`/ai/action-cards/${id}/material`, { material_type: materialType })
  },
  reviewActionCard(id) {
    return request.post(`/ai/action-cards/${id}/review`)
  },
  getMemories(params = {}) {
    return request.get('/ai/memories', { params })
  },
  getQualityCases() {
    return request.get('/ai/quality-cases')
  },
  createQualityCase(data) {
    return request.post('/ai/quality-cases', data)
  },
  runQualityCase(id) {
    return request.post(`/ai/quality-cases/${id}/run`)
  },
  runAllQualityCases() {
    return request.post('/ai/quality-cases/run-all')
  },
  getTools() {
    return request.get('/ai/tools')
  },
  executeTool(toolName, parameters = {}) {
    return request.post(`/ai/tools/${toolName}/execute`, parameters)
  },
  getAgents(params = {}) {
    return request.get('/ai/agents', { params })
  },
  createAgent(data) {
    return request.post('/ai/agents', data)
  },
  updateAgent(id, data) {
    return request.put(`/ai/agents/${id}`, data)
  },
  deleteAgent(id) {
    return request.delete(`/ai/agents/${id}`)
  },
  uploadFile(data) {
    return request.post('/ai/upload', data)
  },
  confirmStore(data) {
    return request.post('/ai/stores/confirm', data)
  },
  getConversations() {
    return request.get('/ai/conversations')
  },
  getConversationMessages(sessionId) {
    return request.get(`/ai/conversations/${sessionId}/messages`)
  },
  analyzeCompetitor(data) {
    return request.post('/ai/analyze-competitor', data)
  },
  analyzeCompetitorStream(data) {
    return request.post('/ai/analyze-competitor/stream', data, { responseType: 'stream' })
  },
  generateReport(data) {
    return request.post('/ai/generate-report', data)
  },
  generateReportStream(data) {
    return request.post('/ai/generate-report/stream', data, { responseType: 'stream' })
  },
  generatePlanAdvice(data) {
    return request.post('/ai/generate-plan-advice', data)
  },
  generatePlanAdviceStream(data) {
    return request.post('/ai/generate-plan-advice/stream', data, { responseType: 'stream' })
  }
}

export const operationApi = {
  getPlans() {
    return request.get('/operations/plans')
  },
  createPlan(data) {
    return request.post('/operations/plans', data)
  },
  getPlan(id) {
    return request.get(`/operations/plans/${id}`)
  },
  updatePlan(id, data) {
    return request.put(`/operations/plans/${id}`, data)
  },
  deletePlan(id) {
    return request.delete(`/operations/plans/${id}`)
  },
  generateCopy(data) {
    return request.post('/operations/generate-copy', data)
  },
  menuOptimize(data) {
    return request.post('/operations/menu-optimize', data)
  },
  getCompetitors() {
    return request.get('/operations/competitors')
  },
  addCompetitor(data) {
    return request.post('/operations/competitors', data)
  }
}

export const memberApi = {
  getMembers(params = {}) {
    return request.get('/members/', { params })
  },
  getMember(id) {
    return request.get(`/members/${id}`)
  },
  createMember(data) {
    return request.post('/members/', data)
  },
  updateMember(id, data) {
    return request.put(`/members/${id}`, data)
  },
  deleteMember(id) {
    return request.delete(`/members/${id}`)
  },
  getMemberStats(params = {}) {
    return request.get('/members/stats/overview', { params })
  },
  getLevelDistribution(params = {}) {
    return request.get('/members/stats/level-distribution', { params })
  },
  getTopActive(params = {}) {
    return request.get('/members/top-active', { params })
  }
}

export const dishApi = {
  getDishes(params = {}) {
    return request.get('/dishes/', { params })
  },
  getDish(id) {
    return request.get(`/dishes/${id}`)
  },
  createDish(data) {
    return request.post('/dishes/', data)
  },
  updateDish(id, data) {
    return request.put(`/dishes/${id}`, data)
  },
  deleteDish(id) {
    return request.delete(`/dishes/${id}`)
  },
  uploadImage(id, file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post(`/dishes/${id}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  batchUpdateImages(data) {
    return request.post('/dishes/batch-update-images', data)
  },
  getDishesWithoutImages(params = {}) {
    return request.get('/dishes/without-images', { params })
  },
  generateImages(data) {
    return request.post('/dishes/generate-images', data)
  }
}

export const categoryApi = {
  getCategories(params = {}) {
    return request.get('/categories/', { params })
  },
  getCategory(id) {
    return request.get(`/categories/${id}`)
  },
  createCategory(data) {
    return request.post('/categories/', data)
  },
  updateCategory(id, data) {
    return request.put(`/categories/${id}`, data)
  },
  deleteCategory(id) {
    return request.delete(`/categories/${id}`)
  }
}

export const dataInputApi = {
  submitDaily(data) {
    return request.post('/data/daily', data)
  },
  getDailyHistory() {
    return request.get('/data/daily-history')
  },
  getSalesSummary(params = {}) {
    return request.get('/data/sales-summary', { params })
  }
}
