'use client'

import { useState, useEffect, FC } from 'react'
import {
  Wallet, BarChart3, CheckCircle, Clock, XCircle, DollarSign, TrendingUp,
  Filter, X, Search, RefreshCw, Eye
} from 'lucide-react'
import { Transaction } from './types'

interface TransactionsTabProps {
  transactions: Transaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  onPageChange: (page: number) => void
  onRefresh: () => void
  onTransactionStatusConfirm: (transactionId: string, status: 'APPROVED' | 'REJECTED', details?: string) => void
}

const TransactionsTab: FC<TransactionsTabProps> = ({ transactions, pagination, onPageChange, onRefresh, onTransactionStatusConfirm }) => {
  const [filters, setFilters] = useState({ status: '', type: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [filteredTransactions, setFilteredTransactions] = useState(transactions)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        const response = await fetch('/api/admin/transactions?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setAllTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching all transactions:', error)
      }
    }
    fetchAllTransactions()
  }, [])

  useEffect(() => {
    let filtered = allTransactions.length > 0 ? allTransactions : transactions
    if (filters.status) filtered = filtered.filter((t) => t.status === filters.status)
    if (filters.type) filtered = filtered.filter((t) => t.type === filters.type)
    if (filters.search) {
      filtered = filtered.filter(
        (t) =>
          t.user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          t.user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          (t.user.phoneNumber && t.user.phoneNumber.includes(filters.search)) ||
          (t.adminWalletNumber && t.adminWalletNumber.includes(filters.search))
      )
    }
    if (filters.dateFrom) filtered = filtered.filter((t) => new Date(t.createdAt) >= new Date(filters.dateFrom))
    if (filters.dateTo) filtered = filtered.filter((t) => new Date(t.createdAt) <= new Date(filters.dateTo))
    if (filters.minAmount) filtered = filtered.filter((t) => Number(t.amount) >= Number(filters.minAmount))
    if (filters.maxAmount) filtered = filtered.filter((t) => Number(t.amount) <= Number(filters.maxAmount))
    setFilteredTransactions(filtered)
  }, [transactions, allTransactions, filters])

  const clearFilters = () => setFilters({ status: '', type: '', dateFrom: '', dateTo: '', minAmount: '', maxAmount: '', search: '' })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; icon: string }> = {
      PENDING: { label: 'في الانتظار', class: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300', icon: '⏳' },
      APPROVED: { label: 'موافق عليه', class: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300', icon: '✅' },
      REJECTED: { label: 'مرفوض', class: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border border-red-300', icon: '❌' },
    }
    const info = statusMap[status] || { label: status, class: 'bg-gray-100 text-gray-800', icon: '❓' }
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${info.class} shadow-sm`}>
        <span>{info.icon}</span>
        {info.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; class: string; icon: string }> = {
      TOP_UP: { label: 'شحن رصيد', class: 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300', icon: '💰' },
      PLATFORM_PURCHASE: { label: 'شراء منصة', class: 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300', icon: '🛒' },
      MENTORSHIP_PAYMENT: { label: 'دفع إرشاد', class: 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border border-indigo-300', icon: '🎓' },
    }
    const info = typeMap[type] || { label: type, class: 'bg-gray-100 text-gray-800', icon: '❓' }
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${info.class} shadow-sm`}>
        <span>{info.icon}</span>
        {info.label}
      </span>
    )
  }

  const allTransactionsForStats = allTransactions.length > 0 ? allTransactions : transactions
  const stats = {
    total: allTransactionsForStats.length,
    pending: allTransactionsForStats.filter((t) => t.status === 'PENDING').length,
    approved: allTransactionsForStats.filter((t) => t.status === 'APPROVED').length,
    rejected: allTransactionsForStats.filter((t) => t.status === 'REJECTED').length,
    totalAmount: allTransactionsForStats.reduce((sum, t) => sum + Number(t.amount), 0),
    approvedAmount: allTransactionsForStats.filter((t) => t.status === 'APPROVED').reduce((sum, t) => sum + Number(t.amount), 0),
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">إدارة المعاملات المالية</h2>
              <p className="text-gray-600">مراجعة وإدارة جميع المعاملات المالية مع فلاتر متقدمة</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 ${
                showFilters ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>الفلاتر</span>
            </button>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="h-4 w-4" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'إجمالي المعاملات', value: stats.total, icon: <BarChart3 className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
            { label: 'في الانتظار', value: stats.pending, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-100', color: 'text-yellow-600' },
            { label: 'مقبولة', value: stats.approved, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-100', color: 'text-green-600' },
            { label: 'مرفوضة', value: stats.rejected, icon: <XCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-100', color: 'text-red-600' },
            { label: 'إجمالي المبلغ', value: `${stats.totalAmount.toFixed(2)} ج`, icon: <DollarSign className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100', color: 'text-gray-900' },
            { label: 'المبلغ المقبول', value: `${stats.approvedAmount.toFixed(2)} ج`, icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-100', color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color || 'text-gray-900'}`}>{s.value}</p>
                </div>
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center`}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              فلاتر البحث المتقدمة
            </h3>
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">البحث</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" placeholder="اسم المستخدم، البريد، رقم الهاتف..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">جميع الحالات</option>
                <option value="PENDING">في الانتظار</option>
                <option value="APPROVED">مقبول</option>
                <option value="REJECTED">مرفوض</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المعاملة</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">جميع الأنواع</option>
                <option value="TOP_UP">شحن رصيد</option>
                <option value="PLATFORM_PURCHASE">شراء منصة</option>
                <option value="MENTORSHIP_PAYMENT">دفع إرشاد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أقل مبلغ</label>
              <input type="number" placeholder="0" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">أعلى مبلغ</label>
              <input type="number" placeholder="∞" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredTransactions.map((transaction, index) => (
                <tr key={transaction.id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">{transaction.user.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-semibold text-gray-900">{transaction.user.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span>📧</span>
                          {transaction.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{getTypeBadge(transaction.type)}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-bold text-gray-900">{Number(transaction.amount).toFixed(2)}</span>
                      <span className="text-xs text-gray-500">جنيه</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">{getStatusBadge(transaction.status)}</td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span className="text-sm text-gray-600">{new Date(transaction.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    {transaction.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onTransactionStatusConfirm(transaction.id, 'APPROVED', `المبلغ: ${Number(transaction.amount).toFixed(2)} جنيه - المستخدم: ${transaction.user.name}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          ✓ قبول
                        </button>
                        <button
                          onClick={() => onTransactionStatusConfirm(transaction.id, 'REJECTED', `المبلغ: ${Number(transaction.amount).toFixed(2)} جنيه - المستخدم: ${transaction.user.name}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 shadow-sm"
                        >
                          ✗ رفض
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSelectedTransaction(transaction); setShowTransactionModal(true); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        <Eye className="w-3 h-3" />
                        عرض
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد معاملات</h3>
                        <p className="text-gray-500">لم يتم العثور على معاملات تطابق معايير البحث المحددة</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 flex items-center justify-center border-t border-gray-200">
          <div className="text-sm text-gray-700 font-medium">
            عرض <span className="font-bold text-blue-600">{filteredTransactions.length}</span> من إجمالي{' '}
            <span className="font-bold text-green-600">{allTransactionsForStats.length}</span> معاملة
          </div>
        </div>
      </div>

      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">تفاصيل المعاملة</h3>
              <button onClick={() => { setShowTransactionModal(false); setSelectedTransaction(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">حالة المعاملة</span>
                {getStatusBadge(selectedTransaction.status)}
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-600">نوع المعاملة</span>
                {getTypeBadge(selectedTransaction.type)}
              </div>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <span className="text-sm font-medium text-gray-600">المبلغ</span>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-700">{Number(selectedTransaction.amount).toFixed(2)} جنيه</span>
                </div>
              </div>
              {selectedTransaction.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => { onTransactionStatusConfirm(selectedTransaction.id, 'APPROVED', `المبلغ: ${Number(selectedTransaction.amount).toFixed(2)} جنيه - المستخدم: ${selectedTransaction.user.name}`); setShowTransactionModal(false); setSelectedTransaction(null); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    قبول المعاملة
                  </button>
                  <button
                    onClick={() => { onTransactionStatusConfirm(selectedTransaction.id, 'REJECTED', `المبلغ: ${Number(selectedTransaction.amount).toFixed(2)} جنيه - المستخدم: ${selectedTransaction.user.name}`); setShowTransactionModal(false); setSelectedTransaction(null); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض المعاملة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransactionsTab
