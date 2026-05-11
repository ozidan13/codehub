'use client'

import { useState, useEffect, FC, FormEvent, ChangeEvent } from 'react'
import { X, AlertCircle, ChevronDown } from 'lucide-react'
import { Platform, Task, User, FormData } from './types'

interface CrudModalProps {
  mode: 'create' | 'edit'
  entityType: 'platform' | 'task' | 'user'
  entityData?: Platform | Task | User
  formData: FormData
  setFormData: (data: FormData) => void
  platforms?: Platform[]
  onClose: () => void
  onSubmit: () => void
}

const InputField: FC<{
  name: string
  label: string
  value: string | number
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  error?: string
}> = ({ name, label, value, onChange, type = 'text', error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`mt-1 block w-full p-2 border rounded-md ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}`}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

const TextAreaField: FC<{
  name: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
}> = ({ name, label, value, onChange, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      rows={4}
      className={`block w-full px-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'}`}
      placeholder={`أدخل ${label}`}
    />
    {error && (
      <p className="text-sm text-red-600 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
)

const SelectField: FC<{
  name: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  error?: string
}> = ({ name, label, value, onChange, options, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">{label}</label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`block w-full px-4 py-3 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 appearance-none bg-white ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200 hover:border-gray-400'}`}
      >
        <option value="">اختر {label}...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
    </div>
    {error && (
      <p className="text-sm text-red-600 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
)

const CrudModal: FC<CrudModalProps> = ({ mode, entityType, entityData, formData, setFormData, platforms, onClose, onSubmit }) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && entityData) {
      setFormData(entityData)
    } else {
      setFormData({})
    }
    setErrors({})
  }, [mode, entityData, setFormData])

  const title = `${mode === 'create' ? 'إنشاء' : 'تعديل'} ${{
    platform: 'منصة',
    task: 'مهمة',
    user: 'مستخدم',
  }[entityType]}`

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    switch (entityType) {
      case 'platform':
        if (!formData.name?.trim()) {
          newErrors.name = 'اسم المنصة مطلوب'
        } else if (formData.name.length < 2) {
          newErrors.name = 'اسم المنصة يجب أن يكون أكثر من حرفين'
        }
        if (!formData.url?.trim()) {
          newErrors.url = 'رابط المنصة مطلوب'
        } else if (!/^https?:\/\/.+/.test(formData.url)) {
          newErrors.url = 'يجب أن يكون الرابط صحيحاً ويبدأ بـ http:// أو https://'
        }
        break

      case 'task':
        if (!formData.title?.trim()) {
          newErrors.title = 'عنوان المهمة مطلوب'
        } else if (formData.title.length < 3) {
          newErrors.title = 'عنوان المهمة يجب أن يكون أكثر من 3 أحرف'
        }
        if (!formData.platformId) {
          newErrors.platformId = 'يجب اختيار منصة'
        }
        if (!formData.link?.trim()) {
          newErrors.link = 'رابط المهمة مطلوب'
        } else if (!/^https?:\/\/.+/.test(formData.link)) {
          newErrors.link = 'يجب أن يكون الرابط صحيحاً ويبدأ بـ http:// أو https://'
        }
        if (formData.order && (isNaN(Number(formData.order)) || Number(formData.order) < 1)) {
          newErrors.order = 'الترتيب يجب أن يكون رقماً موجباً'
        }
        break

      case 'user':
        if (!formData.name?.trim()) {
          newErrors.name = 'اسم المستخدم مطلوب'
        } else if (formData.name.length < 2) {
          newErrors.name = 'الاسم يجب أن يكون أكثر من حرفين'
        }
        if (!formData.email?.trim()) {
          newErrors.email = 'البريد الإلكتروني مطلوب'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'البريد الإلكتروني غير صحيح'
        }
        if (!formData.phoneNumber?.trim()) {
          newErrors.phoneNumber = 'رقم الهاتف مطلوب'
        } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = 'رقم الهاتف غير صحيح'
        }
        if (mode === 'create' && !formData.password?.trim()) {
          newErrors.password = 'كلمة المرور مطلوبة'
        } else if (mode === 'create' && formData.password && formData.password.length < 6) {
          newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        }
        if (!formData.role) {
          newErrors.role = 'يجب اختيار دور المستخدم'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderFields = () => {
    switch (entityType) {
      case 'platform':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} error={errors.name} />
            <InputField name="url" label="الرابط" value={formData.url || ''} onChange={handleChange} error={errors.url} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} error={errors.description} />
          </>
        )
      case 'task':
        return (
          <>
            <InputField name="title" label="العنوان" value={formData.title || ''} onChange={handleChange} error={errors.title} />
            <SelectField
              name="platformId"
              label="المنصة"
              value={formData.platformId || ''}
              onChange={handleChange}
              options={platforms?.map((p) => ({ value: p.id, label: p.name })) || []}
              error={errors.platformId}
            />
            <InputField name="link" label="رابط المهمة" value={formData.link || ''} onChange={handleChange} error={errors.link} />
            <InputField name="order" label="الترتيب" type="number" value={formData.order || ''} onChange={handleChange} error={errors.order} />
            <TextAreaField name="description" label="الوصف" value={formData.description || ''} onChange={handleChange} error={errors.description} />
          </>
        )
      case 'user':
        return (
          <>
            <InputField name="name" label="الاسم" value={formData.name || ''} onChange={handleChange} error={errors.name} />
            <InputField name="email" label="البريد الإلكتروني" type="email" value={formData.email || ''} onChange={handleChange} error={errors.email} />
            <InputField name="phoneNumber" label="رقم الهاتف" value={formData.phoneNumber || ''} onChange={handleChange} error={errors.phoneNumber} />
            {mode === 'create' && (
              <InputField name="password" label="كلمة المرور" type="password" value={formData.password || ''} onChange={handleChange} error={errors.password} />
            )}
            <SelectField
              name="role"
              label="الدور"
              value={formData.role || ''}
              onChange={handleChange}
              options={[
                { value: 'STUDENT', label: 'طالب' },
                { value: 'ADMIN', label: 'مدير' },
              ]}
              error={errors.role}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {renderFields()}
          <div className="flex justify-end space-x-3 pt-4 border-t mt-4 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CrudModal
