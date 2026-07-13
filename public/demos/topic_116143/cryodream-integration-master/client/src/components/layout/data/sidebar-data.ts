import {
  LayoutDashboard,
  ListTodo,
  MessagesSquare,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  FolderKanban,
  BrainCog,
  Library,
  FlaskConical,
  Workflow,
  Brain,
  Globe,
  Video,
  SearchCheck,
  FileSearch,
  Palette,
  BookImage,
  FileText,
  Tags,
  Music2,
  BookOpenText,
  Link,
  Cookie,
  Settings2,
  Wrench,
  Zap,
  Briefcase,
  MessageSquare,
  NotebookPen,
  BookHeart,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'User Name',
    email: 'user@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
  navGroups: [
    {
      title: 'common.general',
      items: [
        {
          title: 'common.dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'common.tasks',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: 'common.agents',
          url: '/agents',
          icon: BrainCog,
        },
        {
          title: 'common.chats',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: '项目空间',
          url: '/projects',
          icon: FolderKanban,
        },
        {
          title: '知识库',
          url: '/knowledge-base',
          icon: Library,
        },
        {
          title: '工具',
          url: '/tools',
          icon: Wrench,
        },
        {
          title: '文档',
          url: '/documents',
          icon: FileText,
        },
        {
          title: '检索测试',
          url: '/retrieval-test',
          icon: SearchCheck,
        },
        {
          title: '情报研判',
          url: '/intelligence-analysis',
          icon: FileSearch,
        },
        {
          title: '日记',
          url: '/diaries',
          icon: NotebookPen,
        },
      ],
    },
    {
      title: 'AI创作',
      items: [
        {
          title: 'AI音乐',
          url: '/ai-music',
          icon: Music2,
        },
        {
          title: '小说创作',
          url: '/novels',
          icon: BookOpenText,
        },
      ],
    },
    {
      title: 'common.settings',
      items: [
        {
          title: 'common.general',
          url: '/settings/general',
          icon: Settings2,
        },
        {
          title: '模型设置',
          url: '/model-settings',
          icon: BrainCog,
        },
        {
          title: 'Cookie 管理',
          url: '/cookie-settings',
          icon: Cookie,
        },
        {
          title: '标签管理',
          url: '/tags',
          icon: Tags,
        },
        {
          title: '测试 DEMO',
          url: '/test-demo',
          icon: FlaskConical,
        },
        {
          title: '默认工作流',
          icon: Workflow,
          items: [
            {
              title: '普通 RAG 入库',
              url: '/system-workflows/standard-rag',
              icon: Brain,
            },
            {
              title: '自动分级入库',
              url: '/system-workflows/tiered-rag',
              icon: Brain,
            },
            {
              title: '事件入库',
              url: '/system-workflows/event-ingestion',
              icon: Zap,
            },
            {
              title: '案例入库',
              url: '/system-workflows/case-ingestion',
              icon: Briefcase,
            },
            {
              title: '观点入库',
              url: '/system-workflows/opinion-ingestion',
              icon: MessageSquare,
            },
            {
              title: '网页解析入库',
              url: '/system-workflows/web-parse',
              icon: Globe,
            },
            {
              title: '文件解析入库',
              url: '/system-workflows/file-parse',
              icon: FileText,
            },
            {
              title: '视频转录入库',
              url: '/system-workflows/video-parse',
              icon: Video,
            },
            {
              title: '抖音链接入库',
              url: '/system-workflows/douyin-parse',
              icon: Link,
            },
            {
              title: '思维模型入库',
              url: '/system-workflows/thinking-model',
              icon: Wrench,
            },
            {
              title: '日记 AI 分析',
              url: '/system-workflows/diary-analysis',
              icon: BookHeart,
            },
          ],
        },
      ],
    },
    {
      title: 'common.canvas',
      items: [
        {
          title: 'common.canvasComfyui',
          url: '/canvas/comfyui',
          icon: Palette,
        },
        {
          title: 'common.canvasComic',
          url: '/canvas/comic',
          icon: BookImage,
        },
        {
          title: 'common.workflowTest',
          url: '/canvas/workflow-test',
          icon: FlaskConical,
        },
      ],
    },
  ],
}
