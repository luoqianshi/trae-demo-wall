import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState } from 'react';

interface FileItem {
  url: string;
  name: string;
  size?: number;
  type: 'image' | 'file';
}

interface FileUploaderProps {
  files: FileItem[];
  onChange: (files: FileItem[]) => void;
  maxCount?: number;
}

export default function FileUploader({ files, onChange, maxCount = 9 }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleChooseImage = async () => {
    if (files.length >= maxCount) {
      Taro.showToast({ title: `最多上传${maxCount}个文件`, icon: 'none' });
      return;
    }
    try {
      const res = await Taro.chooseImage({
        count: maxCount - files.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      });
      setUploading(true);
      const newFiles: FileItem[] = [...files];
      for (const path of res.tempFilePaths) {
        const fileName = path.substring(path.lastIndexOf('/') + 1);
        try {
          const uploadRes = await Taro.uploadFile({
            url: 'http://localhost:3000/api/upload',
            filePath: path,
            name: 'file',
            header: { 'Authorization': `Bearer ${Taro.getStorageSync('token') || ''}` },
          });
          const data = JSON.parse(uploadRes.data);
          if (data.code === 0) {
            newFiles.push({ url: data.data.url, name: fileName, type: 'image' });
          }
        } catch {
          // 上传失败，使用本地路径
          newFiles.push({ url: path, name: fileName, type: 'image' });
        }
      }
      onChange(newFiles);
    } catch (err: any) {
      if (err.errMsg?.includes('cancel')) return;
      Taro.showToast({ title: '选择图片失败', icon: 'none' });
    }
    setUploading(false);
  };

  const handleChooseFile = async () => {
    if (files.length >= maxCount) {
      Taro.showToast({ title: `最多上传${maxCount}个文件`, icon: 'none' });
      return;
    }
    try {
      const res = await Taro.chooseMessageFile({
        count: maxCount - files.length,
        type: 'all',
      });
      setUploading(true);
      const newFiles: FileItem[] = [...files];
      for (const file of res.tempFiles) {
        try {
          const uploadRes = await Taro.uploadFile({
            url: 'http://localhost:3000/api/upload',
            filePath: file.path,
            name: 'file',
            header: { 'Authorization': `Bearer ${Taro.getStorageSync('token') || ''}` },
          });
          const data = JSON.parse(uploadRes.data);
          if (data.code === 0) {
            newFiles.push({ url: data.data.url, name: file.name, size: file.size, type: 'file' });
          }
        } catch {
          newFiles.push({ url: file.path, name: file.name, size: file.size, type: 'file' });
        }
      }
      onChange(newFiles);
    } catch (err: any) {
      if (err.errMsg?.includes('cancel')) return;
      Taro.showToast({ title: '选择文件失败', icon: 'none' });
    }
    setUploading(false);
  };

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const handlePreview = (file: FileItem) => {
    if (file.type === 'image') {
      const urls = files.filter(f => f.type === 'image').map(f => f.url);
      Taro.previewImage({ current: file.url, urls });
    }
  };

  return (
    <View>
      {/* 文件列表 */}
      {files.length > 0 && (
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '16rpx', marginBottom: '16rpx' }}>
          {files.map((file, index) => (
            <View key={index} style={{ position: 'relative', width: '160rpx', height: '160rpx' }}>
              {file.type === 'image' ? (
                <Image
                  src={file.url}
                  style={{ width: '160rpx', height: '160rpx', borderRadius: '12rpx' }}
                  mode="aspectFill"
                  onClick={() => handlePreview(file)}
                />
              ) : (
                <View onClick={() => handlePreview(file)} style={{
                  width: '160rpx', height: '160rpx', borderRadius: '12rpx',
                  backgroundColor: '#f5f5f5', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: '40rpx' }}>📄</Text>
                  <Text style={{ fontSize: '18rpx', color: '#8c8c8c', marginTop: '8rpx',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    width: '140rpx', textAlign: 'center',
                  }}>
                    {file.name}
                  </Text>
                </View>
              )}
              {/* 删除按钮 */}
              <View onClick={() => handleRemove(index)} style={{
                position: 'absolute', top: '-8rpx', right: '-8rpx',
                width: '36rpx', height: '36rpx', borderRadius: '50%',
                backgroundColor: '#ff4d4f', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: '22rpx', lineHeight: 1 }}>✕</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 上传按钮 */}
      {files.length < maxCount && (
        <View style={{ display: 'flex', gap: '16rpx' }}>
          <View onClick={handleChooseImage} style={{
            width: '160rpx', height: '160rpx', borderRadius: '12rpx',
            border: '2rpx dashed #d9d9d9', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#fafafa',
          }}>
            <Text style={{ fontSize: '40rpx', marginBottom: '8rpx' }}>📷</Text>
            <Text style={{ fontSize: '20rpx', color: '#8c8c8c' }}>图片</Text>
          </View>
          <View onClick={handleChooseFile} style={{
            width: '160rpx', height: '160rpx', borderRadius: '12rpx',
            border: '2rpx dashed #d9d9d9', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#fafafa',
          }}>
            <Text style={{ fontSize: '40rpx', marginBottom: '8rpx' }}>📁</Text>
            <Text style={{ fontSize: '20rpx', color: '#8c8c8c' }}>文件</Text>
          </View>
        </View>
      )}

      {uploading && (
        <Text style={{ display: 'block', marginTop: '12rpx', fontSize: '22rpx', color: '#1677ff' }}>
          上传中...
        </Text>
      )}
    </View>
  );
}