import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import TransactionDialog from '@/components/TransactionDialog';
import TransactionDetailDialog from '@/components/TransactionDetailDialog';
import { TransactionInput } from '@/components/TransactionInput';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import InlineTagAdder from '@/components/InlineTagAdder';
import { transactionAPI, TransactionResponse } from '@/lib/api';
import { DateTime } from 'luxon';
import { getCurrencySymbol } from '@/lib/currencyUtils';
import { formatDateStringToKorean } from '@/lib/dateUtils';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { parseTags } from '@/lib/tagColors';
import { useTagColors } from '@/hooks/useTagColors';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getPaymentMethodName } = usePaymentMethods();
  const { getColorClass } = useTagColors();
  const [isIncomeMode, setIsIncomeMode] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateTransactions, setSelectedDateTransactions] = useState<TransactionResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [addTransactionDate, setAddTransactionDate] = useState<DateTime | null>(null);
  const [tagAdderOpenId, setTagAdderOpenId] = useState<number | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await transactionAPI.getList(0, 10);
      setTransactions(response.data.content);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTransactionSuccess = () => {
    loadTransactions();
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDateClick = (date: DateTime, dayTransactions: TransactionResponse[]) => {
    if (dayTransactions.length > 0) {
      setSelectedDate(date);
      setSelectedDateTransactions(dayTransactions);
    }
  };

  const handleTransactionClick = (transaction: TransactionResponse) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  const handleDetailSuccess = () => {
    loadTransactions();
    setRefreshTrigger(prev => prev + 1);
    setSelectedDate(null);
    setSelectedDateTransactions([]);
  };

  const handleAddTransactionClick = (date: DateTime) => {
    setAddTransactionDate(date);
    setAddTransactionDialogOpen(true);
  };

  const handleAddTransactionSuccess = () => {
    loadTransactions();
    setRefreshTrigger(prev => prev + 1);
    setAddTransactionDialogOpen(false);
  };

  const handleTagAdderSuccess = () => {
    setTagAdderOpenId(null);
    handleTransactionSuccess();
  };

  const TagDots = ({ transaction }: { transaction: TransactionResponse }) => {
    const anchorRef = useRef<HTMLSpanElement>(null);
    const tags = parseTags(transaction.tags);
    if (tags.length > 0) {
      return (
        <>
          {tags.map((tag) => (
            <span key={tag} className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${getColorClass(tag)}`} title={tag} />
          ))}
        </>
      );
    }
    return (
      <>
        <span
          ref={anchorRef}
          className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-gray-300 border-dashed cursor-pointer hover:border-primary hover:bg-primary/10 transition-colors"
          title="태그 추가"
          onClick={(e) => {
            e.stopPropagation();
            setTagAdderOpenId(transaction.id);
          }}
        />
        {tagAdderOpenId === transaction.id && (
          <InlineTagAdder
            transaction={transaction}
            anchorRef={anchorRef}
            onSuccess={handleTagAdderSuccess}
            onClose={() => setTagAdderOpenId(null)}
          />
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">가계부</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.username}님, 환영합니다!</p>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/statistics')} className="text-xs sm:text-sm">
              통계
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
              로그아웃
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{isAutoMode ? '빠른 입력 모드' : '일반 입력 모드'}</CardTitle>
              <div className="flex items-center space-x-2">
                <Label htmlFor="income-switch">지출</Label>
                <Switch
                  id="income-switch"
                  checked={isIncomeMode}
                  onCheckedChange={setIsIncomeMode}
                />
                <Label htmlFor="income-switch">수입</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <TransactionInput
              type={isIncomeMode ? "INCOME" : "EXPENSE"}
              onSuccess={handleTransactionSuccess}
              onModeChange={setIsAutoMode}
            />
          </CardContent>
        </Card>

        {/* Monthly Calendar */}
        <MonthlyCalendar
          onDateClick={handleDateClick}
          onAddTransaction={handleAddTransactionClick}
          refreshTrigger={refreshTrigger}
        />

        {/* Selected Date Transactions */}
        {selectedDate && selectedDateTransactions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {selectedDate.toFormat('yyyy년 M월 d일')} 거래 내역
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                총 {selectedDateTransactions.length}건의 거래
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {selectedDateTransactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => handleTransactionClick(transaction)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{getPaymentMethodName(transaction.paymentMethodId)}</span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          {<TagDots transaction={transaction} />}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-base sm:text-lg font-semibold ${transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                          }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {transaction.amount.toLocaleString()}{getCurrencySymbol(transaction.currency)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">최근 내역</CardTitle>
            <CardDescription className="text-xs sm:text-sm">최근 거래 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8 text-sm">로딩 중...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 text-sm">
                아직 거래 내역이 없습니다
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {transactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => handleTransactionClick(transaction)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate">{getPaymentMethodName(transaction.paymentMethodId)} · {formatDateStringToKorean(transaction.transactionDate)}</span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          {<TagDots transaction={transaction} />}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-base sm:text-lg font-semibold ${transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                          }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {transaction.amount.toLocaleString()}{getCurrencySymbol(transaction.currency)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={isIncomeMode ? "INCOME" : "EXPENSE"}
        onSuccess={handleTransactionSuccess}
      />

      {/* Transaction Detail Dialog */}
      {selectedTransaction && (
        <TransactionDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          transaction={selectedTransaction}
          onSuccess={handleDetailSuccess}
        />
      )}

      {/* Add Transaction Dialog (from Calendar) */}
      <TransactionDialog
        open={addTransactionDialogOpen}
        onOpenChange={setAddTransactionDialogOpen}
        type={isIncomeMode ? "INCOME" : "EXPENSE"}
        onSuccess={handleAddTransactionSuccess}
        initialDate={addTransactionDate?.toFormat('yyyy-MM-dd')}
      />
    </div>
  );
}
