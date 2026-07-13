/** 与后端对应的前端类型定义。 */

export type AssetType = 'character' | 'scene' | 'prop'
export type AssetStatus = 'pending' | 'generating' | 'done' | 'failed' | 'user_edited'

export interface Asset {
  id: string
  type: AssetType
  name: string
  description: string
  prompt: string
  image_path: string | null
  status: AssetStatus
}

export interface Storyboard {
  id: string
  index: number
  prompt: string
  image_path: string | null
  /** Agnes 返回的公网 URL，供视频生成图生视频使用 */
  image_url: string | null
  status: AssetStatus
  prev_storyboard_id: string | null
  character_ref_ids: string[]
  scene_ref_ids: string[]
  prop_ref_ids: string[]
  director_stage_ref_ids: string[]
}

/** 视频生成记录：每个故事板对应一个图生视频任务 */
export interface Video {
  id: string
  storyboard_id: string
  prompt: string
  status: AssetStatus
  progress: number
  video_path: string | null
  video_url: string | null
  error: string | null
  num_frames: number
  frame_rate: number
  width: number
  height: number
  seconds: string | null
  created_at: string
}

export interface Episode {
  id: string
  index: number
  title: string
  plot_summary: string
  duration_seconds: number
  status: AssetStatus
  involved_character_names?: string[]
  involved_scene_names?: string[]
  involved_prop_names?: string[]
  storyboards: Storyboard[]
}

export interface ProjectDetail {
  id: string
  name: string
  status: string
  script_text: string | null
  canvas_state: { nodes: any[]; edges: any[] } | null
  created_at: string
  characters: Asset[]
  scenes: Asset[]
  props: Asset[]
  episodes: Episode[]
  director_stages: DirectorStage[]
  videos: Video[]
}

export interface DirectorStage {
  id: string
  project_id: string
  name: string
  scene_data: DirectorStageSceneData
  screenshots: DirectorStageScreenshot[]
  status: AssetStatus
  created_at: string
  updated_at: string
}

export interface DirectorStageGroup {
  id: string
  name: string
  memberIds: string[]
}

export interface DirectorStageSceneData {
  background: { color: string; showGrid: boolean }
  environment: { ambientIntensity: number }
  elements: DirectorStageElement[]
  cameras: DirectorStageCamera[]
  /** 命名选择集：编组/解组。旧数据无此字段时默认空数组兼容。 */
  groups?: DirectorStageGroup[]
}

export type DirectorStageElementType = 'geometry' | 'ai_object' | 'ai_scene' | 'army'

/** 士兵方阵配置：只存参数，位置渲染期计算，避免 scene_data 膨胀 */
export interface ArmyConfig {
  rows: number           // 单方阵行数
  cols: number           // 单方阵列数
  formations: number     // 方阵个数
  spacing: number         // 士兵间距（米）
  formationGap: number   // 方阵间距（=20 表示 20*spacing 米，满足"间隔20个士兵距离"）
  pose: string           // standing/dancing/arms_up/...（复用 POSES 键）
  isWoman: boolean
  colors: { skin: string; hair: string; jacket: string; shirt: string; pants: string; shoes: string }
}

export interface DirectorStageElement {
  id: string
  type: DirectorStageElementType
  name: string
  color: string
  geometry?: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane'
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  visible: boolean
  locked: boolean
  /** AI 生成的单个程序化物体（仅 type === 'ai_object' 时有效） */
  mesh?: SceneMesh
  /** AI 生成的原始 prompt（记录该物体由哪句自然语言生成） */
  prompt?: string
  /** 遗留 ai_scene 的结构化描述（仅 type === 'ai_scene' 时有效，新数据不再使用） */
  sceneDescription?: SceneDescription
  /** 士兵方阵配置（仅 type === 'army' 时有效） */
  army?: ArmyConfig
}

export interface DirectorStageCamera {
  id: string
  name: string
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  aspect: '16:9' | '9:16' | '4:3' | '1:1'
}

export interface DirectorStageScreenshot {
  id: string
  camera_id: string
  filename: string
  image_path: string
  created_at: string
}

export interface ProjectListItem {
  id: string
  name: string
  status: string
  created_at: string
  pinned: boolean
}

/** WebSocket 事件类型 */
export interface WsEvent {
  event: string
  [key: string]: any
}

/** 自由节点（文本 / 图片 / 视频） */
export interface FreeNodeData {
  id: string
  contentType: 'text' | 'image' | 'video'
  title: string
  content?: string
  src?: string | null
  status: AssetStatus
  appearIndex: number
}

/** AI 场景 mesh：单个程序化几何体描述 */
export interface SceneMesh {
  type: 'mountain' | 'lake' | 'waterfall' | 'rock' | 'tree' | 'ground' | 'cloud' | 'river' | 'house' | 'platform' | 'man' | 'woman' | 'table' | 'chair'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale: [number, number, number]
  color: string
  /** 仅 man/woman 有效：人物动作描述（英文短语），驱动程序化骨骼摆姿势 */
  action?: string
}

/** AI 场景结构化描述（DeepSeek 解析一句话后输出） */
export interface SceneDescription {
  sceneName: string
  background?: string
  meshes: SceneMesh[]
  suggestedCamera?: {
    position: [number, number, number]
    target: [number, number, number]
  }
}

/** 资产库条目 */
export interface LibraryItem {
  id: string
  project_id: string
  project_name: string
  type: string
  asset_type?: string
  title: string
  content?: string
  image_path?: string
  prompt?: string
  date: string
  created_at: string | null
}

/** 资产库分类数据 { date: [items] } */
export type LibraryCategory = Record<string, LibraryItem[]>

export interface LibraryData {
  text: LibraryCategory
  image: LibraryCategory
  video: LibraryCategory
}
