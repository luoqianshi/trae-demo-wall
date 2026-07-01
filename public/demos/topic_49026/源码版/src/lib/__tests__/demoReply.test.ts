import { describe, it, expect } from 'vitest'
import { generateDemoReply, generateDemoProfile } from '../demoReply'

describe('generateDemoReply', () => {
  it('returns work scenario reply for leadership conflict', () => {
    const reply = generateDemoReply('王思亮周会上又当众质疑我')
    expect(reply).toContain('示例回复')
    expect(reply).toContain('记录事实')
  })
  it('returns family scenario reply', () => {
    const reply = generateDemoReply('和晓薇最近沟通越来越少')
    expect(reply).toContain('家庭关系')
  })
  it('returns health scenario reply', () => {
    const reply = generateDemoReply('体检发现血脂和血压都偏高')
    expect(reply).toContain('健康')
    expect(reply).toContain('快走')
  })
  it('returns finance scenario reply', () => {
    const reply = generateDemoReply('我想理清房贷、收入和积蓄的投资安排')
    expect(reply).toContain('财务')
    expect(reply).toContain('现金流体检')
  })
  it('returns generic reply for unknown input', () => {
    const reply = generateDemoReply('随便说说')
    expect(reply).toContain('继续补充背景')
  })
  it('mentions existing people when context says hasPeople is true', () => {
    const reply = generateDemoReply('王思亮总针对我', { hasPeople: true })
    expect(reply).toContain('已经看到你把王思亮加入了人物档案')
  })
})

describe('generateDemoProfile', () => {
  it('extracts age and role from a typical user message', () => {
    const profile = generateDemoProfile('我今年38岁，在杭州做技术总监')
    expect(profile).toContain('年龄：38岁')
    expect(profile).toContain('职业：企业中层管理者')
  })
  it('extracts name, city and family from longer message', () => {
    const profile = generateDemoProfile('我叫陈志远，38岁，在杭州做产品总监，妻子和孩子都在这边')
    expect(profile).toContain('姓名：陈志远')
    expect(profile).toContain('城市：杭州')
    expect(profile).toContain('家庭：有家人需要照顾')
  })
  it('returns fallback when no info is detected', () => {
    const profile = generateDemoProfile('你好')
    expect(profile).toContain('了解还不够多')
  })
})
