import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ServiceCategory, ServiceOrder } from '@core/models';

@Component({
  selector: 'app-services',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent {
  services: ServiceCategory[] = [
    { type: 'cooking', name: '助餐服务', description: '社区食堂订餐、送餐上门', icon: 'shop', buttonText: '立即订餐', color: '#D4763C' },
    { type: 'cleaning', name: '家政保洁', description: '预约保洁、洗衣、维修', icon: 'thunderbolt', buttonText: '预约服务', color: '#5B8DC9' },
    { type: 'other', name: '代买代办', description: '代购生活用品、代办政务', icon: 'shopping', buttonText: '发布需求', color: '#4A9D6E' },
    { type: 'accompany', name: '出行协助', description: '叫车服务、陪医陪诊', icon: 'car', buttonText: '预约陪诊', color: '#E89B6A' },
    { type: 'repair', name: '适老改造', description: '居家环境评估与改造', icon: 'home', buttonText: '免费评估', color: '#8F4720' },
    { type: 'nursing', name: '在线问诊', description: '视频问诊、健康咨询', icon: 'medicine-box', buttonText: '立即问诊', color: '#D04848' },
  ];

  orders: ServiceOrder[] = [
    { id: 1, elderId: 1, orderedBy: 1, serviceType: 'cooking', serviceName: '社区午餐', status: 'delivered', amount: 15, orderedAt: new Date('2026-07-02T11:00:00') },
    { id: 2, elderId: 1, orderedBy: 1, serviceType: 'cleaning', serviceName: '保洁服务', status: 'completed', amount: 80, orderedAt: new Date('2026-06-30T14:00:00') },
    { id: 3, elderId: 1, orderedBy: 1, serviceType: 'other', serviceName: '代购药品', status: 'completed', amount: 45, orderedAt: new Date('2026-06-28T09:00:00') },
  ];
}
