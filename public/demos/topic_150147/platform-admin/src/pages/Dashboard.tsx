import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { BankOutlined, ProjectOutlined, TeamOutlined, DollarOutlined, TrophyOutlined, ExperimentOutlined, SwapOutlined, SendOutlined, PieChartOutlined } from '@ant-design/icons';
import { adminAPI, achievementAPI, adminOPCAPI } from '../services/api';

const categoryLabels: Record<string, string> = {
  internet: '互联网', design: '文创设计', ecommerce: '电商运营',
  engineering: '工程实践', media: '新媒体', education: '教育', other: '其他',
};

const industryLabels: Record<string, string> = {
  internet: '互联网', design: '设计', ecommerce: '电商',
  engineering: '工程制造', media: '新媒体', education: '教育',
  finance: '金融', medical: '医疗', other: '其他',
};

const educationLabels: Record<string, string> = {
  primary: '小学', junior: '初中', senior: '高中',
  undergraduate: '大学本科', postgraduate: '硕士研究生', doctoral: '博士研究生',
};

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [achieveStats, setAchieveStats] = useState<any>({});
  const [opcStats, setOpcStats] = useState<any>({});

  useEffect(() => {
    adminAPI.getDashboard().then((res: any) => {
      if (res.code === 0) setStats(res.data);
    }).catch(() => {});
    achievementAPI.getStats().then((res: any) => {
      if (res.code === 0) setAchieveStats(res.data);
    }).catch(() => {});
    adminOPCAPI.getOpcStats().then((res: any) => {
      if (res.code === 0) setOpcStats(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>平台数据看板</h2>

      <h3 style={{ marginBottom: 12, color: '#666' }}>核心指标</h3>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="入驻机构" value={stats.institutionCount || 0} prefix={<BankOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="营期总数" value={stats.campCount || 0} prefix={<ProjectOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="用户总数" value={stats.userCount || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="总营收" value={stats.totalRevenue || 0} prefix={<DollarOutlined />} precision={2} suffix="元" /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Card><Statistic title="已支付订单" value={stats.orderCount || 0} prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="进行中营期" value={stats.activeCamps || 0} prefix={<ProjectOutlined />} /></Card></Col>
      </Row>

      <h3 style={{ marginTop: 24, marginBottom: 12, color: '#666' }}>OPC校企对接</h3>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="合作企业" value={opcStats.enterpriseCount || 0} prefix={<BankOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="企业需求" value={opcStats.demandCount || 0} prefix={<ProjectOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="进行中项目" value={opcStats.activeDemands || 0} prefix={<ExperimentOutlined />} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成项目" value={opcStats.completedDemands || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Card><Statistic title="跨学段协作任务" value={opcStats.crossLevelCount || 0} prefix={<SwapOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="导师数量" value={opcStats.mentorCount || 0} prefix={<TeamOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="实习岗位" value={opcStats.internshipCount || 0} prefix={<SendOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="实习申请" value={opcStats.applicationCount || 0} prefix={<SendOutlined />} /></Card></Col>
      </Row>

      <h3 style={{ marginTop: 24, marginBottom: 12, color: '#666' }}>成果与竞赛</h3>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="成果总数" value={achieveStats.totalCount || 0} prefix={<TrophyOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="已通过成果" value={achieveStats.approvedCount || 0} prefix={<ExperimentOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="已商业化" value={achieveStats.commercializedCount || 0} prefix={<DollarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="专利数" value={achieveStats.patentCount || 0} prefix={<TrophyOutlined />} /></Card></Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Card><Statistic title="成果商业价值" value={achieveStats.totalValue || 0} prefix={<DollarOutlined />} precision={2} suffix="元" /></Card></Col>
        <Col span={6}><Card><Statistic title="竞赛/专利申报" value={opcStats.competitionCount || 0} prefix={<TrophyOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="已获奖" value={opcStats.competitionAwarded || 0} prefix={<TrophyOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <h3 style={{ marginTop: 24, marginBottom: 12, color: '#666' }}>
        <PieChartOutlined /> 数据分布
      </h3>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="需求类别分布" size="small">
            <Table
              dataSource={(opcStats.demandByCategory || []).map((d: any, i: number) => ({ ...d, key: i }))}
              columns={[
                { title: '类别', dataIndex: 'category', key: 'cat', render: (v: string) => <Tag>{categoryLabels[v] || v}</Tag> },
                { title: '数量', dataIndex: 'cnt', key: 'cnt' },
              ]}
              size="small" pagination={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="学段用户分布" size="small">
            <Table
              dataSource={(opcStats.usersByEducationLevel || []).map((d: any, i: number) => ({ ...d, key: i }))}
              columns={[
                { title: '学段', dataIndex: 'education_level', key: 'level', render: (v: string) => <Tag color="blue">{educationLabels[v] || v}</Tag> },
                { title: '人数', dataIndex: 'cnt', key: 'cnt' },
              ]}
              size="small" pagination={false}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="企业行业分布" size="small">
            <Table
              dataSource={(opcStats.enterpriseByIndustry || []).map((d: any, i: number) => ({ ...d, key: i }))}
              columns={[
                { title: '行业', dataIndex: 'industry', key: 'ind', render: (v: string) => <Tag color="green">{industryLabels[v] || v}</Tag> },
                { title: '数量', dataIndex: 'cnt', key: 'cnt' },
              ]}
              size="small" pagination={false}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="需求月度趋势" size="small">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(opcStats.demandByMonth || []).map((d: any) => (
                <Card key={d.month} size="small" style={{ width: 100, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#999' }}>{d.month}</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1677ff' }}>{d.cnt}</div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}