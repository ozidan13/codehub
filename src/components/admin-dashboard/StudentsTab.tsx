'use client'

import { useState, useEffect, FC } from 'react'
import {
  Users, CheckCircle, Clock, Star, BarChart3, Award,
  Filter, X, Search, RefreshCw, Eye, User as UserIcon, FileText
} from 'lucide-react'
import { Student } from './types'
import { formatDate } from '@/lib/dateUtils'

interface StudentsTabProps {
  students: Student[]
  onRefresh: () => void
}

const StudentsTab: FC<StudentsTabProps> = ({ students, onRefresh }) => {
  const [filters, setFilters] = useState({
    search: '',
    minScore: '',
    maxScore: '',
    minTasks: '',
    maxTasks: '',
    dateFrom: '',
    dateTo: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState(students)
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)

  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const response = await fetch('/api/users?role=STUDENT&includeProgress=true')
        if (response.ok) {
          const data = await response.json()
          const studentsData = data.users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            totalTasks: user.stats?.totalSubmissions || 0,
            completedTasks: user.stats?.approvedSubmissions || 0,
            pendingTasks: user.stats?.pendingSubmissions || 0,
            averageScore: user.stats?.averageScore || null,
            createdAt: user.createdAt,
            stats: user.stats,
          }))
          setAllStudents(studentsData)
        }
      } catch (error) {
        console.error('Error fetching all students:', error)
      }
    }
    fetchAllStudents()
  }, [])

  useEffect(() => {
    let filtered = allStudents.length > 0 ? allStudents : students
    if (filters.search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          s.email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    if (filters.minScore) {
      filtered = filtered.filter((s) => s.averageScore !== null && s.averageScore >= Number(filters.minScore))
    }
    if (filters.maxScore) {
      filtered = filtered.filter((s) => s.averageScore !== null && s.averageScore <= Number(filters.maxScore))
    }
    if (filters.minTasks) {
      filtered = filtered.filter((s) => s.completedTasks >= Number(filters.minTasks))
    }
    if (filters.maxTasks) {
      filtered = filtered.filter((s) => s.completedTasks <= Number(filters.maxTasks))
    }
    if (filters.dateFrom) {
      filtered = filtered.filter((s) => new Date(s.createdAt) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter((s) => new Date(s.createdAt) <= new Date(filters.dateTo))
    }
    setFilteredStudents(filtered)
  }, [students, allStudents, filters])

  const clearFilters = () => {
    setFilters({ search: '', minScore: '', maxScore: '', minTasks: '', maxTasks: '', dateFrom: '', dateTo: '' })
  }

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  const allStudentsForStats = allStudents.length > 0 ? allStudents : students
  const stats = {
    total: allStudentsForStats.length,
    active: allStudentsForStats.filter((s) => s.completedTasks > 0).length,
    inactive: allStudentsForStats.filter((s) => s.completedTasks === 0).length,
    highPerformers: allStudentsForStats.filter((s) => s.averageScore !== null && s.averageScore >= 80).length,
    averageScore:
      allStudentsForStats.reduce((sum, s) => sum + (s.averageScore || 0), 0) /
        allStudentsForStats.filter((s) => s.averageScore !== null).length || 0,
    totalCompletedTasks: allStudentsForStats.reduce((sum, s) => sum + s.completedTasks, 0),
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                إدارة الطلاب
              </h2>
              <p className="text-gray-600">مراجعة وإدارة جميع الطلاب مع فلاتر متقدمة</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                showFilters
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>الفلاتر</span>
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الطلاب</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">طلاب نشطون</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">طلاب غير نشطين</p>
                <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متفوقون</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.highPerformers}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوسط الدرجات</p>
                <p className="text-xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المهام المكتملة</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalCompletedTasks}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              فلاتر البحث المتقدمة
            </h3>
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو البريد الإلكتروني"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق الدرجات</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="number"
                  placeholder="من"
                  value={filters.minScore}
                  onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={filters.maxScore}
                  onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق المهام المكتملة</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="number"
                  placeholder="من"
                  value={filters.minTasks}
                  onChange={(e) => setFilters({ ...filters, minTasks: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="number"
                  placeholder="إلى"
                  value={filters.maxTasks}
                  onChange={(e) => setFilters({ ...filters, maxTasks: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">نطاق تاريخ التسجيل</label>
              <div className="flex space-x-2 space-x-reverse">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الطالب</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الإحصائيات</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الأداء</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">تاريخ التسجيل</th>
                <th className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-green-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>مكتملة: {student.completedTasks}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span>معلقة: {student.pendingTasks}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {student.averageScore !== null ? (
                          <>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                student.averageScore >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : student.averageScore >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {student.averageScore.toFixed(1)}
                            </div>
                            {student.averageScore >= 80 && <Star className="w-4 h-4 text-yellow-500 mr-2" />}
                          </>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">لا توجد درجات</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(student.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStudentClick(student)}
                        className="flex items-center space-x-1 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>عرض</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-2" />
                      <span>لا توجد طلاب</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-sm text-gray-600 text-center">
          عرض {filteredStudents.length} من أصل {allStudentsForStats.length} طالب
        </p>
      </div>

      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  تفاصيل الطالب
                </h3>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-green-600" />
                    معلومات الطالب
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">الاسم</p>
                      <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">البريد الإلكتروني</p>
                      <p className="font-medium text-gray-900">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">تاريخ التسجيل</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedStudent.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">متوسط الدرجات</p>
                      <p className="font-medium text-gray-900">
                        {selectedStudent.averageScore !== null ? selectedStudent.averageScore.toFixed(2) : 'لا توجد درجات'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    إحصائيات الأداء
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{selectedStudent.completedTasks}</p>
                      <p className="text-sm text-gray-600">مهام مكتملة</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-6 h-6 text-yellow-600" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{selectedStudent.pendingTasks}</p>
                      <p className="text-sm text-gray-600">مهام معلقة</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{selectedStudent.totalTasks}</p>
                      <p className="text-sm text-gray-600">إجمالي المهام</p>
                    </div>
                  </div>
                </div>

                {selectedStudent.stats && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      إحصائيات التقديمات
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-bold text-gray-900">{selectedStudent.stats.totalSubmissions}</p>
                        <p className="text-sm text-gray-600">إجمالي التقديمات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-600">{selectedStudent.stats.approvedSubmissions}</p>
                        <p className="text-sm text-gray-600">مقبولة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-yellow-600">{selectedStudent.stats.pendingSubmissions}</p>
                        <p className="text-sm text-gray-600">معلقة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-red-600">{selectedStudent.stats.rejectedSubmissions}</p>
                        <p className="text-sm text-gray-600">مرفوضة</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsTab
