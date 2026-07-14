import { useState, useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

export default function Group() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [myRole, setMyRole] = useState('');
  const scrollRef = useRef<any>(null);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const cid = params?.campId ? Number(params.campId) : null;
    if (cid) loadWorkspace(cid);
  }, []);

  const loadWorkspace = async (cid: number) => {
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) {
        const ws = res.data.workspace || res.data;
        setWorkspaceId(ws.id);
        if (res.data.group) {
          setGroupId(res.data.group.id);
          setGroupName(res.data.group.name);
          setMyRole(res.data.group.role);
          loadMessages(res.data.group.id);
        }
      }
    } catch { /* ignore */ }
  };

  const loadMessages = async (gid: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getGroupMessages(gid);
      if (res.code === 0) setMessages(res.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!groupId || !inputText.trim()) return;
    try {
      await pblAPI.sendGroupMessage(groupId, { content: inputText });
      setInputText('');
      loadMessages(groupId);
    } catch { Taro.showToast({ title: '发送失败', icon: 'none' }); }
  };

  const roleLabels: Record<string, string> = {
    manager: '组长', executor: '执行者', qa: '质检员', promoter: '推广员',
  };

  return (
    <View className="container">
      {/* 小组头部 */}
      <View className="group-header">
        <Text className="group-name">{groupName || '小组协作'}</Text>
        {myRole && <Text className="group-role">我的角色：{roleLabels[myRole] || myRole}</Text>}
      </View>

      {/* 消息列表 */}
      <ScrollView className="message-list" scrollY scrollWithAnimation>
        {loading ? (
          <View className="loading">加载中...</View>
        ) : messages.length === 0 ? (
          <View className="empty-chat">
            <Text className="empty-chat-text">还没有消息</Text>
            <Text className="empty-chat-hint">开始和你的小组成员交流吧</Text>
          </View>
        ) : (
          messages.map((msg: any) => (
            <View key={msg.id} className={`message-item ${msg.message_type === 'system' ? 'system' : ''}`}>
              {msg.message_type === 'system' ? (
                <Text className="system-msg">{msg.content}</Text>
              ) : (
                <View className="msg-bubble">
                  <Text className="msg-sender">{msg.sender_name}</Text>
                  <Text className="msg-content">{msg.content}</Text>
                  <Text className="msg-time">{msg.created_at}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* 输入框 */}
      <View className="chat-input-area">
        <Input className="chat-input" value={inputText}
          onInput={(e) => setInputText((e as any).detail.value)}
          placeholder="输入消息..."
          confirmType="send"
          onConfirm={handleSend} />
        <View className="send-btn" onClick={handleSend}>
          <Text className="send-btn-text">发送</Text>
        </View>
      </View>
    </View>
  );
}