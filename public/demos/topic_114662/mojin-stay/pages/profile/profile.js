Page({
  data: {
    user: {
      name: "旅居管家",
      role: "房东 / 运营者",
      phone: "未绑定"
    },
    menus: [
      { title: "收款账户", desc: "银行卡、微信收款、开票资料" },
      { title: "消息提醒", desc: "收租日、逾期、水电表提醒" },
      { title: "合同模板", desc: "短租、月租、押金协议" },
      { title: "数据备份", desc: "导出租客与账单表格" }
    ]
  },
  login() {
    wx.getUserProfile({
      desc: "用于显示管家头像和昵称",
      success: (res) => {
        this.setData({ "user.name": res.userInfo.nickName })
      }
    })
  }
})
