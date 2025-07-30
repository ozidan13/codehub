'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Wallet, CreditCard, RefreshCw, X } from 'lucide-react'
import { formatDateTime } from '@/lib/dateUtils'
import { WalletData, Transaction } from '@/types'

export default function WalletPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTopUpModal, setShowTopUpModal] = useState(false)

  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return
    setIsLoading(true)
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        fetch('/api/wallet'),
        fetch('/api/transactions')
      ])
      
      if (walletRes.ok) {
        const data = await walletRes.json()
        setWallet(data)
      }
      
      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (session?.user?.role === 'ADMIN') {
      router.push('/admin')
      return
    }
    fetchData()
  }, [session, status, router, fetchData])

  const handleTopUpSuccess = () => {
    setShowTopUpModal(false)
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="loader h-12 w-12 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">جاري تحميل المحفظة...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">المحفظة الإلكترونية</h1>
          <p className="text-gray-600">إدارة رصيدك المالي ومعاملاتك</p>
        </div>

        <WalletSection wallet={wallet} onTopUp={() => setShowTopUpModal(true)} />
        <TransactionsSection transactions={transactions} />

        <TopUpModal 
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)} 
          onSuccess={handleTopUpSuccess} 
        />
      </div>
    </div>
  )
}

const WalletSection = ({ wallet, onTopUp }: { wallet: WalletData | null; onTopUp: () => void }) => {
  if (!wallet) return null
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-400 to-green-600 text-white">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">المحفظة الإلكترونية</h2>
            <p className="text-sm text-gray-600">إدارة رصيدك المالي</p>
          </div>
        </div>
        <button
          onClick={onTopUp}
          className="flex items-center space-x-2 space-x-reverse bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-px text-sm font-medium"
        >
          <CreditCard className="h-4 w-4" />
          <span>شحن الرصيد</span>
        </button>
      </div>
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">الرصيد الحالي</p>
          <p className="text-3xl font-bold text-gray-800">{Number(wallet.balance).toFixed(2)} جنية</p>
        </div>
      </div>
    </div>
  )
}

const TransactionsSection = ({ transactions }: { transactions: Transaction[] }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'DEPOSIT':
        return 'إيداع'
      case 'ENROLLMENT':
        return 'تسجيل'
      case 'MENTORSHIP':
        return 'جلسة إرشادية'
      default:
        return type
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">سجل المعاملات</h3>
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">لا توجد معاملات</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getTypeLabel(transaction.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{Number(transaction.amount).toFixed(2)} جنية</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(transaction.createdAt)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.description || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const TopUpModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('يرجى إدخال مبلغ صحيح')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount)
        }),
      })
      if (response.ok) {
        onSuccess()
        onClose()
        setAmount('')
        alert('تم إرسال طلب الشحن بنجاح. سيتم مراجعته من قبل الإدارة.')
      } else {
        const error = await response.json()
        alert(`فشل في إرسال الطلب: ${error.error}`)
      }
    } catch (error) {
      console.error('Top-up error:', error)
      alert('حدث خطأ أثناء إرسال الطلب.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">شحن الرصيد</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم المحفظة للتحويل إليها:</label>
            <div className="text-lg font-bold text-blue-600">01026454497</div>
            <p className="text-xs text-gray-600 mt-1">قم بتحويل المبلغ من رقمك المسجل إلى هذا الرقم</p>
          </div>
          {session?.user?.phoneNumber && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">رقمك المسجل:</label>
              <div className="text-lg font-bold text-green-600">{session.user.phoneNumber}</div>
              <p className="text-xs text-gray-600 mt-1">تأكد من التحويل من هذا الرقم</p>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">المبلغ (جنيه مصري)</label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل المبلغ المحول"
              required
            />
          </div>

          <div className="flex space-x-3 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}