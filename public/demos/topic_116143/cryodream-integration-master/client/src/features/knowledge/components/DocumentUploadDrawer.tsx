import { useState } from 'react'
import { Upload, FileText, Link, Loader2, Link2, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ingestionApi, type IngestionMode } from '../api/knowledge-api'
import { toast } from 'sonner'

interface DocumentUploadDrawerProps {
  open: boolean
  onClose: () => void
  kbId: string
  kbName?: string
  onSuccess?: () => void
}

export default function DocumentUploadDrawer({ open, onClose, kbId, kbName, onSuccess }: DocumentUploadDrawerProps) {
  const [title, setTitle] = useState('')
  const [fileType, setFileType] = useState('txt')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<'text' | 'file' | 'video' | 'url' | 'douyin'>('text')
  const [url, setUrl] = useState('')
  const [ingestionMode, setIngestionMode] = useState<IngestionMode>('none')
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, acceptMedia = false) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt'
      setFileType(ext)
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ''))
      }
      if (!acceptMedia && (ext === 'txt' || ext === 'md' || ext === 'markdown')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setContent(event.target.result as string)
          }
        }
        reader.readAsText(file)
      } else {
        setContent('')
      }
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setFileName('')
    setSelectedFile(null)
    setFileType('txt')
    setUrl('')
    setIngestionMode('none')
  }

  const uploadDocument = async () => {
    if (uploadMode === 'url') {
      if (!url.trim()) { toast.error('请输入网页链接'); throw new Error('请输入网页链接') }
      return ingestionApi.ingestUrl({ kbId, url: url.trim(), title: title.trim() || undefined, ingestionMode })
    }
    if (uploadMode === 'douyin') {
      if (!url.trim()) { toast.error('请输入抖音链接或分享文本'); throw new Error('请输入抖音链接或分享文本') }
      return ingestionApi.ingestDouyinAsync({ kbId, url: url.trim(), title: title.trim() || undefined, ingestionMode })
    }
    if (!title.trim()) { toast.error('请输入文档标题'); throw new Error('请输入文档标题') }
    if (uploadMode === 'video') {
      if (!selectedFile) { toast.error('请选择文件'); throw new Error('请选择文件') }
      return ingestionApi.uploadDocumentFileAsync({ kbId, title, file: selectedFile, ingestionMode })
    }
    if (uploadMode === 'file') {
      if (!selectedFile) { toast.error('请选择文件'); throw new Error('请选择文件') }
      return ingestionApi.uploadDocumentFile({ kbId, title, file: selectedFile, ingestionMode })
    }
    if (!content.trim()) { toast.error('请输入文档内容'); throw new Error('请输入文档内容') }
    return ingestionApi.ingestDocument({ kbId, title, content, fileType, ingestionMode })
  }

  const handleUploadOnly = async () => {
    setUploading(true)
    try {
      await uploadDocument()
      const successMsg = uploadMode === 'video'
        ? '视频转录任务已提交，后台执行中；完成后可在任务中心查看结果'
        : uploadMode === 'douyin'
          ? '抖音解析任务已提交，后台执行中；完成后可在任务中心查看结果'
          : uploadMode === 'url'
            ? '网页解析成功，请确认内容后手动入库'
            : '文档上传并解析成功，请确认内容后手动入库'
      toast.success(successMsg)
      resetForm()
      onSuccess?.()
      onClose()
    } catch (error) {
      if (error instanceof Error && !['请输入文档标题', '请选择文件', '请输入文档内容', '请输入网页链接', '请输入抖音链接或分享文本'].includes(error.message)) {
        const prefix = uploadMode === 'video' ? '视频转录失败' : uploadMode === 'douyin' ? '抖音解析失败' : uploadMode === 'url' ? '网页解析失败' : '上传失败'
        toast.error(`${prefix}：${error.message}`)
      }
    } finally {
      setUploading(false)
    }
  }

  const isWorking = uploading

  const getUploadButtonText = () => {
    if (uploading) {
      if (uploadMode === 'video') return '提交视频转录任务中...'
      if (uploadMode === 'douyin') return '提交抖音解析任务中...'
      if (uploadMode === 'url') return '解析网页中...'
      return '上传解析中...'
    }
    if (uploadMode === 'video') return '提交转录任务'
    if (uploadMode === 'douyin') return '提交抖音任务'
    if (uploadMode === 'url') return '解析网页'
    return '上传并解析'
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isWorking && onClose()}>
      <DialogContent className='w-[min(96vw,72rem)] max-w-none max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden'>
        <DialogHeader className='shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            上传并解析文档
          </DialogTitle>
          <DialogDescription>
            {kbName ? `知识库: ${kbName}` : ''} | 支持 .txt / .md / .pdf / 视频 / 音频 / 网页链接 / 抖音链接
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 py-4 overflow-y-auto flex-1 min-h-0'>
          <div className='grid grid-cols-2 gap-2 md:grid-cols-5'>
            <Button
              variant={uploadMode === 'text' ? 'default' : 'outline'}
              onClick={() => setUploadMode('text')}
              className='min-w-0'
              size="sm"
              disabled={isWorking}
            >
              <FileText className='mr-2 h-4 w-4' />
              文本输入
            </Button>
            <Button
              variant={uploadMode === 'file' ? 'default' : 'outline'}
              onClick={() => setUploadMode('file')}
              className='min-w-0'
              size="sm"
              disabled={isWorking}
            >
              <Upload className='mr-2 h-4 w-4' />
              文件上传
            </Button>
            <Button
              variant={uploadMode === 'video' ? 'default' : 'outline'}
              onClick={() => setUploadMode('video')}
              className='min-w-0'
              size="sm"
              disabled={isWorking}
            >
              <Video className='mr-2 h-4 w-4' />
              视频/音频
            </Button>
            <Button
              variant={uploadMode === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMode('url')}
              className='min-w-0'
              size="sm"
              disabled={isWorking}
            >
              <Link2 className='mr-2 h-4 w-4' />
              网页链接
            </Button>
            <Button
              variant={uploadMode === 'douyin' ? 'default' : 'outline'}
              onClick={() => setUploadMode('douyin')}
              className='min-w-0'
              size="sm"
              disabled={isWorking}
            >
              <Link className='mr-2 h-4 w-4' />
              抖音入库
            </Button>
          </div>

          <div>
            <label className='text-sm font-medium mb-1 block'>
              文档标题{uploadMode === 'url' ? '（可选，留空则使用网页标题）' : uploadMode === 'douyin' ? '（可选，留空则使用抖音视频标题）' : ''}
            </label>
            <Input
              type='text'
              placeholder={uploadMode === 'url' ? '可留空，自动使用网页标题' : uploadMode === 'douyin' ? '可留空，自动使用抖音视频标题' : '请输入文档标题'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isWorking}
            />
          </div>

          <div>
            <label className='text-sm font-medium mb-1 block'>入库模式</label>
            <Select value={ingestionMode} onValueChange={(value) => setIngestionMode(value as IngestionMode)} disabled={isWorking}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>不入库（仅解析）</SelectItem>
                <SelectItem value='auto'>自动分流</SelectItem>
                <SelectItem value='standard'>普通 RAG</SelectItem>
                <SelectItem value='deep'>认知级 RAG</SelectItem>
                <SelectItem value='event'>事件入库</SelectItem>
                <SelectItem value='case'>案例入库</SelectItem>
                <SelectItem value='thinking-model'>思维模型</SelectItem>
              </SelectContent>
            </Select>
            <p className='mt-1 text-xs text-muted-foreground'>
              {ingestionMode === 'none'
                ? uploadMode === 'video'
                  ? '仅转录为 Markdown 保存原文，不进行分块和向量化；之后可在详情页随时手动入库。'
                  : '仅解析保存原文，不进行分块和向量化（不走 RAG）；之后可在详情页随时手动入库。'
                : '解析后在详情页手动触发入库；自动分流会根据文档类型、长度和语义信号选择普通或认知级入库。'}
            </p>
          </div>

          {uploadMode !== 'url' && uploadMode !== 'douyin' && uploadMode !== 'video' && (
            <div>
              <label className='text-sm font-medium mb-1 block'>文件类型</label>
              <Select value={fileType} onValueChange={setFileType} disabled={isWorking}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='txt'>TXT</SelectItem>
                  <SelectItem value='md'>Markdown</SelectItem>
                  <SelectItem value='pdf'>PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {uploadMode === 'url' || uploadMode === 'douyin' ? (
            <div>
              <label className='text-sm font-medium mb-1 block'>{uploadMode === 'douyin' ? '抖音链接/分享文本' : '网页链接'}</label>
              <Input
                type={uploadMode === 'douyin' ? 'text' : 'url'}
                placeholder={uploadMode === 'douyin' ? '粘贴抖音分享链接或完整分享文本' : 'https://example.com/article'}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isWorking}
              />
              <p className='mt-1 text-xs text-muted-foreground'>
                {uploadMode === 'douyin'
                  ? '将提交后台抖音解析任务，使用 Cookie 管理中配置的抖音 Cookie 获取视频信息，下载到本地媒体库后复用视频转录工作流。'
                  : '自动多方案抓取正文（本地解析 → Jina Reader → Scrapling 反爬服务逐级降级），支持公众号、知乎等动态页面。'}
              </p>
            </div>
          ) : uploadMode === 'video' ? (
            <div>
              <label className='text-sm font-medium mb-1 block'>选择视频/音频文件</label>
              <div className='border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition'>
                <input
                  type='file'
                  accept='video/*,audio/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm,.m4v,.wav,.mp3,.flac,.aac,.ogg,.m4a'
                  onChange={(e) => handleFileChange(e, true)}
                  className='hidden'
                  id='video-upload'
                />
                <label htmlFor='video-upload' className='cursor-pointer'>
                  <Video className='h-10 w-10 mx-auto text-gray-400 mb-2' />
                  <p className='text-sm text-gray-600'>
                    {fileName ? fileName : '点击选择视频或音频文件'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>
                    支持 mp4/mkv/avi/mov/wav/mp3 等格式，提交后台任务后由 FFmpeg Whisper 本地转录为 Markdown
                  </p>
                  {selectedFile && (
                    <p className='text-xs text-blue-500 mt-1'>
                      文件大小: {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </label>
              </div>
            </div>
          ) : uploadMode === 'file' ? (
            <div>
              <label className='text-sm font-medium mb-1 block'>选择文件</label>
              <div className='border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition'>
                <input
                  type='file'
                  accept='.txt,.md,.markdown,.pdf'
                  onChange={(e) => handleFileChange(e)}
                  className='hidden'
                  id='file-upload'
                />
                <label htmlFor='file-upload' className='cursor-pointer'>
                  <Upload className='h-10 w-10 mx-auto text-gray-400 mb-2' />
                  <p className='text-sm text-gray-600'>
                    {fileName ? fileName : '点击选择文件'}
                  </p>
                  <p className='text-xs text-gray-400 mt-1'>支持 .txt / .md / .pdf，后端会统一转为 Markdown</p>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className='text-sm font-medium mb-1 block'>文档内容</label>
              <Textarea
                placeholder='请输入或粘贴文档内容...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className='max-h-[40vh] resize-y'
                disabled={isWorking}
              />
              <p className='text-xs text-muted-foreground mt-1'>
                已输入 {content.length} 个字符
              </p>
            </div>
          )}
        </div>

        <DialogFooter className='shrink-0 border-t pt-4 gap-2'>
          <Button variant='outline' onClick={onClose} disabled={isWorking}>
            取消
          </Button>
          <Button onClick={handleUploadOnly} disabled={isWorking}>
            {uploading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                {getUploadButtonText()}
              </>
            ) : (
              getUploadButtonText()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
