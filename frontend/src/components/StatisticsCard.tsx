import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { transactionAPI, TransactionResponse } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export default function StatisticsCard() {
  const [currentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyTransactions();
  }, [currentDate]);

  const loadMonthlyTransactions = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await transactionAPI.getMonthly(year, month);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load monthly transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // 총 수입/지출 계산
  const totalIncome = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // 카테고리별 지출 (결제수단별로 그룹화)
  const expenseByPaymentMethod = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      const method = t.paymentMethod;
      acc[method] = (acc[method] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseByPaymentMethod).map(([name, value]) => ({
    name,
    value,
  }));

  // 일별 수입/지출 (최근 7일)
  const dailyData: Record<string, { income: number; expense: number }> = {};
  transactions.forEach((t) => {
    const date = t.transactionDate;
    if (!dailyData[date]) {
      dailyData[date] = { income: 0, expense: 0 };
    }
    if (t.type === 'INCOME') {
      dailyData[date].income += t.amount;
    } else {
      dailyData[date].expense += t.amount;
    }
  });

  const barData = Object.entries(dailyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      수입: data.income,
      지출: data.expense,
    }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>총 수입</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              +{totalIncome.toLocaleString()} 원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>총 지출</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              -{totalExpense.toLocaleString()} 원
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>잔액</CardDescription>
            <CardTitle
              className={`text-2xl ${
                balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {balance >= 0 ? '+' : ''}
              {balance.toLocaleString()} 원
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 결제수단별 지출 (Pie Chart) */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>결제수단별 지출</CardTitle>
              <CardDescription>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString() + ' 원'} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 일별 수입/지출 (Bar Chart) */}
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>일별 수입/지출</CardTitle>
              <CardDescription>최근 7일</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString() + ' 원'} />
                  <Legend />
                  <Bar dataKey="수입" fill="#10b981" />
                  <Bar dataKey="지출" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 거래 통계 */}
      <Card>
        <CardHeader>
          <CardTitle>거래 통계</CardTitle>
          <CardDescription>
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">총 거래 건수</p>
              <p className="text-2xl font-bold">{transactions.length}건</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">수입 건수</p>
              <p className="text-2xl font-bold text-green-600">
                {transactions.filter((t) => t.type === 'INCOME').length}건
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">지출 건수</p>
              <p className="text-2xl font-bold text-red-600">
                {transactions.filter((t) => t.type === 'EXPENSE').length}건
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">평균 지출</p>
              <p className="text-2xl font-bold">
                {transactions.filter((t) => t.type === 'EXPENSE').length > 0
                  ? (
                      totalExpense / transactions.filter((t) => t.type === 'EXPENSE').length
                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })
                  : 0}
                원
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
