'use client';

import { useState, FC } from 'react';
import { useSession } from 'next-auth/react';
import { Wallet, Activity, TrendingUp, Zap, CreditCard } from 'lucide-react';
import { WalletData } from '@/types';

const WalletSection: FC<{ wallet: WalletData | null; onTopUp: () => void }> = ({ wallet, onTopUp }) => {
  const { data: session } = useSession();
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!wallet) return null;

  const balance = Number(wallet.balance);

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(topUpAmount) })
      });

      if (response.ok) {
        setTopUpAmount('');
        setShowTopUpForm(false);
        onTopUp(); // Refresh wallet data
      }
    } catch (error) {
      console.error('Top-up failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 rounded-3xl text-white shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] mt-8">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12 group-hover:scale-125 transition-transform duration-1000 delay-200"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white rounded-full group-hover:scale-110 transition-transform duration-1000 delay-100"></div>
      </div>

      {/* Glowing Border Effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-colors duration-300">
              <Wallet className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">المحفظة الإلكترونية</h3>
              <p className="text-white/80 text-sm">الرصيد المتاح للاستخدام</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/60">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="text-xs font-medium">نشط</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 sm:gap-0">
          <div className="space-y-2 text-center sm:text-right w-full sm:w-auto">
            <div className="flex items-baseline gap-2 justify-center sm:justify-start">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{balance.toLocaleString()}</span>
              <span className="text-base sm:text-lg font-medium text-white/80">جنية</span>
            </div>
            <div className="flex items-center gap-2 text-white/70 justify-center sm:justify-start">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">متاح للاستخدام الفوري</span>
            </div>
          </div>

          <button
            onClick={() => setShowTopUpForm(!showTopUpForm)}
            className="group/btn relative overflow-hidden bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-white/30 hover:border-white/50 w-full sm:w-auto min-h-[48px]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center gap-2 justify-center">
              <Zap className="h-4 w-4 group-hover/btn:rotate-12 transition-transform duration-300" />
              <span className="text-sm sm:text-base">{showTopUpForm ? 'إخفاء الشحن' : 'شحن الرصيد'}</span>
            </div>
          </button>
        </div>

        {/* Top-up Form */}
        {showTopUpForm && (
          <div className="mt-6 pt-6 border-t border-white/20 animate-fade-in-up">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                شحن الرصيد
              </h4>

              <div className="space-y-4 mb-6">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/80 mb-2">رقم المحفظة للتحويل إليها:</p>
                  <p className="text-xl font-bold font-mono">01026454497</p>
                  <p className="text-xs text-white/70 mt-1">قم بتحويل المبلغ من رقمك المسجل إلى هذا الرقم</p>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-white/80 mb-2">رقمك المسجل:</p>
                  <p className="text-lg font-bold font-mono">{session?.user?.phoneNumber || 'غير محدد'}</p>
                  <p className="text-xs text-white/70 mt-1">تأكد من التحويل من هذا الرقم</p>
                </div>
              </div>

              <form onSubmit={handleTopUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    المبلغ (جنيه مصري)
                  </label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="أدخل المبلغ"
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                    required
                    min="1"
                    step="0.01"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !topUpAmount}
                    className="flex-1 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 disabled:hover:scale-100 border border-white/30 hover:border-white/50"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : 'تأكيد الشحن'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTopUpForm(false);
                      setTopUpAmount('');
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Balance Status Indicator */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/70">
              <div className={`w-2 h-2 rounded-full ${balance > 100 ? 'bg-green-400' : balance > 50 ? 'bg-yellow-400' : 'bg-red-400'} animate-pulse`}></div>
              <span>
                {balance > 100 ? 'رصيد ممتاز' : balance > 50 ? 'رصيد جيد' : 'رصيد منخفض'}
              </span>
            </div>
            <div className="text-white/60">
              آخر تحديث: الآن
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletSection;
