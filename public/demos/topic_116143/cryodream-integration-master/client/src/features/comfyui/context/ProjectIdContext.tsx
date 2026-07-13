import { createContext, useContext, type ReactNode } from 'react'

/**
 * 当前画布的 projectId 上下文。
 * 让画布内所有子组件（AdvancedParams、ImageField、VideoField、ImageEditPanel 等）
 * 无需 props 逐层传递，直接 useProjectId() 就能拿到。
 * 上传接口会把文件落到 <workspace>/canvas/<projectId>/，实现"一个画布一个目录"。
 */
const ProjectIdContext = createContext<string | undefined>(undefined)

export function ProjectIdProvider({
  projectId,
  children,
}: {
  projectId: string | undefined
  children: ReactNode
}) {
  return (
    <ProjectIdContext.Provider value={projectId}>
      {children}
    </ProjectIdContext.Provider>
  )
}

/** 读取当前画布的 projectId（可能为 undefined，例如在非画布场景下使用） */
export function useProjectId(): string | undefined {
  return useContext(ProjectIdContext)
}
