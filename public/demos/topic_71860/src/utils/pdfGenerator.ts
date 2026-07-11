import { jsPDF } from 'jspdf'
import type { Contract } from '../stores/contract'

export async function generateContractPDF(contract: Contract): Promise<void> {
  // 创建一个隐藏的容器用于渲染合同内容
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: #fff;
    padding: 40px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
    color: #333;
    line-height: 1.8;
    z-index: -1;
  `

  const signatureHtml = contract.signatureImage
    ? `<div style="margin-top: 10px;"><img src="${contract.signatureImage}" style="width: 120px; height: 60px; object-fit: contain; border: 1px solid #eee;" /></div>`
    : ''

  const sealHtml = contract.companySeal
    ? `<div style="margin-top: 10px;"><img src="${contract.companySeal}" style="width: 100px; height: 100px; object-fit: contain;" /></div>`
    : ''

  const idCardFrontHtml = contract.idCardFront
    ? `<img src="${contract.idCardFront}" style="width: 280px; height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;" />`
    : ''

  const idCardBackHtml = contract.idCardBack
    ? `<img src="${contract.idCardBack}" style="width: 280px; height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;" />`
    : ''

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="font-size: 24px; color: #1677ff; margin: 0;">电子服务合同</h1>
      <div style="width: 100%; height: 2px; background: #1677ff; margin-top: 10px;"></div>
    </div>

    <div style="font-size: 13px; line-height: 2; color: #333;">
      <p><strong>甲方（服务提供方）：</strong>科技有限公司</p>
      <p><strong>乙方（服务接受方）：</strong>${contract.idCardInfo?.name || '用户'}</p>
      <p style="margin-top: 15px;">鉴于甲方是一家依法设立并有效存续的科技公司，拥有提供相关服务的资质和能力；乙方有接受相关服务的需求，双方本着平等互利、诚实信用的原则，经友好协商，就乙方向甲方购买服务事宜达成如下协议：</p>

      <p style="font-weight: bold; margin-top: 15px;">第一条 服务内容</p>
      <p>1.1 甲方同意向乙方提供以下服务：技术咨询、软件开发、系统维护等相关技术服务。</p>
      <p>1.2 服务的具体内容、标准、要求等详见附件《服务说明书》。</p>

      <p style="font-weight: bold; margin-top: 15px;">第二条 服务期限</p>
      <p>2.1 本合同服务期限自合同生效之日起计算，为期一年。</p>
      <p>2.2 服务期满前三十日，双方可协商续签事宜。</p>

      <p style="font-weight: bold; margin-top: 15px;">第三条 服务费用</p>
      <p>3.1 乙方应向甲方支付的服务费用为人民币壹万元整。</p>
      <p>3.2 付款方式：乙方应在合同签订后五个工作日内支付全部服务费用。</p>

      <p style="font-weight: bold; margin-top: 15px;">第四条 甲方权利与义务</p>
      <p>4.1 甲方应按照本合同约定向乙方提供服务。</p>
      <p>4.2 甲方应保证所提供服务的质量符合行业标准。</p>
      <p>4.3 甲方应对乙方的商业秘密负有保密义务。</p>

      <p style="font-weight: bold; margin-top: 15px;">第五条 乙方权利与义务</p>
      <p>5.1 乙方有权要求甲方按照合同约定提供服务。</p>
      <p>5.2 乙方应按时支付服务费用。</p>
      <p>5.3 乙方应配合甲方完成服务所需的相关工作。</p>

      <p style="font-weight: bold; margin-top: 15px;">第六条 保密条款</p>
      <p>6.1 双方应对在履行本合同过程中知悉的对方商业秘密予以保密。</p>
      <p>6.2 未经对方书面同意，任何一方不得向第三方披露对方的商业秘密。</p>

      <p style="font-weight: bold; margin-top: 15px;">第七条 违约责任</p>
      <p>7.1 任何一方违反本合同约定，应承担相应的违约责任。</p>
      <p>7.2 因违约给对方造成损失的，违约方应赔偿对方的实际损失。</p>

      <p style="font-weight: bold; margin-top: 15px;">第八条 争议解决</p>
      <p>8.1 本合同的签订、履行、解释及争议解决均适用中华人民共和国法律。</p>
      <p>8.2 双方因本合同发生的争议，应首先通过友好协商解决；协商不成的，任何一方均可向甲方所在地人民法院提起诉讼。</p>

      <p style="font-weight: bold; margin-top: 15px;">第九条 其他</p>
      <p>9.1 本合同一式两份，甲乙双方各执一份，具有同等法律效力。</p>
      <p>9.2 本合同自双方签字（或盖章）之日起生效。</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc;">
      <h2 style="font-size: 16px; color: #1677ff; margin-bottom: 15px;">签约信息</h2>

      ${contract.idCardInfo ? `
      <div style="margin-bottom: 15px;">
        <p style="font-weight: bold; color: #666; margin-bottom: 5px;">客户身份信息</p>
        <p style="margin: 3px 0;">姓名：${contract.idCardInfo.name}</p>
        <p style="margin: 3px 0;">身份证号：${contract.idCardInfo.idNumber}</p>
        <p style="margin: 3px 0;">地址：${contract.idCardInfo.address}</p>
      </div>
      ` : ''}

      ${contract.signTime ? `
      <div style="margin-bottom: 15px;">
        <p style="font-weight: bold; color: #666; margin-bottom: 5px;">签约时间</p>
        <p>${contract.signTime}</p>
      </div>
      ` : ''}

      <div style="display: flex; gap: 60px; margin-top: 20px;">
        <div>
          <p style="font-weight: bold; color: #666; margin-bottom: 5px;">乙方（客户）签名：</p>
          ${signatureHtml}
        </div>
        <div>
          <p style="font-weight: bold; color: #666; margin-bottom: 5px;">甲方（公司）盖章：</p>
          ${sealHtml}
        </div>
      </div>

      ${(contract.idCardFront || contract.idCardBack) ? `
      <div style="margin-top: 20px;">
        <p style="font-weight: bold; color: #666; margin-bottom: 10px;">身份证照片：</p>
        <div style="display: flex; gap: 20px;">
          <div>
            <p style="font-size: 12px; color: #999; margin-bottom: 5px;">正面</p>
            ${idCardFrontHtml}
          </div>
          <div>
            <p style="font-size: 12px; color: #999; margin-bottom: 5px;">反面</p>
            ${idCardBackHtml}
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center;">
      <p style="font-size: 11px; color: #999;">本合同为电子版，具有同等法律效力。</p>
      <p style="font-size: 11px; color: #999;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
    </div>
  `

  document.body.appendChild(container)

  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2

    let position = 0
    let heightLeft = imgHeight * ratio

    pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio)
    heightLeft -= pdfHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight * ratio
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio)
      heightLeft -= pdfHeight
    }

    pdf.save(`电子服务合同_${contract.idCardInfo?.name || '客户'}_${contract.id}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
