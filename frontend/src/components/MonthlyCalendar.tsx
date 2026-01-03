import { useState, useEffect } from 'react';
import { TransactionResponse, transactionAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyCalendarProps {
  onDateClick?: (date: Date, transactions: TransactionResponse[]) => void;
}

export default function MonthlyCalendar({ onDateClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // 이전 달의 빈 칸 추가
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 이번 달의 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getTransactionsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return transactions.filter(
      (t) => t.transactionDate === dateStr
    );
  };

  const calculateDayTotals = (date: Date | null) => {
    const dayTransactions = getTransactionsForDate(date);
    const income = dayTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, total: income - expense };
  };

  const days = getDaysInMonth();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* 요일 헤더 */}
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div
                key={day}
                className={`text-center font-semibold text-sm py-2 ${
                  idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : ''
                }`}
              >
                {day}
              </div>
            ))}

            {/* 날짜 셀 */}
            {days.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dayTransactions = getTransactionsForDate(date);
              const { income, expense } = calculateDayTotals(date);
              const isToday =
                date.toDateString() === new Date().toDateString();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => onDateClick?.(date, dayTransactions)}
                  className={`
                    aspect-square p-1 border rounded-lg hover:bg-muted/50 transition-colors
                    ${isToday ? 'border-primary border-2' : 'border-border'}
                    ${dayTransactions.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className="h-full flex flex-col">
                    <div
                      className={`text-sm font-medium ${
                        date.getDay() === 0
                          ? 'text-red-600'
                          : date.getDay() === 6
                          ? 'text-blue-600'
                          : ''
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {dayTransactions.length > 0 && (
                      <div className="flex-1 flex flex-col justify-center text-xs space-y-0.5">
                        {income > 0 && (
                          <div className="text-green-600 font-semibold truncate">
                            +{income.toLocaleString()}
                          </div>
                        )}
                        {expense > 0 && (
                          <div className="text-red-600 font-semibold truncate">
                            -{expense.toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
