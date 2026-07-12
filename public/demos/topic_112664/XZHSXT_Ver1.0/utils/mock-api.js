const { uuid, formatMoney, getCurrentMonth } = require('./util.js')

const STORAGE_KEYS = {
  EMPLOYEES: 'mock_employees',
  ATTENDANCE: 'mock_attendance',
  SOCIAL_SECURITY: 'mock_social_security',
  SALARY_RECORDS: 'mock_salary_records',
  SALARY_ITEMS: 'mock_salary_items',
  LOCK_STATUS: 'mock_lock_status'
}

function getStorage(key, defaultValue) {
  try {
    const data = wx.getStorageSync(key)
    return data || defaultValue
  } catch (e) {
    return defaultValue
  }
}

function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data)
    return true
  } catch (e) {
    return false
  }
}

function initMockData() {
  if (!getStorage(STORAGE_KEYS.EMPLOYEES, null)) {
    const departments = ['技术部', '产品部', '市场部', '财务部', '人事部', '行政部']
    const positions = ['工程师', '经理', '主管', '专员', '总监', '助理']
    const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡']
    const lastNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明']
    
    const employees = []
    for (let i = 1; i <= 20; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = firstName + lastName
      const deptIndex = Math.floor(Math.random() * departments.length)
      const baseSalary = 5000 + Math.floor(Math.random() * 15000)
      const postSalary = 1000 + Math.floor(Math.random() * 5000)
      
      employees.push({
        id: uuid(),
        employeeNo: `EMP${String(i).padStart(4, '0')}`,
        name,
        department: departments[deptIndex],
        position: positions[Math.floor(Math.random() * positions.length)],
        hireDate: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
        status: Math.random() > 0.1 ? 'active' : 'inactive',
        baseSalary,
        postSalary,
        fixedAllowance: 500 + Math.floor(Math.random() * 1500),
        phone: `13${Math.floor(Math.random() * 9) + 1}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        idCard: '',
        createdAt: new Date().toISOString()
      })
    }
    setStorage(STORAGE_KEYS.EMPLOYEES, employees)
  }

  if (!getStorage(STORAGE_KEYS.SALARY_ITEMS, null)) {
    const salaryItems = {
      income: [
        { key: 'baseSalary', name: '基本工资', type: 'income', fixed: true },
        { key: 'postSalary', name: '岗位工资', type: 'income', fixed: true },
        { key: 'trafficAllowance', name: '交通补贴', type: 'income', fixed: true },
        { key: 'communicationAllowance', name: '通讯补贴', type: 'income', fixed: true },
        { key: 'performanceBonus', name: '绩效工资', type: 'income', fixed: false }
      ],
      attendanceDeduction: [
        { key: 'personalLeaveDeduction', name: '事假扣款', type: 'deduction' },
        { key: 'sickLeaveDeduction', name: '病假扣款', type: 'deduction' },
        { key: 'lateDeduction', name: '迟到早退扣款', type: 'deduction' },
        { key: 'otherDeduction', name: '其他扣款', type: 'deduction' }
      ],
      statutoryDeduction: [
        { key: 'socialSecurityPersonal', name: '社保个人部分', type: 'statutory' },
        { key: 'housingFundPersonal', name: '公积金个人部分', type: 'statutory' },
        { key: 'personalIncomeTax', name: '个人所得税', type: 'statutory' }
      ]
    }
    setStorage(STORAGE_KEYS.SALARY_ITEMS, salaryItems)
  }

  if (!getStorage(STORAGE_KEYS.SOCIAL_SECURITY, null)) {
    const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
    const socialSecurityList = employees.map(emp => ({
      id: uuid(),
      employeeId: emp.id,
      employeeNo: emp.employeeNo,
      name: emp.name,
      department: emp.department,
      socialBase: Math.min(Math.max(emp.baseSalary + emp.postSalary, 4000), 30000),
      housingFundBase: Math.min(Math.max(emp.baseSalary + emp.postSalary, 4000), 30000),
      socialPersonalRate: 0.105,
      housingFundPersonalRate: 0.12
    }))
    setStorage(STORAGE_KEYS.SOCIAL_SECURITY, socialSecurityList)
  }

  if (!getStorage(STORAGE_KEYS.ATTENDANCE, null)) {
    const employees = getStorage(STORAGE_KEYS.EMPLOYEES, []).filter(e => e.status === 'active')
    const currentMonth = getCurrentMonth()
    const attendanceList = employees.map(emp => {
      const workDays = 22
      const personalLeave = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0
      const sickLeave = Math.random() > 0.9 ? Math.floor(Math.random() * 2) : 0
      const absent = Math.random() > 0.95 ? Math.floor(Math.random() * 2) : 0
      const lateTimes = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0
      const lateMinutes = lateTimes * (10 + Math.floor(Math.random() * 30))
      
      const dailySalary = (emp.baseSalary + emp.postSalary) / workDays
      const personalLeaveDeduction = personalLeave * dailySalary
      const sickLeaveDeduction = sickLeave * dailySalary * 0.5
      const lateDeduction = lateMinutes * 2
      
      return {
        id: uuid(),
        employeeId: emp.id,
        employeeNo: emp.employeeNo,
        name: emp.name,
        department: emp.department,
        month: currentMonth,
        workDays: workDays - personalLeave - sickLeave - absent,
        personalLeaveDays: personalLeave,
        sickLeaveDays: sickLeave,
        absentDays: absent,
        lateTimes,
        lateMinutes,
        personalLeaveDeduction: Number(personalLeaveDeduction.toFixed(2)),
        sickLeaveDeduction: Number(sickLeaveDeduction.toFixed(2)),
        lateDeduction: Number(lateDeduction.toFixed(2)),
        otherDeduction: 0,
        createdAt: new Date().toISOString()
      }
    })
    setStorage(STORAGE_KEYS.ATTENDANCE, attendanceList)
  }

  if (!getStorage(STORAGE_KEYS.LOCK_STATUS, null)) {
    setStorage(STORAGE_KEYS.LOCK_STATUS, {})
  }
}

function getEmployeeList(params = {}) {
  initMockData()
  let employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    employees = employees.filter(e => 
      e.name.toLowerCase().includes(kw) || 
      e.employeeNo.toLowerCase().includes(kw)
    )
  }
  
  if (params.department && params.department !== 'all') {
    employees = employees.filter(e => e.department === params.department)
  }
  
  if (params.status && params.status !== 'all') {
    employees = employees.filter(e => e.status === params.status)
  }
  
  if (params.status === 'active-only') {
    employees = employees.filter(e => e.status === 'active')
  }
  
  return employees
}

function getEmployeeById(id) {
  const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  return employees.find(e => e.id === id)
}

function getEmployeeByNo(employeeNo) {
  const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  return employees.find(e => e.employeeNo === employeeNo)
}

function addEmployee(data) {
  const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  
  const existing = employees.find(e => e.employeeNo === data.employeeNo)
  if (existing) {
    throw new Error('工号已存在')
  }
  
  const newEmployee = {
    id: uuid(),
    ...data,
    status: data.status || 'active',
    createdAt: new Date().toISOString()
  }
  
  employees.push(newEmployee)
  setStorage(STORAGE_KEYS.EMPLOYEES, employees)
  
  const socialSecurityList = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  socialSecurityList.push({
    id: uuid(),
    employeeId: newEmployee.id,
    employeeNo: newEmployee.employeeNo,
    name: newEmployee.name,
    department: newEmployee.department,
    socialBase: newEmployee.baseSalary + newEmployee.postSalary,
    housingFundBase: newEmployee.baseSalary + newEmployee.postSalary,
    socialPersonalRate: 0.105,
    housingFundPersonalRate: 0.12
  })
  setStorage(STORAGE_KEYS.SOCIAL_SECURITY, socialSecurityList)
  
  return newEmployee
}

function updateEmployee(id, data) {
  const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  const index = employees.findIndex(e => e.id === id)
  
  if (index === -1) {
    throw new Error('员工不存在')
  }
  
  if (data.employeeNo && data.employeeNo !== employees[index].employeeNo) {
    const existing = employees.find(e => e.employeeNo === data.employeeNo)
    if (existing) {
      throw new Error('工号已存在')
    }
  }
  
  employees[index] = {
    ...employees[index],
    ...data
  }
  
  setStorage(STORAGE_KEYS.EMPLOYEES, employees)
  
  const socialSecurityList = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  const ssIndex = socialSecurityList.findIndex(s => s.employeeId === id)
  if (ssIndex !== -1) {
    socialSecurityList[ssIndex].name = data.name || socialSecurityList[ssIndex].name
    socialSecurityList[ssIndex].department = data.department || socialSecurityList[ssIndex].department
    socialSecurityList[ssIndex].employeeNo = data.employeeNo || socialSecurityList[ssIndex].employeeNo
    setStorage(STORAGE_KEYS.SOCIAL_SECURITY, socialSecurityList)
  }
  
  return employees[index]
}

function deleteEmployee(id) {
  let employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
  employees = employees.filter(e => e.id !== id)
  setStorage(STORAGE_KEYS.EMPLOYEES, employees)
  
  let socialSecurityList = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  socialSecurityList = socialSecurityList.filter(s => s.employeeId !== id)
  setStorage(STORAGE_KEYS.SOCIAL_SECURITY, socialSecurityList)
  
  return true
}

function getAttendanceList(month, params = {}) {
  initMockData()
  let attendance = getStorage(STORAGE_KEYS.ATTENDANCE, [])
  
  attendance = attendance.filter(a => a.month === month)
  
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    attendance = attendance.filter(a => 
      a.name.toLowerCase().includes(kw) || 
      a.employeeNo.toLowerCase().includes(kw)
    )
  }
  
  if (params.department && params.department !== 'all') {
    attendance = attendance.filter(a => a.department === params.department)
  }
  
  return attendance
}

function getAttendanceByEmployee(employeeId, month) {
  const attendance = getStorage(STORAGE_KEYS.ATTENDANCE, [])
  return attendance.find(a => a.employeeId === employeeId && a.month === month)
}

function saveAttendance(data) {
  let attendance = getStorage(STORAGE_KEYS.ATTENDANCE, [])
  const index = attendance.findIndex(a => a.employeeId === data.employeeId && a.month === data.month)
  
  if (index !== -1) {
    attendance[index] = {
      ...attendance[index],
      ...data
    }
  } else {
    attendance.push({
      id: uuid(),
      ...data,
      createdAt: new Date().toISOString()
    })
  }
  
  setStorage(STORAGE_KEYS.ATTENDANCE, attendance)
  return true
}

function calculateAttendanceDeduction(employee, attendanceData) {
  const workDays = 22
  const dailySalary = (Number(employee.baseSalary) + Number(employee.postSalary)) / workDays
  
  const personalLeaveDeduction = Number(attendanceData.personalLeaveDays || 0) * dailySalary
  const sickLeaveDeduction = Number(attendanceData.sickLeaveDays || 0) * dailySalary * 0.5
  const lateDeduction = Number(attendanceData.lateMinutes || 0) * 2
  const otherDeduction = Number(attendanceData.otherDeduction || 0)
  
  return {
    personalLeaveDeduction: Number(personalLeaveDeduction.toFixed(2)),
    sickLeaveDeduction: Number(sickLeaveDeduction.toFixed(2)),
    lateDeduction: Number(lateDeduction.toFixed(2)),
    otherDeduction: Number(otherDeduction.toFixed(2)),
    totalDeduction: Number((personalLeaveDeduction + sickLeaveDeduction + lateDeduction + otherDeduction).toFixed(2))
  }
}

function importAttendance(month, fileData) {
  return {
    success: true,
    total: 20,
    successCount: 18,
    failCount: 2,
    errors: [
      { employeeNo: 'EMP0015', name: '某员工', reason: '工号不存在' },
      { employeeNo: 'EMP0018', name: '某员工', reason: '出勤天数不能大于22天' }
    ]
  }
}

function getSocialSecurityList(params = {}) {
  initMockData()
  let list = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter(s => 
      s.name.toLowerCase().includes(kw) || 
      s.employeeNo.toLowerCase().includes(kw)
    )
  }
  
  if (params.department && params.department !== 'all') {
    list = list.filter(s => s.department === params.department)
  }
  
  if (params.onlyActive) {
    const employees = getStorage(STORAGE_KEYS.EMPLOYEES, [])
    const activeIds = employees.filter(e => e.status === 'active').map(e => e.id)
    list = list.filter(s => activeIds.includes(s.employeeId))
  }
  
  return list
}

function getSocialSecurityByEmployee(employeeId) {
  const list = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  return list.find(s => s.employeeId === employeeId)
}

function updateSocialSecurity(employeeId, data) {
  let list = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  const index = list.findIndex(s => s.employeeId === employeeId)
  
  if (index === -1) {
    throw new Error('记录不存在')
  }
  
  list[index] = {
    ...list[index],
    ...data
  }
  
  setStorage(STORAGE_KEYS.SOCIAL_SECURITY, list)
  return list[index]
}

function batchUpdateSocialSecurity(employeeIds, data) {
  let list = getStorage(STORAGE_KEYS.SOCIAL_SECURITY, [])
  
  list = list.map(item => {
    if (employeeIds.includes(item.employeeId)) {
      return { ...item, ...data }
    }
    return item
  })
  
  setStorage(STORAGE_KEYS.SOCIAL_SECURITY, list)
  return true
}

function calculateSocialSecurityAmount(socialSecurity) {
  const socialPersonal = Number((socialSecurity.socialBase * socialSecurity.socialPersonalRate).toFixed(2))
  const housingFundPersonal = Number((socialSecurity.housingFundBase * socialSecurity.housingFundPersonalRate).toFixed(2))
  
  return {
    socialPersonal,
    housingFundPersonal,
    total: Number((socialPersonal + housingFundPersonal).toFixed(2))
  }
}

function getSalaryItems() {
  initMockData()
  return getStorage(STORAGE_KEYS.SALARY_ITEMS, {})
}

function calculatePersonalTax(taxableIncome, cumulativeTaxableIncome = 0) {
  const totalTaxable = cumulativeTaxableIncome + taxableIncome
  
  let tax = 0
  if (totalTaxable <= 36000) {
    tax = totalTaxable * 0.03
  } else if (totalTaxable <= 144000) {
    tax = totalTaxable * 0.1 - 2520
  } else if (totalTaxable <= 300000) {
    tax = totalTaxable * 0.2 - 16920
  } else if (totalTaxable <= 420000) {
    tax = totalTaxable * 0.25 - 31920
  } else if (totalTaxable <= 660000) {
    tax = totalTaxable * 0.3 - 52920
  } else if (totalTaxable <= 960000) {
    tax = totalTaxable * 0.35 - 85920
  } else {
    tax = totalTaxable * 0.45 - 181920
  }
  
  return Number(Math.max(0, tax).toFixed(2))
}

function calculateSalary(employee, attendance, socialSecurity, month) {
  const baseSalary = Number(employee.baseSalary)
  const postSalary = Number(employee.postSalary)
  const fixedAllowance = Number(employee.fixedAllowance)
  const trafficAllowance = 300
  const communicationAllowance = 200
  const performanceBonus = Math.floor(Math.random() * 2000)
  
  const attendanceDeduction = calculateAttendanceDeduction(employee, {
    personalLeaveDays: attendance.personalLeaveDays,
    sickLeaveDays: attendance.sickLeaveDays,
    lateMinutes: attendance.lateMinutes,
    otherDeduction: attendance.otherDeduction
  })
  
  const ssAmount = calculateSocialSecurityAmount(socialSecurity)
  
  const fixedSalary = baseSalary + postSalary
  const totalAllowance = fixedAllowance + trafficAllowance + communicationAllowance
  const totalDeduction = attendanceDeduction.totalDeduction
  
  const grossSalary = fixedSalary + totalAllowance + performanceBonus - totalDeduction
  const preTaxSalary = grossSalary - ssAmount.socialPersonal - ssAmount.housingFundPersonal
  const taxBase = Math.max(0, preTaxSalary - 5000)
  const personalIncomeTax = calculatePersonalTax(taxBase)
  const netSalary = preTaxSalary - personalIncomeTax
  
  return {
    id: uuid(),
    employeeId: employee.id,
    employeeNo: employee.employeeNo,
    name: employee.name,
    department: employee.department,
    position: employee.position,
    month,
    
    baseSalary,
    postSalary,
    fixedAllowance,
    trafficAllowance,
    communicationAllowance,
    performanceBonus,
    
    personalLeaveDeduction: attendanceDeduction.personalLeaveDeduction,
    sickLeaveDeduction: attendanceDeduction.sickLeaveDeduction,
    lateDeduction: attendanceDeduction.lateDeduction,
    otherDeduction: attendanceDeduction.otherDeduction,
    totalAttendanceDeduction: attendanceDeduction.totalDeduction,
    
    socialSecurityPersonal: ssAmount.socialPersonal,
    housingFundPersonal: ssAmount.housingFundPersonal,
    personalIncomeTax,
    
    fixedSalary: Number(fixedSalary.toFixed(2)),
    totalAllowance: Number(totalAllowance.toFixed(2)),
    grossSalary: Number(grossSalary.toFixed(2)),
    preTaxSalary: Number(preTaxSalary.toFixed(2)),
    netSalary: Number(netSalary.toFixed(2)),
    
    workDays: attendance.workDays,
    personalLeaveDays: attendance.personalLeaveDays,
    sickLeaveDays: attendance.sickLeaveDays,
    absentDays: attendance.absentDays,
    lateTimes: attendance.lateTimes,
    
    createdAt: new Date().toISOString()
  }
}

function calculateAllSalary(month) {
  const employees = getEmployeeList({ status: 'active-only' })
  const socialSecurityList = getSocialSecurityList({ onlyActive: true })
  const attendanceList = getAttendanceList(month)
  
  const salaryRecords = employees.map(emp => {
    const attendance = attendanceList.find(a => a.employeeId === emp.id) || {
      workDays: 22,
      personalLeaveDays: 0,
      sickLeaveDays: 0,
      absentDays: 0,
      lateTimes: 0,
      lateMinutes: 0,
      otherDeduction: 0
    }
    const ss = socialSecurityList.find(s => s.employeeId === emp.id) || {
      socialBase: emp.baseSalary + emp.postSalary,
      housingFundBase: emp.baseSalary + emp.postSalary,
      socialPersonalRate: 0.105,
      housingFundPersonalRate: 0.12
    }
    
    return calculateSalary(emp, attendance, ss, month)
  })
  
  setStorage(`${STORAGE_KEYS.SALARY_RECORDS}_${month}`, salaryRecords)
  
  return salaryRecords
}

function getSalaryRecords(month, params = {}) {
  let records = getStorage(`${STORAGE_KEYS.SALARY_RECORDS}_${month}`, [])
  
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    records = records.filter(r => 
      r.name.toLowerCase().includes(kw) || 
      r.employeeNo.toLowerCase().includes(kw)
    )
  }
  
  if (params.department && params.department !== 'all') {
    records = records.filter(r => r.department === params.department)
  }
  
  if (params.employeeId) {
    records = records.filter(r => r.employeeId === params.employeeId)
  }
  
  return records
}

function getSalaryById(id, month) {
  const records = getStorage(`${STORAGE_KEYS.SALARY_RECORDS}_${month}`, [])
  return records.find(r => r.id === id)
}

function isMonthLocked(month) {
  const lockStatus = getStorage(STORAGE_KEYS.LOCK_STATUS, {})
  return !!lockStatus[month]
}

function lockMonth(month) {
  const lockStatus = getStorage(STORAGE_KEYS.LOCK_STATUS, {})
  lockStatus[month] = {
    lockedAt: new Date().toISOString(),
    lockedBy: 'admin'
  }
  setStorage(STORAGE_KEYS.LOCK_STATUS, lockStatus)
  return true
}

function unlockMonth(month) {
  const lockStatus = getStorage(STORAGE_KEYS.LOCK_STATUS, {})
  delete lockStatus[month]
  setStorage(STORAGE_KEYS.LOCK_STATUS, lockStatus)
  return true
}

function getSalaryStatistics(month, params = {}) {
  const records = getSalaryRecords(month, params)
  
  if (records.length === 0) {
    return {
      totalCount: 0,
      totalGross: 0,
      totalNet: 0,
      avgGross: 0,
      avgNet: 0,
      departments: []
    }
  }
  
  const totalGross = records.reduce((sum, r) => sum + r.grossSalary, 0)
  const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0)
  
  const deptMap = {}
  records.forEach(r => {
    if (!deptMap[r.department]) {
      deptMap[r.department] = {
        department: r.department,
        count: 0,
        totalGross: 0,
        totalNet: 0
      }
    }
    deptMap[r.department].count++
    deptMap[r.department].totalGross += r.grossSalary
    deptMap[r.department].totalNet += r.netSalary
  })
  
  const departments = Object.values(deptMap).map(d => ({
    ...d,
    avgGross: Number((d.totalGross / d.count).toFixed(2)),
    avgNet: Number((d.totalNet / d.count).toFixed(2)),
    totalGross: Number(d.totalGross.toFixed(2)),
    totalNet: Number(d.totalNet.toFixed(2))
  }))
  
  return {
    totalCount: records.length,
    totalGross: Number(totalGross.toFixed(2)),
    totalNet: Number(totalNet.toFixed(2)),
    avgGross: Number((totalGross / records.length).toFixed(2)),
    avgNet: Number((totalNet / records.length).toFixed(2)),
    departments
  }
}

function getEmployeeSalaryHistory(employeeId) {
  const months = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  
  const history = []
  months.forEach(month => {
    const records = getSalaryRecords(month, { employeeId })
    if (records.length > 0) {
      history.push(records[0])
    }
  })
  
  return history
}

function exportExcel(type, month, params = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        fileName: `${type}_${month}.xlsx`,
        fileUrl: 'https://example.com/files/export.xlsx'
      })
    }, 1000)
  })
}

function exportPDF(type, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        fileName: `${type}.pdf`,
        fileUrl: 'https://example.com/files/export.pdf'
      })
    }, 1000)
  })
}

module.exports = {
  STORAGE_KEYS,
  initMockData,
  
  getEmployeeList,
  getEmployeeById,
  getEmployeeByNo,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  
  getAttendanceList,
  getAttendanceByEmployee,
  saveAttendance,
  calculateAttendanceDeduction,
  importAttendance,
  
  getSocialSecurityList,
  getSocialSecurityByEmployee,
  updateSocialSecurity,
  batchUpdateSocialSecurity,
  calculateSocialSecurityAmount,
  
  getSalaryItems,
  calculateAllSalary,
  getSalaryRecords,
  getSalaryById,
  isMonthLocked,
  lockMonth,
  unlockMonth,
  
  getSalaryStatistics,
  getEmployeeSalaryHistory,
  
  exportExcel,
  exportPDF
}
