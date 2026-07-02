'use client'

import React, { useState, useCallback, useRef, useId } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Validator {
  /** 验证函数，返回错误消息字符串，空字符串表示通过 */
  validate: (value: string) => string
}

interface ValidatedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** 验证器数组，依次执行 */
  validators?: Validator[]
  /** 是否必填 */
  required?: boolean
  /** 必填时的错误提示 */
  requiredMessage?: string
  /** 值变化回调 */
  onChange?: (value: string) => void
  /** 标签 */
  label?: string
  /** 输入框外层样式 */
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ValidatedInput({
  validators = [],
  required = false,
  requiredMessage = '此项为必填项',
  onChange,
  label,
  className,
  value: controlledValue,
  defaultValue,
  onBlur,
  id: externalId,
  ...inputProps
}: ValidatedInputProps) {
  const generatedId = useId()
  const inputId = externalId || generatedId

  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const value = controlledValue !== undefined ? String(controlledValue) : internalValue

  const [errors, setErrors] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInternalValue(newValue)
      onChange?.(newValue)

      // 如果已经 touched，实时验证
      if (touched) {
        runValidation(newValue)
      }
    },
    [onChange, touched],
  )

  const runValidation = useCallback(
    (val: string) => {
      const newErrors: string[] = []

      // 必填检查
      if (required && (!val || val.trim() === '')) {
        newErrors.push(requiredMessage)
      }

      // 自定义验证器
      if (val.trim() !== '') {
        for (const validator of validators) {
          const error = validator.validate(val)
          if (error) {
            newErrors.push(error)
          }
        }
      }

      setErrors(newErrors)
      setIsValid(newErrors.length === 0 && val.trim() !== '')
      return newErrors
    },
    [required, requiredMessage, validators],
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      runValidation(value as string)
      onBlur?.(e)
    },
    [value, runValidation, onBlur],
  )

  const showError = touched && errors.length > 0
  const showSuccess = touched && isValid && (value as string).trim() !== ''

  return (
    <div className={className}>
      {/* 标签 */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-ink mb-1.5"
        >
          {label}
          {required && (
            <span className="ml-0.5 text-cinnabar">*</span>
          )}
        </label>
      )}

      {/* 输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            w-full px-4 py-2.5 rounded-[8px] text-sm text-ink
            bg-white border transition-all duration-200
            placeholder:text-ink-light
            outline-none
            ${
              showError
                ? 'border-cinnabar ring-2 ring-cinnabar/15 focus:border-cinnabar focus:ring-2 focus:ring-cinnabar/20'
                : showSuccess
                  ? 'border-green-400 ring-2 ring-green-400/15 focus:border-green-500 focus:ring-2 focus:ring-green-400/20'
                  : 'border-border focus:border-ochre focus:ring-2 focus:ring-ochre/15'
            }
          `}
          aria-invalid={showError}
          aria-describedby={
            showError ? `${inputId}-error` : undefined
          }
          {...inputProps}
        />

        {/* 状态图标 */}
        {showError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-cinnabar" />
        )}
        {showSuccess && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-green-500" />
        )}
      </div>

      {/* 错误信息 */}
      {showError && (
        <div
          id={`${inputId}-error`}
          className="mt-1.5 flex flex-col gap-0.5"
          role="alert"
        >
          {errors.map((error, idx) => (
            <p key={idx} className="text-xs text-cinnabar">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
