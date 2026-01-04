import { useState, useEffect } from 'react';
import { TransactionResponse, transactionAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateTime } from 'luxon';

interface MonthlyCalendarProps {
  onDateClick?: (date: DateTime, transactions: TransactionResponse[]) => void;
}

const KOREA_TIMEZONE = 'Asia/Seoul';

export default function MonthlyCalendar({ onDateClick }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(DateTime.now().setZone(KOREA_TIMEZONE));
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthlyTransactions();
  }, [currentDate]);

  const loadMonthlyTransactions = async () => {
    setLoading(true);
    try {
      const year = currentDate.year;
      const month = currentDate.month;
      const response = await transactionAPI.getMonthly(year, month);
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to load monthly transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(currentDate.minus({ months: 1 }));
  };

  const nextMonth = () => {
    setCurrentDate(currentDate.plus({ months: 1 }));
  };

  const getDaysInMonth = () => {
    const year = currentDate.year;
    const month = currentDate.month;

    // 이번 달 1일
    const firstDay = DateTime.fromObject({ year, month, day: 1 }, { zone: KOREA_TIMEZONE });
    // 이번 달의 총 일수
    const daysInMonth = currentDate.daysInMonth || 0;
    // 1일의 요일 (0: 일요일, 6: 토요일)
    const startDayOfWeek = firstDay.weekday % 7; // luxon은 1(월)~7(일), JS는 0(일)~6(토)

    const days: (DateTime | null)[] = [];

    // 이전 달의 빈 칸 추가
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // 이번 달의 날짜 추가
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(DateTime.fromObject({ year, month, day: i }, { zone: KOREA_TIMEZONE }));
    }

    return days;
  };

  const getTransactionsForDate = (date: DateTime | null) => {
    if (!date) return [];
    // Luxon DateTime을 YYYY-MM-DD 형식으로 변환
    const dateStr = date.toFormat('yyyy-MM-dd');
    return transactions.filter(
      (t) => t.transactionDate === dateStr
    );
  };

  const calculateDayTotals = (date: DateTime | null) => {
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
  const today = DateTime.now().setZone(KOREA_TIMEZONE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {currentDate.year}년 {currentDate.month}월
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
              // 오늘 날짜 비교 (년, 월, 일만 비교)
              const isToday = date.hasSame(today, 'day');

              return (
                <button
                  key={date.toISO() || idx}
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
                        date.weekday === 7 // luxon: 7 = 일요일
                          ? 'text-red-600'
                          : date.weekday === 6 // 6 = 토요일
                          ? 'text-blue-600'
                          : ''
                      }`}
                    >
                      {date.day}
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
