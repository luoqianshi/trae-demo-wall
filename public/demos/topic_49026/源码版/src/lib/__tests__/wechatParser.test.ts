import { describe, it, expect } from 'vitest'
import { parseWeChatTxt, parseWeChatFile } from '../wechatParser'

const SAMPLE_TXT = `微信聊天记录
====================
聊天对象：张三
====================

2024-05-01 09:00:00 我
早上好，今天天气不错

2024-05-01 09:01:00 张三
早啊
这是续行的第二行

2024-05-01 09:02:00 我
嗯嗯
`

describe('parseWeChatTxt', () => {
  it('解析聊天对象', () => {
    const chats = parseWeChatTxt(SAMPLE_TXT)
    expect(chats).toHaveLength(1)
    expect(chats[0].contactName).toBe('张三')
  })

  it('解析多条消息', () => {
    const chats = parseWeChatTxt(SAMPLE_TXT)
    expect(chats[0].messages).toHaveLength(3)

    const [first, second, third] = chats[0].messages
    expect(first.content).toBe('早上好，今天天气不错')
    expect(second.content).toBe('早啊\n这是续行的第二行')
    expect(third.content).toBe('嗯嗯')
  })

  it('验证发送者身份', () => {
    const chats = parseWeChatTxt(SAMPLE_TXT)
    const [first, second, third] = chats[0].messages

    expect(first.sender).toBe('我')
    expect(first.isMe).toBe(true)

    expect(second.sender).toBe('张三')
    expect(second.isMe).toBe(false)

    expect(third.sender).toBe('我')
    expect(third.isMe).toBe(true)
  })

  it('解析多个聊天对象', () => {
    const multiChatTxt = `聊天对象：张三
2024-05-01 10:00:00 我
你好

聊天对象：李四
2024-05-01 10:05:00 李四
你好啊
`
    const chats = parseWeChatTxt(multiChatTxt)
    expect(chats).toHaveLength(2)
    expect(chats[0].contactName).toBe('张三')
    expect(chats[0].messages).toHaveLength(1)
    expect(chats[1].contactName).toBe('李四')
    expect(chats[1].messages).toHaveLength(1)
  })
})

describe('parseWeChatFile', () => {
  it('从 File 对象解析聊天记录', async () => {
    const file = new File([SAMPLE_TXT], 'wechat.txt', { type: 'text/plain' })
    const result = await parseWeChatFile(file)

    expect(result.errors).toHaveLength(0)
    expect(result.totalMessages).toBe(3)
    expect(result.chats).toHaveLength(1)
    expect(result.chats[0].contactName).toBe('张三')
    expect(result.chats[0].messages[1].content).toBe('早啊\n这是续行的第二行')
  })
})
