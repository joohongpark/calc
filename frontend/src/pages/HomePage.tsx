import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import TransactionDialog from '@/components/TransactionDialog';
import { transactionAPI, TransactionResponse } from '@/lib/api';

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

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
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">가계부</h1>
            <p className="text-muted-foreground">{user?.username}님, 환영합니다!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 입력</CardTitle>
            <CardDescription>수입 또는 지출을 기록하세요</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              className="flex-1"
              size="lg"
              onClick={() => setIncomeDialogOpen(true)}
            >
              수입 추가
            </Button>
            <Button
              className="flex-1"
              variant="outline"
              size="lg"
              onClick={() => setExpenseDialogOpen(true)}
            >
              지출 추가
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>최근 내역</CardTitle>
            <CardDescription>최근 거래 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">로딩 중...</p>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                아직 거래 내역이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.paymentMethod} · {new Date(transaction.transactionDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          transaction.type === 'INCOME'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {transaction.amount.toLocaleString()} {transaction.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Dialogs */}
      <TransactionDialog
        open={incomeDialogOpen}
        onOpenChange={setIncomeDialogOpen}
        type="INCOME"
        onSuccess={handleTransactionSuccess}
      />
      <TransactionDialog
        open={expenseDialogOpen}
        onOpenChange={setExpenseDialogOpen}
        type="EXPENSE"
        onSuccess={handleTransactionSuccess}
      />
    </div>
  );
}
