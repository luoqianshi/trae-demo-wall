// 角色选择器：横向滚动，高亮当前角色
import RoleAvatar from './RoleAvatar'

export default function RoleSelector({ roles, currentRoleId, onSelect, size = 'md', showName = true }) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 -mx-1 px-1">
      {roles.map((role) => {
        const isActive = role.id === currentRoleId
        return (
          <div key={role.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <RoleAvatar
              avatar={role.avatar}
              name={role.name}
              size={size}
              active={isActive}
              onClick={() => onSelect(role.id)}
            />
            {showName && (
              <span
                className={`text-xs whitespace-nowrap transition-colors ${
                  isActive ? 'text-ink-accent font-medium' : 'text-ink-muted'
                }`}
              >
                {role.name}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
