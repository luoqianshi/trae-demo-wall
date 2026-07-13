# 前端表单弹窗模板

> React Hook Form + Zod + Dialog 弹窗 + Provider 状态管理。

---

## 一、Provider 模板（弹窗状态管理）

```tsx
// features/users/components/users-provider.tsx
import React, { useState } from 'react'
import { useDialogState } from '@/hooks/use-dialog-state'
import { type User } from '../data/schema'

type UsersDialogType = 'add' | 'edit' | 'delete' | 'import'

interface UsersContextType {
  open: UsersDialogType | null
  setOpen: (open: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: (row: User | null) => void
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </UsersContext>
  )
}

export const useUsers = () => {
  const ctx = React.useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within <UsersProvider>')
  return ctx
}
```

---

## 二、弹窗注册中心

```tsx
// features/users/components/users-dialogs.tsx
import { UsersActionDialog } from './users-action-dialog'
import { UsersDeleteDialog } from './users-delete-dialog'
import { useUsers } from './users-provider'

export function UsersDialogs() {
  const { open, setOpen, currentRow } = useUsers()
  return (
    <>
      <UsersActionDialog
        key="user-add"
        open={open === 'add'}
        onOpenChange={() => setOpen(null)}
      />
      {currentRow && (
        <>
          <UsersActionDialog
            key={`user-edit-${currentRow.id}`}
            open={open === 'edit'}
            currentRow={currentRow}
          />
          <UsersDeleteDialog
            key={`user-delete-${currentRow.id}`}
            open={open === 'delete'}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
```

**关键**：`key` 属性强制重置弹窗状态，避免编辑后残留数据。

---

## 三、新增/编辑弹窗

```tsx
// features/users/components/users-action-dialog.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'
import { addUser, updateUser } from '../api'
import { userSchema, type User } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: User | null
}

export function UsersActionDialog({ open, onOpenChange, currentRow }: Props) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      userName: currentRow?.userName ?? '',
      userAccount: currentRow?.userAccount ?? '',
      userRole: currentRow?.userRole ?? 'user',
    },
  })

  const mutation = useMutation({
    mutationFn: isEdit ? updateUser : addUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
  })

  const onSubmit = (values: any) => {
    mutation.mutate(isEdit ? { ...values, id: String(currentRow!.id) } : values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* 其他字段... */}
            <Button type="submit" loading={mutation.isPending}>
              {isEdit ? '保存' : '创建'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 四、删除确认弹窗

```tsx
// features/users/components/users-delete-dialog.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteUser } from '../api'
import { type User } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User | null
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onOpenChange(false)
    },
  })

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除用户「{currentRow?.userName}」吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={() => mutation.mutate({ id: String(currentRow!.id) })}>
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## 五、关键约定

- **Provider 管理状态**：`open`(弹窗类型) + `currentRow`(当前行)
- **Dialogs 集中渲染**：所有弹窗在 `*-dialogs.tsx` 统一注册
- **key 重置状态**：`key={`edit-${currentRow.id}`}` 避免残留
- **useMutation**：成功后 `invalidateQueries` 失效缓存
- **新增/编辑共用**：通过 `isEdit = !!currentRow` 区分
- **ID 传字符串**：`String(currentRow!.id)`