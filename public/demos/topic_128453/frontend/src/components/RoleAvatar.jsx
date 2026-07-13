// 角色圆形头像：墨色底白色字，带装饰外环

export default function RoleAvatar({ avatar, name, size = 'md', active = false, onClick }) {
  const sizes = {
    sm: 'w-9 h-9 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-20 h-20 text-3xl',
  }

  return (
    <div className="relative flex-shrink-0">
      {/* 外层装饰环 */}
      {active && (
        <div
          className="absolute inset-0 rounded-full animate-pulse-soft"
          style={{
            boxShadow: '0 0 0 3px rgba(197, 61, 67, 0.15)',
          }}
        />
      )}
      <button
        onClick={onClick}
        disabled={!onClick}
        className={`${sizes[size]} rounded-full flex items-center justify-center font-serif-cn font-bold transition-all duration-300 relative ${
          onClick ? 'cursor-pointer hover:scale-105' : 'cursor-default'
        }`}
        style={{
          backgroundColor: active ? '#C53D43' : '#2C2C2C',
          color: '#FFFCF7',
          boxShadow: active
            ? '0 4px 16px rgba(197, 61, 67, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
            : '0 2px 8px rgba(44, 44, 44, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        title={name}
      >
        {avatar}
      </button>
    </div>
  )
}
