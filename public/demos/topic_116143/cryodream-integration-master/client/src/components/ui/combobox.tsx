import { useState, type ReactNode } from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ComboboxOption {
  label: string
  value: string
}

interface SingleComboboxProps {
  mode: 'single'
  value: string
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCreate?: boolean
  onChange: (value: string) => void
  className?: string
}

interface MultiComboboxProps {
  mode: 'multi'
  value: string[]
  options: ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  allowCreate?: boolean
  onChange: (value: string[]) => void
  className?: string
}

type ComboboxProps = SingleComboboxProps | MultiComboboxProps

/**
 * 通用 Combobox 组件
 * - single 模式：单选下拉框
 * - multi 模式：多选标签输入框，支持模糊搜索和创建新标签
 */
export function Combobox(props: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const options = props.options
  const allowCreate = props.allowCreate ?? false
  const searchPlaceholder = props.searchPlaceholder ?? '搜索...'
  const emptyText = props.emptyText ?? '无匹配项'

  // 过滤选项
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  // 是否可以创建新项（允许创建 + 搜索值非空 + 不在已有选项中）
  const canCreate =
    allowCreate &&
    search.trim().length > 0 &&
    !options.some((option) => option.label.toLowerCase() === search.toLowerCase())

  const handleCreate = () => {
    const newValue = search.trim()
    if (!newValue) return
    if (props.mode === 'single') {
      props.onChange(newValue)
      setSearch('')
      setOpen(false)
    } else {
      if (!props.value.includes(newValue)) {
        props.onChange([...props.value, newValue])
      }
      setSearch('')
    }
  }

  // 单选模式
  if (props.mode === 'single') {
    const selected = options.find((option) => option.value === props.value)
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', props.className)}
          >
            <span className="truncate">{selected ? selected.label : (props.placeholder ?? '请选择')}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
            <CommandList className="max-h-64">
              <CommandEmpty>{canCreate ? '按回车创建' : emptyText}</CommandEmpty>
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        props.onChange(option.value)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <Check className={cn('mr-2 size-4', props.value === option.value ? 'opacity-100' : 'opacity-0')} />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <>
                  {filteredOptions.length > 0 && <CommandSeparator />}
                  <CommandGroup>
                    <CommandItem onSelect={handleCreate}>
                      <Plus className="mr-2 size-4" />
                      创建"{search.trim()}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // 多选模式
  const selectedValues = props.value
  const selectedOptions = options.filter((option) => selectedValues.includes(option.value))
  // 自定义创建的标签（不在 options 中的）
  const customTags = selectedValues.filter((value) => !options.some((option) => option.value === value))

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      props.onChange(selectedValues.filter((v) => v !== value))
    } else {
      props.onChange([...selectedValues, value])
    }
  }

  const handleRemove = (value: string) => {
    props.onChange(selectedValues.filter((v) => v !== value))
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 rounded-md border bg-background p-1.5 min-h-9', props.className)}>
      {selectedOptions.map((option) => (
        <Badge key={option.value} variant="secondary" className="gap-1 text-xs">
          {option.label}
          <button
            type="button"
            className="rounded-full hover:bg-muted-foreground/20"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(option.value)
            }}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {customTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 text-xs">
          {tag}
          <button
            type="button"
            className="rounded-full hover:bg-muted-foreground/20"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(tag)
            }}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3" />
            {selectedValues.length === 0 ? (props.placeholder ?? '添加标签') : '添加'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canCreate) {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            <CommandList className="max-h-64">
              <CommandEmpty>{canCreate ? '按回车创建' : emptyText}</CommandEmpty>
              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        handleToggle(option.value)
                        setSearch('')
                      }}
                    >
                      <Check className={cn('mr-2 size-4', selectedValues.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canCreate && (
                <>
                  {filteredOptions.length > 0 && <CommandSeparator />}
                  <CommandGroup>
                    <CommandItem onSelect={handleCreate}>
                      <Plus className="mr-2 size-4" />
                      创建"{search.trim()}"
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** 渲染 Combobox 的标签展示（用于只读场景） */
export function ComboboxTags({ tags, emptyText = '-' }: { tags: string[]; emptyText?: string }): ReactNode {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">{emptyText}</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  )
}
