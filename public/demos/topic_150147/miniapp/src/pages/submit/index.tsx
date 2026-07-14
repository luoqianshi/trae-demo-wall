import { useState, useEffect } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { submissionAPI } from '../../services/api';
import FileUploader from '../../components/FileUploader';

interface FileItem {
  url: string;
  name: string;
  size?: number;
  type: 'image' | 'file';
}

export default function Submit() {
  const router = useRouter();
  const { taskId, campId } = router.params;
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingSub, setExistingSub] = useState<any>(null);

  useEffect(() => {
    if (campId && taskId) loadExistingSubmission();
  }, [campId, taskId]);

  const loadExistingSubmission = async () => {
    try {
      const res: any = await submissionAPI.getMy(Number(campId));
      if (res.code === 0) {
        const sub = (res.data || []).find((s: any) => s.task_id === Number(taskId));
        if (sub) {
          setExistingSub(sub);
          setContent(sub.content || '');
          // 解析已有文件
          if (sub.file_urls && sub.file_urls !== '[]') {
            try {
              const urls = JSON.parse(sub.file_urls);
              setFiles(urls.map((url: string) => ({ url, name: url.substring(url.lastIndexOf('/') + 1), type: 'file' as const })));
            } catch {}
          }
        }
      }
    } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    if (!content.trim() && files.length === 0) {
      Taro.showToast({ title: '请输入内容或上传文件', icon: 'none' });
      return;
    }
    setSubmitting(true);
    try {
      const fileUrls = files.map(f => f.url);
      await submissionAPI.submit(Number(taskId), { content, fileUrls });
      Taro.showToast({ title: existingSub ? '修改成功' : '提交成功', icon: 'success' });
      setTimeout(() => Taro.navigateBack(), 1500);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  // 已评分状态
  if (existingSub?.status === 'reviewed') {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24rpx' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: '16rpx', padding: '32rpx' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: 600, display: 'block', marginBottom: '24rpx' }}>作品已评分</Text>
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '26rpx', color: '#8c8c8c' }}>得分：</Text>
            <Text style={{ fontSize: '48rpx', fontWeight: 700, color: '#52c41a' }}>{existingSub.score}分</Text>
          </View>
          {existingSub.feedback && (
            <View style={{ backgroundColor: '#f6ffed', padding: '20rpx', borderRadius: '12rpx', marginBottom: '16rpx' }}>
              <Text style={{ fontSize: '24rpx', color: '#8c8c8c', marginBottom: '8rpx', display: 'block' }}>教师评语：</Text>
              <Text style={{ fontSize: '26rpx', color: '#333', lineHeight: '38rpx' }}>{existingSub.feedback}</Text>
            </View>
          )}
          <View style={{ marginBottom: '16rpx' }}>
            <Text style={{ fontSize: '24rpx', color: '#8c8c8c', display: 'block', marginBottom: '8rpx' }}>我的提交内容：</Text>
            <Text style={{ fontSize: '26rpx', color: '#333', lineHeight: '38rpx', display: 'block' }}>{content || '无'}</Text>
          </View>
          {files.length > 0 && (
            <View>
              <Text style={{ fontSize: '24rpx', color: '#8c8c8c', display: 'block', marginBottom: '8rpx' }}>附件：</Text>
              <FileUploader files={files} onChange={() => {}} maxCount={0} />
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '24rpx' }}>
      <View style={{ backgroundColor: '#fff', borderRadius: '16rpx', padding: '32rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: 600, display: 'block', marginBottom: '12rpx' }}>
          {existingSub ? '修改作品' : '提交作品'}
        </Text>
        <Text style={{ color: '#8c8c8c', fontSize: '24rpx', display: 'block', marginBottom: '24rpx' }}>
          请认真完成你的PBL项目任务，提交你的调研报告、作品或思考
        </Text>

        {/* 文本内容 */}
        <Textarea
          style={{
            width: '100%', minHeight: '200rpx', border: '1rpx solid #d9d9d9',
            borderRadius: '12rpx', padding: '20rpx', fontSize: '26rpx',
            background: '#fafafa', marginBottom: '24rpx',
          }}
          placeholder="请输入你的作品内容..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
        />

        {/* 文件上传 */}
        <View style={{ marginBottom: '24rpx' }}>
          <Text style={{ fontSize: '24rpx', color: '#8c8c8c', display: 'block', marginBottom: '12rpx' }}>
            上传附件（图片/文档，可选）
          </Text>
          <FileUploader files={files} onChange={setFiles} maxCount={9} />
        </View>

        {/* 提交按钮 */}
        <Button
          style={{
            width: '100%', backgroundColor: '#1677ff', color: '#fff',
            borderRadius: '12rpx', height: '88rpx', lineHeight: '88rpx',
            fontSize: '30rpx', fontWeight: 500,
          }}
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
        >
          {existingSub ? '更新作品' : '提交作品'}
        </Button>

        {/* 提示 */}
        <Text style={{ display: 'block', marginTop: '16rpx', fontSize: '22rpx', color: '#bfbfbf', textAlign: 'center' }}>
          提交后可在作品集中查看评分和反馈
        </Text>
      </View>
    </View>
  );
}