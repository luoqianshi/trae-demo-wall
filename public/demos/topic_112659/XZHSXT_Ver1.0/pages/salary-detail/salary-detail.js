const app = getApp()
const { 
  getSalaryById,
  exportPDF
} = require('../../utils/mock-api.js')
const { 
  showToast, 
  showLoading, 
  hideLoading,
  formatMoney
} = require('../../utils/util.js')

Page({
  data: {
    salaryId: '',
    month: '',
    salary: null,
    loading: true,
    showExportModal: false
  },

  onLoad(options) {
    const id = options.id
    const month = options.month
    
    this.setData({ salaryId: id, month })
    this.loadSalaryDetail()
  },

  loadSalaryDetail() {
    const { salaryId, month } = this.data
    const salary = getSalaryById(salaryId, month)
    
    if (salary) {
      const formatted = {
        ...salary,
        baseSalaryStr: formatMoney(salary.baseSalary),
        postSalaryStr: formatMoney(salary.postSalary),
        fixedAllowanceStr: formatMoney(salary.fixedAllowance),
        trafficAllowanceStr: formatMoney(salary.trafficAllowance),
        communicationAllowanceStr: formatMoney(salary.communicationAllowance),
        performanceBonusStr: formatMoney(salary.performanceBonus),
        fixedSalaryStr: formatMoney(salary.fixedSalary),
        totalAllowanceStr: formatMoney(salary.totalAllowance),
        
        personalLeaveDeductionStr: formatMoney(salary.personalLeaveDeduction),
        sickLeaveDeductionStr: formatMoney(salary.sickLeaveDeduction),
        lateDeductionStr: formatMoney(salary.lateDeduction),
        otherDeductionStr: formatMoney(salary.otherDeduction),
        totalAttendanceDeductionStr: formatMoney(salary.totalAttendanceDeduction),
        
        socialSecurityPersonalStr: formatMoney(salary.socialSecurityPersonal),
        housingFundPersonalStr: formatMoney(salary.housingFundPersonal),
        personalIncomeTaxStr: formatMoney(salary.personalIncomeTax),
        
        grossSalaryStr: formatMoney(salary.grossSalary),
        preTaxSalaryStr: formatMoney(salary.preTaxSalary),
        netSalaryStr: formatMoney(salary.netSalary)
      }
      
      this.setData({ salary: formatted, loading: false })
    } else {
      this.setData({ loading: false })
      showToast('未找到薪资数据')
    }
  },

  openExportModal() {
    this.setData({ showExportModal: true })
  },

  closeExportModal() {
    this.setData({ showExportModal: false })
  },

  async exportAs(e) {
    const type = e.currentTarget.dataset.type
    showLoading('生成文件中...')
    
    try {
      const result = await exportPDF(type, this.data.salary)
      hideLoading()
      this.setData({ showExportModal: false })
      
      if (result.success) {
        showToast('文件已生成，可保存至手机', 'success')
      }
    } catch (e) {
      hideLoading()
      showToast('导出失败')
    }
  },

  saveImage() {
    wx.saveImageToPhotosAlbum({
      filePath: '',
      success: () => {
        showToast('已保存到相册', 'success')
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去授权',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          showToast('保存失败')
        }
      }
    })
  },

  onShareAppMessage() {
    return {
      title: `${this.data.month} 薪资条`,
      path: `/pages/salary-detail/salary-detail?id=${this.data.salaryId}&month=${this.data.month}`
    }
  }
})
