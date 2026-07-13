# 前端数据表模板

> 基于用户管理模块实际实现的服务端分页数据表。

---

## 一、核心组件

从 `@/components/data-table` 导入：

| 组件 | 用途 |
|------|------|
| `DataTablePagination` | 分页控件（页码按钮 + 每页条数） |
| `DataTableToolbar` | 工具栏（搜索框 + 篮选器 + 列显隐） |
| `DataTableColumnHeader` | 可排序列头 |
| `DataTableFacetedFilter` | 多选筛选器 |
| `DataTableViewOptions` | 列可见性切换 |

---

## 二、URL 状态同步 Hook

使用 `useTableUrlState` 将分页和筛选同步到 URL：

```tsx
import { useTableUrlState } from '@/hooks/use-table-url-state'

const {
  columnFilters,
  onColumnFiltersChange,
  pagination,
  onPaginationChange,
  ensurePageInRange,
} = useTableUrlState({
  search,    // routeApi.useSearch()
  navigate,  // routeApi.useNavigate()
  pagination: { defaultPage: 1, defaultPageSize: 10 },
  columnFilters: [
    { columnId: 'userName', searchKey: 'userName', type: 'string' },
    { columnId: 'userRole', searchKey: 'userRole', type: 'array' },
  ],
})
```

---

## 三、表格组件模板

```tsx
// features/<module>/components/<module>-table.tsx
import { useEffect, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { columns } from './<module>-columns'
import { type Item } from '../data/schema'
import { getItemPage } from '../api'

type DataTableProps = {
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function ModuleTable({ search, navigate }: DataTableProps) {
  // Local UI-only states
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])

  // Synced with URL
  const {
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    columnFilters: [
      { columnId: 'name', searchKey: 'name', type: 'string' },
      { columnId: 'status', searchKey: 'status', type: 'array' },
    ],
  })

  // 提取筛选值
  const nameFilter = columnFilters.find((f) => f.id === 'name')?.value as string | undefined
  const statusFilter = columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined

  // 服务端分页查询
  const { data, isLoading } = useQuery({
    queryKey: ['module', pagination.pageIndex + 1, pagination.pageSize, nameFilter, statusFilter],
    queryFn: () =>
      getItemPage({
        current: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        name: nameFilter || undefined,
        status: statusFilter?.[0] || undefined,
      }),
  })

  const serverData: Item[] = data?.data?.records ?? []
  const totalCount = data?.data?.total ?? 0

  const table = useReactTable({
    data: serverData,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
    },
    manualPagination: true,
    manualFiltering: true,
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  useEffect(() => {
    ensurePageInRange(table.getPageCount())
  }, [table, ensurePageInRange])

  return (
    <div className={cn(
      'faded-bottom no-scrollbar',
      'grid grid-cols-1 gap-4 overflow-auto pt-4 pb-16'
    )}>
      <DataTableToolbar
        table={table}
        searchPlaceholder='搜索名称...'
        searchKey='name'
        filters={[
          {
            columnId: 'status',
            title: '状态',
            options: statuses.map((s) => ({ label: s.label, value: s.value })),
          },
        ]}
      />

      {/* Desktop Table */}
      <div className='hidden lg:block'>
        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='group/row'>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())
                      }
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    加载中...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className='h-24 text-center'>
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataTablePagination table={table} className='mt-auto' />
    </div>
  )
}
```

---

## 四、列定义模板

```tsx
// features/<module>/components/<module>-columns.tsx
import type { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RowActions } from './row-actions'
import { type Item } from '../data/schema'
import { statusColorMap } from '../data/data'

export const columns: ColumnDef<Item>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => <DataTableColumnHeader column={column} title='ID' />,
    enableSorting: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title='名称' />,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='状态' />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge className={statusColorMap[status]}>{statusMap.get(status)}</Badge>
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'createTime',
    header: ({ column }) => <DataTableColumnHeader column={column} title='创建时间' />,
  },
  {
    id: 'actions',
    header: '操作',
    cell: ({ row }) => <RowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]
```

---

## 五、行操作模板

```tsx
// features/<module>/components/row-actions.tsx
import { Row } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useModule } from './<module>-provider'
import { type Item } from '../data/schema'

export function RowActions({ row }: { row: Row<Item> }) {
  const { setOpen, setCurrentRow } = useModule()
  const item = row.original

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => {
          setCurrentRow(item)
          setOpen('edit')
        }}>
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setCurrentRow(item)
          setOpen('delete')
        }}>
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 六、API 模板

```tsx
// features/<module>/api.ts
import api, { type ApiResponse, type PageResult } from '@/lib/api'
import { type Item } from './schema'

export interface QueryParams {
  current: number
  pageSize: number
  name?: string
  status?: string
}

export interface AddParams {
  name: string
  status: string
}

export interface UpdateParams {
  id: string
  name?: string
  status?: string
}

export interface DeleteParams {
  id: string | number
}

/** 分页获取列表 */
export function getItemPage(params: QueryParams) {
  return api.post<any, ApiResponse<PageResult<Item>>>('/module/list/page/vo', params)
}

/** 新增 */
export function addItem(data: AddParams) {
  return api.post<any, ApiResponse<number>>('/module/add', data)
}

/** 更新 */
export function updateItem(data: UpdateParams) {
  return api.post<any, ApiResponse<boolean>>('/module/update', data)
}

/** 删除 */
export function deleteItem(data: DeleteParams) {
  return api.post<any, ApiResponse<boolean>>('/module/delete', { id: String(data.id) })
}
```

---

## 七、路由分页参数

```tsx
// routes/_authenticated/<module>/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(10),
  name: z.string().optional(),
  status: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/<module>/')({
  validateSearch: searchSchema,
  component: ModulePage,
})
```

---

## 八、固定表头布局模式

### 页面布局（搜索在 Header）

```tsx
// features/<module>/index.tsx
<Header fixed>
  {/* 搜索组件 - 连接 URL 状态 */}
  <ModuleSearch />
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>

<Main fixed>
  {/* 标题区域 - 固定 */}
  <div className='flex items-center justify-between gap-2 pb-4'>
    <h1>{t('<module>.title')}</h1>
    <ModulePrimaryButtons />
  </div>

  <Separator className='shadow-sm' />

  {/* 表格区域 - 填满剩余空间 */}
  <div className='min-h-0 flex-1 pt-4'>
    <ModuleTable />
  </div>
</Main>
```

### 搜索组件模板

```tsx
// features/<module>/components/<module>-search.tsx
import { getRouteApi } from '@tanstack/react-router'
import { Input } from '@/components/ui/input'
import { useTranslation } from 'react-i18next'

const route = getRouteApi('/_authenticated/<module>/')

export function ModuleSearch() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <Input
      placeholder={t('<module>.searchPlaceholder')}
      value={(search as Record<string, unknown>).filter ?? ''}
      onChange={(e) => {
        navigate({
          search: (prev: Record<string, unknown>) => ({ ...prev, filter: e.target.value }),
          replace: true,
        })
      }}
      className='h-8 w-[150px] lg:w-[250px]'
    />
  )
}
```

### 表格组件布局（hideSearch）

```tsx
// features/<module>/components/<module>-table.tsx
return (
  <div className='flex h-full flex-col gap-4'>
    {/* Toolbar - 只有筛选器，搜索在 Header */}
    <DataTableToolbar
      table={table}
      hideSearch
      filters={[...]}
    />

    {/* 表格内容区域 - 可滚动 */}
    <div className='min-h-0 flex-1 overflow-auto'>
      <div className='hidden lg:block h-full'>
        <div className='overflow-hidden rounded-md border h-full flex flex-col'>
          <div className='flex-1 overflow-auto'>
            <Table>
              <TableHeader className='sticky top-0 z-10 bg-background'>
                {/* 表头 */}
              </TableHeader>
              <TableBody>
                {/* 表格内容 */}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>

    {/* Pagination - 固定在底部 */}
    <DataTablePagination table={table} />
    <DataTableBulkActions table={table} />
  </div>
)
```
              </TableHeader>
              <TableBody>
                {/* 表格内容 */}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>

    {/* Pagination - 固定在底部 */}
    <DataTablePagination table={table} />
    <DataTableBulkActions table={table} />
  </div>
)
```

### 关键 CSS

| 类 | 用途 |
|----|------|
| `min-h-0 flex-1` | 填满剩余空间（配合父容器 `flex flex-col`） |
| `flex h-full flex-col gap-4` | 表格组件 flex 布局 |
| `sticky top-0 z-10 bg-background` | 表头固定 |
| `overflow-auto` | 内容滚动 |

---

## 九、关键约定

| 约定 | 说明 |
|------|------|
| `useTableUrlState` | 分页/筛选同步 URL |
| `manualPagination: true` | 服务端分页 |
| `manualFiltering: true` | 服务端筛选 |
| `pageCount` | `Math.ceil(total / pageSize)` |
| `pageIndex + 1` | TanStack 从 0 开始，后端从 1 开始 |
| `DataTableToolbar` | `hideSearch` + `filters[]` 参数，搜索在 Header |
| `DataTablePagination` | 已集成 i18n |
| `queryKey` | 包含所有筛选参数，变化触发重新请求 |
| **固定表头** | `TableHeader` 加 `sticky top-0 bg-background` |

---

## 十、i18n 键

### 分页组件（common.pagination）

| 键 | zh | en |
|----|----|----|
| `common.pagination.pageOf` | 第 {{current}} 页，共 {{total}} 页 | Page {{current}} of {{total}} |
| `common.pagination.rowsPerPage` | 每页行数 | Rows per page |
| `common.pagination.goToFirstPage` | 转到第一页 | Go to first page |
| `common.pagination.goToPreviousPage` | 转到上一页 | Go to previous page |
| `common.pagination.goToNextPage` | 转到下一页 | Go to next page |
| `common.pagination.goToLastPage` | 转到最后一页 | Go to last page |
| `common.pagination.goToPage` | 转到第 {{page}} 页 | Go to page {{page}} |

### 工具栏组件（common）

| 键 | zh | en |
|----|----|----|
| `common.view` | 视图 | View |
| `common.toggleColumns` | 切换列 | Toggle columns |
| `common.reset` | 重置 | Reset |