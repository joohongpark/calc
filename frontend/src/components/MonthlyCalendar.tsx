import { useState, useEffect } from 'react';
import { TransactionResponse, transactionAPI } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CalendarDayButton } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { DateTime } from 'luxon';
import { DayButton } from 'react-day-picker';
import { PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCurrencySymbol } from '@/lib/currencyUtils';

interface MonthlyCalendarProps {
  onDateClick?: (date: DateTime, transactions: TransactionResponse[]) => void;
  onAddTransaction?: (date: DateTime) => void;
}

const KOREA_TIMEZONE = 'Asia/Seoul';

export default function MonthlyCalendar({ onDateClick, onAddTransaction }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(DateTime.now().setZone(KOREA_TIMEZONE));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  const getTransactionsForDate = (date: Date) => {
    // JavaScript Date를 YYYY-MM-DD 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return transactions.filter((t) => t.transactionDate === dateStr);
  };

  const calculateDayTotals = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    const income = dayTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expense };
  };

  const handleMonthChange = (date: Date | undefined) => {
    if (date) {
      const luxonDate = DateTime.fromJSDate(date).setZone(KOREA_TIMEZONE);
      setCurrentDate(luxonDate);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    const luxonDate = DateTime.fromJSDate(date).setZone(KOREA_TIMEZONE);
    const dayTransactions = getTransactionsForDate(date);
    onDateClick?.(luxonDate, dayTransactions);
  };

  const handleAddTransaction = () => {
    if (selectedDate) {
      const luxonDate = DateTime.fromJSDate(selectedDate).setZone(KOREA_TIMEZONE);
      onAddTransaction?.(luxonDate);
    }
  };

  const selectedDateTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

  return (
    <Card className="w-full py-4">
      <CardHeader className="px-4">
        <CardTitle>
          {currentDate.year}년 {currentDate.month}월
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 캘린더 영역 */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate.toJSDate()}
                onMonthChange={handleMonthChange}
                className="bg-transparent p-0 w-full"
                classNames={{
                  root: "w-full",
                  month: "w-full space-y-4",
                  weeks: "w-full",
                  week: "w-full grid grid-cols-7 gap-1",
                  weekdays: "grid grid-cols-7 gap-1",
                  weekday: "w-full text-center",
                  day: "w-full",
                }}
                formatters={{
                  formatWeekdayName: (date) => {
                    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                    return weekdays[date.getDay()];
                  },
                }}
                components={{
                  DayButton: ({ day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) => {
                    const dayTransactions = getTransactionsForDate(day.date);
                    const { income, expense } = calculateDayTotals(day.date);
                    const hasTransactions = dayTransactions.length > 0;
                    const isSelected = selectedDate &&
                      day.date.getFullYear() === selectedDate.getFullYear() &&
                      day.date.getMonth() === selectedDate.getMonth() &&
                      day.date.getDate() === selectedDate.getDate();

                    return (
                      <CalendarDayButton
                        day={day}
                        modifiers={modifiers}
                        {...props}
                        onClick={() => handleDayClick(day.date)}
                        className={cn(
                          "h-auto min-h-[80px] w-full p-1",
                          hasTransactions ? 'cursor-pointer hover:bg-muted' : 'cursor-default',
                          isSelected && '!bg-primary/10 !text-primary'
                        )}
                      >
                        <div className="flex flex-col items-center gap-1 w-full h-full">
                          <span className="text-sm font-medium">{day.date.getDate()}</span>
                          {hasTransactions && (
                            <div className="flex flex-col gap-0.5 text-[10px] w-full">
                              {income > 0 && (
                                <div className="text-green-600 font-semibold truncate text-center">
                                  +{income.toLocaleString()}
                                </div>
                              )}
                              {expense > 0 && (
                                <div className="text-red-600 font-semibold truncate text-center">
                                  -{expense.toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CalendarDayButton>
                    );
                  },
                }}
              />
            )}
          </div>

          {/* 거래 내역 영역 - 큰 화면에서는 오른쪽에, 작은 화면에서는 아래에 */}
          <div className="lg:w-80 lg:border-l lg:pl-6 border-t lg:border-t-0 pt-4 lg:pt-0">
            <div className="flex w-full items-center justify-between px-1 mb-3">
              <div className="text-sm font-medium">
                {selectedDate
                  ? DateTime.fromJSDate(selectedDate).setZone(KOREA_TIMEZONE).toFormat('yyyy년 M월 d일')
                  : '날짜를 선택하세요'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                title="거래 추가"
                onClick={handleAddTransaction}
              >
                <PlusIcon className="size-4" />
                <span className="sr-only">거래 추가</span>
              </Button>
            </div>
            <div className="flex w-full flex-col gap-2 max-h-[500px] overflow-y-auto">
              {selectedDateTransactions.length === 0 ? (
                <div className="text-sm text-muted-foreground px-2">거래 내역이 없습니다.</div>
              ) : (
                selectedDateTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`relative rounded-md p-2 pl-6 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                      transaction.type === 'INCOME'
                        ? 'bg-green-50 after:bg-green-600'
                        : 'bg-red-50 after:bg-red-600'
                    } after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full`}
                    onClick={() => {
                      const luxonDate = DateTime.fromJSDate(selectedDate!).setZone(KOREA_TIMEZONE);
                      onDateClick?.(luxonDate, [transaction]);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{transaction.description}</div>
                      <div
                        className={`font-semibold ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {transaction.amount.toLocaleString()}{getCurrencySymbol(transaction.currency)}
                      </div>
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {transaction.paymentMethod}
                      {transaction.tags && ` • ${JSON.parse(transaction.tags).join(', ')}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
