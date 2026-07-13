import { useState, useMemo } from 'react'
import { Download, Plus, MoreVertical, Edit, Trash2, Search as SearchIcon, Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'

// 示例用户数据 - 扩展到 25 条用于演示分页
const allUsers = [
  { id: 1, name: '张三', email: 'zhangsan@example.com', role: '管理员', status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang1' },
  { id: 2, name: '李四', email: 'lisi@example.com', role: '编辑', status: 'active', avatar: null },
  { id: 3, name: '王五', email: 'wangwu@example.com', role: '用户', status: 'inactive', avatar: null },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: '用户', status: 'active', avatar: null },
  { id: 5, name: '钱七', email: 'qianqi@example.com', role: '编辑', status: 'inactive', avatar: null },
  { id: 6, name: '孙八', email: 'sunba@example.com', role: '用户', status: 'active', avatar: null },
  { id: 7, name: '周九', email: 'zhoujiu@example.com', role: '管理员', status: 'active', avatar: null },
  { id: 8, name: '吴十', email: 'wushi@example.com', role: '编辑', status: 'inactive', avatar: null },
  { id: 9, name: '郑一', email: 'zhengyi@example.com', role: '用户', status: 'active', avatar: null },
  { id: 10, name: '王二', email: 'wanger@example.com', role: '用户', status: 'active', avatar: null },
  { id: 11, name: '冯三', email: 'fengsan@example.com', role: '编辑', status: 'inactive', avatar: null },
  { id: 12, name: '陈四', email: 'chensi@example.com', role: '管理员', status: 'active', avatar: null },
  { id: 13, name: '褚五', email: 'chuwu@example.com', role: '用户', status: 'active', avatar: null },
  { id: 14, name: '卫六', email: 'weiliu@example.com', role: '编辑', status: 'active', avatar: null },
  { id: 15, name: '蒋七', email: 'jiangqi@example.com', role: '用户', status: 'inactive', avatar: null },
  { id: 16, name: '沈八', email: 'shenba@example.com', role: '用户', status: 'active', avatar: null },
  { id: 17, name: '韩九', email: 'hanjiu@example.com', role: '管理员', status: 'active', avatar: null },
  { id: 18, name: '杨十', email: 'yangshi@example.com', role: '编辑', status: 'inactive', avatar: null },
  { id: 19, name: '朱一', email: 'zhuyi@example.com', role: '用户', status: 'active', avatar: null },
  { id: 20, name: '秦二', email: 'qiner@example.com', role: '用户', status: 'active', avatar: null },
  { id: 21, name: '尤三', email: 'yousan@example.com', role: '编辑', status: 'inactive', avatar: null },
  { id: 22, name: '许四', email: 'xusi@example.com', role: '管理员', status: 'active', avatar: null },
  { id: 23, name: '何五', email: 'hewu@example.com', role: '用户', status: 'active', avatar: null },
  { id: 24, name: '吕六', email: 'lvliu@example.com', role: '编辑', status: 'active', avatar: null },
  { id: 25, name: '施七', email: 'shiqi@example.com', role: '用户', status: 'inactive', avatar: null },
]

const ITEMS_PER_PAGE = 8

export default function StandardListLayout() {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 搜索、筛选和排序后的数据
  const filteredUsers = useMemo(() => {
    let result = [...allUsers]

    // 搜索筛选（姓名或邮箱）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      )
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter)
    }

    // 排序（默认按 ID 降序）
    result.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.id - b.id
      }
      return b.id - a.id
    })

    return result
  }, [searchQuery, statusFilter, sortOrder])

  // 计算分页数据
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 搜索变化时重置到第一页
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // 筛选变化时重置到第一页
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed>
        {/* 标题和按钮左右排列 */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between gap-2'>
              <div>
                <div className='flex items-center gap-2'>
                  <h1 className='text-2xl font-bold tracking-tight'>
                    标准列表布局
                  </h1>
                  <Badge variant='secondary'>Layout</Badge>
                </div>
                <p className='text-muted-foreground'>
                  任务管理、用户管理等数据表格页面的标准布局
                </p>
              </div>
              {/* 右侧主要操作按钮 */}
              <div className='flex gap-2'>
              <Button variant='outline' className='space-x-1'>
                <span>导入</span>
                <Download size={18} />
              </Button>
              <Button className='space-x-1'>
                <span>创建</span>
                <Plus size={18} />
              </Button>
            </div>
          </div>

          {/* 筛选工具栏 - PC 端显示全部，移动端只显示搜索框 */}
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            {/* 搜索框 - 始终显示，最多占 50% */}
            <div className='relative w-full max-w-[50%] sm:flex-1 sm:max-w-sm'>
              <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='text'
                placeholder='搜索姓名、邮箱或角色...'
                value={searchQuery}
                onChange={handleSearchChange}
                className='pl-9'
              />
            </div>

            {/* 筛选和排序 - 仅 PC 端显示 */}
            <div className='hidden sm:flex items-center gap-2 sm:ms-auto'>
              {/* 状态筛选 */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className='w-36'>
                  <Filter className='mr-2 h-4 w-4' />
                  <SelectValue placeholder='状态' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>全部状态</SelectItem>
                  <SelectItem value='active'>活跃</SelectItem>
                  <SelectItem value='inactive'>未激活</SelectItem>
                </SelectContent>
              </Select>

              {/* 排序 - 简洁图标风格 */}
              <Select value={sortOrder} onValueChange={(value) => {
                setSortOrder(value as 'asc' | 'desc')
                setCurrentPage(1)
              }}>
                <SelectTrigger className='w-16'>
                  <SelectValue>
                    <SlidersHorizontal size={18} />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align='end'>
                  <SelectItem value='desc'>
                    <div className='flex items-center gap-2'>
                      <SlidersHorizontal size={16} />
                      <span>ID 降序</span>
                    </div>
                  </SelectItem>
                  <SelectItem value='asc'>
                    <div className='flex items-center gap-2'>
                      <SlidersHorizontal size={16} />
                      <span>ID 升序</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className='my-4 shadow-sm' />

        {/* 内容区域 - 可滚动（隐藏滚动条） */}
        <div className='faded-bottom no-scrollbar flex flex-1 flex-col gap-4 overflow-auto pt-4 pb-4'>
          {/* 桌面端表格视图 */}
          <div className='hidden lg:block'>
            <div className='overflow-hidden rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[80px]'>用户</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className='w-[80px]'>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className='h-8 w-8'>
                          {user.avatar && <AvatarImage src={user.avatar} />}
                          <AvatarFallback>
                            {user.name.split('').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className='font-medium'>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status === 'active' ? '活跃' : '未激活'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>
                              <Edit className='mr-2 h-4 w-4' />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-destructive'>
                              <Trash2 className='mr-2 h-4 w-4' />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* 移动端卡片视图 */}
          <div className='lg:hidden'>
            <div className='grid gap-4'>
              {currentUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-10 w-10'>
                        {user.avatar && <AvatarImage src={user.avatar} />}
                        <AvatarFallback>
                          {user.name.split('').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className='text-base'>{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem>
                          <Edit className='mr-2 h-4 w-4' />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className='text-destructive'>
                          <Trash2 className='mr-2 h-4 w-4' />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className='flex items-center justify-between'>
                      <div className='text-sm'>
                        <span className='text-muted-foreground'>角色：</span>
                        <span className='font-medium'>{user.role}</span>
                      </div>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? '活跃' : '未激活'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 分页控件 - PC 和移动端都显示 */}
          <div className='flex items-center justify-between pt-4'>
            <div className='text-sm text-muted-foreground'>
              显示 {startIndex + 1} - {Math.min(endIndex, allUsers.length)} 条，共 {allUsers.length} 条
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) handlePageChange(currentPage - 1)
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href='#'
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page)
                      }}
                      isActive={currentPage === page}
                      className='hidden sm:inline-flex'
                    >
                      {page}
                    </PaginationLink>
                    {/* 移动端简化显示 */}
                    {page === 1 && totalPages > 1 && (
                      <PaginationLink
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page)
                        }}
                        isActive={currentPage === page}
                        className='sm:hidden'
                      >
                        {page}
                      </PaginationLink>
                    )}
                    {page === totalPages && totalPages > 1 && page !== 1 && (
                      <PaginationLink
                        href='#'
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(page)
                        }}
                        isActive={currentPage === page}
                        className='sm:hidden'
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) handlePageChange(currentPage + 1)
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Main>
    </>
  )
}
