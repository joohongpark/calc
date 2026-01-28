import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { transactionAPI, TransactionUpdateRequest, TransactionResponse, paymentMethodAPI, PaymentMethodResponse } from '@/lib/api';
import { formatKSTDateTime, formatDateStringToKorean } from '@/lib/dateUtils';
import { getCurrencySymbol } from '@/lib/currencyUtils';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionResponse;
  onSuccess?: () => void;
}

export default function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
  onSuccess,
}: TransactionDetailDialogProps) {
  const { getPaymentMethodName } = usePaymentMethods();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [addMethodLoading, setAddMethodLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<TransactionUpdateRequest>({
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    paymentMethodId: transaction.paymentMethodId,
    currency: transaction.currency,
    originalAmount: transaction.originalAmount,
    discountRate: transaction.discountRate,
    exchangeRate: transaction.exchangeRate,
    tags: transaction.tags,
    transactionDate: transaction.transactionDate,
  });

  // 태그를 문자열 형태로 관리 (JSON 파싱)
  const [tagsInput, setTagsInput] = useState(() => {
    if (!transaction.tags) return '';
    try {
      const parsed = JSON.parse(transaction.tags);
      return Array.isArray(parsed) ? parsed.join(', ') : '';
    } catch (error) {
      console.error('Failed to parse tags:', error);
      return '';
    }
  });

  // transaction prop이 변경될 때마다 상태 업데이트
  useEffect(() => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      paymentMethodId: transaction.paymentMethodId,
      currency: transaction.currency,
      originalAmount: transaction.originalAmount,
      discountRate: transaction.discountRate,
      exchangeRate: transaction.exchangeRate,
      tags: transaction.tags,
      transactionDate: transaction.transactionDate,
    });

    // 태그 입력 상태도 업데이트
    if (!transaction.tags) {
      setTagsInput('');
    } else {
      try {
        const parsed = JSON.parse(transaction.tags);
        setTagsInput(Array.isArray(parsed) ? parsed.join(', ') : '');
      } catch (error) {
        console.error('Failed to parse tags:', error);
        setTagsInput('');
      }
    }

    // 다이얼로그가 열릴 때 편집 모드 해제
    setIsEditing(false);
  }, [transaction]);

  // 결제수단 목록 로드
  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodAPI.getList();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleUpdate = async () => {
    if (loading) return; // Race condition 방지

    setLoading(true);
    try {
      // 변경된 필드만 추출
      const updates: TransactionUpdateRequest = {};

      if (formData.type !== transaction.type) {
        updates.type = formData.type;
      }
      if (formData.amount !== transaction.amount) {
        updates.amount = formData.amount;
      }
      if (formData.description !== transaction.description) {
        updates.description = formData.description;
      }
      if (formData.paymentMethodId !== transaction.paymentMethodId) {
        updates.paymentMethodId = formData.paymentMethodId;
      }
      if (formData.currency !== transaction.currency) {
        updates.currency = formData.currency;
      }
      if (formData.originalAmount !== transaction.originalAmount) {
        updates.originalAmount = formData.originalAmount;
      }
      if (formData.discountRate !== transaction.discountRate) {
        updates.discountRate = formData.discountRate;
      }
      if (formData.exchangeRate !== transaction.exchangeRate) {
        updates.exchangeRate = formData.exchangeRate;
      }
      if (formData.transactionDate !== transaction.transactionDate) {
        updates.transactionDate = formData.transactionDate;
      }

      // 태그 변경 확인
      const originalTags = transaction.tags
        ? (() => {
            try {
              const parsed = JSON.parse(transaction.tags);
              return Array.isArray(parsed) ? parsed.join(', ') : '';
            } catch {
              return '';
            }
          })()
        : '';

      if (tagsInput !== originalTags) {
        updates.tags = tagsInput
          ? JSON.stringify(tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t))
          : undefined;
      }

      // 변경된 필드가 없으면 요청하지 않음
      if (Object.keys(updates).length === 0) {
        alert('변경된 내용이 없습니다.');
        setLoading(false);
        return;
      }

      await transactionAPI.update(transaction.id, updates);
      alert('거래가 수정되었습니다!');
      onSuccess?.();
      setIsEditing(false);
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '거래 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return; // Race condition 방지

    if (!confirm('정말로 이 거래를 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      await transactionAPI.delete(transaction.id);
      alert('거래가 삭제되었습니다!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      alert(error.response?.data?.message || '거래 삭제에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      paymentMethodId: transaction.paymentMethodId,
      currency: transaction.currency,
      originalAmount: transaction.originalAmount,
      discountRate: transaction.discountRate,
      exchangeRate: transaction.exchangeRate,
      tags: transaction.tags,
      transactionDate: transaction.transactionDate,
    });
    try {
      const parsed = transaction.tags ? JSON.parse(transaction.tags) : [];
      setTagsInput(Array.isArray(parsed) ? parsed.join(', ') : '');
    } catch (error) {
      console.error('Failed to parse tags:', error);
      setTagsInput('');
    }
    onOpenChange(false);
  };

  const handleAddMethod = async () => {
    if (!newMethodName.trim()) {
      setErrorMessage('결제수단 이름을 입력해주세요.');
      return;
    }

    // 중복 확인
    const isDuplicate = paymentMethods.some(
      (method) => method.name.toLowerCase() === newMethodName.trim().toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage('이미 존재하는 결제수단입니다.');
      return;
    }

    setAddMethodLoading(true);
    setErrorMessage('');

    try {
      await paymentMethodAPI.create({ name: newMethodName.trim() });
      // 결제수단 목록 다시 불러오기
      await loadPaymentMethods();
      // 모달 닫기 및 초기화
      setAddMethodDialogOpen(false);
      setNewMethodName('');
      alert('결제수단이 추가되었습니다!');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || '결제수단 추가에 실패했습니다.');
    } finally {
      setAddMethodLoading(false);
    }
  };

  const handleCloseAddDialog = () => {
    setAddMethodDialogOpen(false);
    setNewMethodName('');
    setErrorMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-semibold">
            {isEditing ? '거래 수정' : '거래 상세'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* 거래 유형 토글 버튼 */}
          <div className="flex gap-3 p-1 bg-muted/50 rounded-lg">
            <Button
              type="button"
              variant={formData.type === 'INCOME' ? 'default' : 'ghost'}
              className={`flex-1 h-11 font-medium transition-all ${
                formData.type === 'INCOME'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                  : 'hover:bg-green-50 text-muted-foreground hover:text-green-700'
              }`}
              onClick={() => isEditing && setFormData({ ...formData, type: 'INCOME' })}
              disabled={!isEditing}
            >
              수입
            </Button>
            <Button
              type="button"
              variant={formData.type === 'EXPENSE' ? 'default' : 'ghost'}
              className={`flex-1 h-11 font-medium transition-all ${
                formData.type === 'EXPENSE'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                  : 'hover:bg-red-50 text-muted-foreground hover:text-red-700'
              }`}
              onClick={() => isEditing && setFormData({ ...formData, type: 'EXPENSE' })}
              disabled={!isEditing}
            >
              지출
            </Button>
          </div>

          {/* 금액 - 하이라이트 섹션 */}
          <div className={`space-y-3 p-4 rounded-lg border-2 transition-colors ${
            formData.type === 'INCOME'
              ? 'bg-green-50/50 border-green-200'
              : 'bg-red-50/50 border-red-200'
          }`}>
            <Label htmlFor="amount" className="text-sm font-semibold text-muted-foreground">금액</Label>
            {isEditing ? (
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount ?? ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  setFormData({ ...formData, amount: isNaN(value) ? 0 : value });
                }}
                className="text-3xl font-bold h-14 border-2 focus:ring-2 focus:ring-offset-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                required
              />
            ) : (
              <div className={`text-4xl font-bold ${
                formData.type === 'INCOME' ? 'text-green-700' : 'text-red-700'
              }`}>
                {transaction.amount.toLocaleString()}{getCurrencySymbol(transaction.currency)}
              </div>
            )}
          </div>

          {/* 기본 정보 그룹 */}
          <div className="space-y-5">
            {/* 사용처 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">사용처</Label>
              {isEditing ? (
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="h-11 text-base"
                  required
                />
              ) : (
                <div className="text-lg font-medium px-1">{transaction.description}</div>
              )}
            </div>

            {/* 결제수단 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="paymentMethod" className="text-sm font-semibold">결제수단</Label>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddMethodDialogOpen(true)}
                    className="h-8 text-xs font-medium"
                  >
                    + 추가
                  </Button>
                )}
              </div>
              {isEditing ? (
                paymentMethods.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-3 py-2 bg-muted/30 rounded-md">
                    결제수단을 불러오는 중이거나 등록된 결제수단이 없습니다.
                  </div>
                ) : (
                  <select
                    id="paymentMethod"
                    value={formData.paymentMethodId ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentMethodId: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 py-2 text-base border-2 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                    required
                  >
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="text-base font-medium px-1">{getPaymentMethodName(transaction.paymentMethodId)}</div>
              )}
            </div>

            {/* 거래 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="transactionDate" className="text-sm font-semibold">거래 날짜</Label>
              {isEditing ? (
                <Input
                  id="transactionDate"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionDate: e.target.value })
                  }
                  className="h-11 text-base"
                />
              ) : (
                <div className="text-base font-medium px-1">{formatDateStringToKorean(transaction.transactionDate)}</div>
              )}
            </div>

            {/* 태그 */}
            {(isEditing || transaction.tags) && (
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-semibold">태그</Label>
                {isEditing ? (
                  <Input
                    id="tags"
                    placeholder="식비, 외식, 쇼핑"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="h-11 text-base"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      if (!transaction.tags) return <span className="text-sm text-muted-foreground px-1">태그 없음</span>;
                      try {
                        const parsed = JSON.parse(transaction.tags);
                        if (!Array.isArray(parsed) || parsed.length === 0) {
                          return <span className="text-sm text-muted-foreground px-1">태그 없음</span>;
                        }
                        return parsed.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {tag}
                          </span>
                        ));
                      } catch (error) {
                        console.error('Failed to parse tags:', error);
                        return <span className="text-sm text-muted-foreground px-1">태그 없음</span>;
                      }
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 추가 옵션들 - 접을 수 있는 섹션 */}
          {(isEditing ||
            transaction.originalAmount ||
            transaction.discountRate ||
            transaction.exchangeRate) && (
            <div className="space-y-5 pt-4 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">추가 정보</h3>

              {(isEditing || transaction.originalAmount) && (
                <div className="space-y-2">
                  <Label htmlFor="originalAmount" className="text-sm font-semibold">원금</Label>
                  {isEditing ? (
                    <Input
                      id="originalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="할인 전 금액"
                      value={formData.originalAmount ?? ''}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setFormData({ ...formData, originalAmount: undefined });
                        } else {
                          const value = parseFloat(e.target.value);
                          setFormData({
                            ...formData,
                            originalAmount: isNaN(value) ? undefined : value
                          });
                        }
                      }}
                      className="h-11 text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  ) : (
                    <div className="text-base font-medium px-1">{transaction.originalAmount?.toLocaleString() || '-'}</div>
                  )}
                </div>
              )}

              {(isEditing || transaction.discountRate) && (
                <div className="space-y-2">
                  <Label htmlFor="discountRate" className="text-sm font-semibold">할인율</Label>
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        id="discountRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={formData.discountRate ?? ''}
                        onChange={(e) => {
                          if (!e.target.value) {
                            setFormData({ ...formData, discountRate: undefined });
                          } else {
                            const value = parseFloat(e.target.value);
                            setFormData({
                              ...formData,
                              discountRate: isNaN(value) ? undefined : value
                            });
                          }
                        }}
                        className="h-11 text-base pr-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  ) : (
                    <div className="text-base font-medium px-1">{transaction.discountRate ? `${transaction.discountRate}%` : '-'}</div>
                  )}
                </div>
              )}

              {(isEditing || transaction.exchangeRate) && (
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate" className="text-sm font-semibold">환율</Label>
                  {isEditing ? (
                    <Input
                      id="exchangeRate"
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="1.0000"
                      value={formData.exchangeRate ?? ''}
                      onChange={(e) => {
                        if (!e.target.value) {
                          setFormData({ ...formData, exchangeRate: undefined });
                        } else {
                          const value = parseFloat(e.target.value);
                          setFormData({
                            ...formData,
                            exchangeRate: isNaN(value) ? undefined : value
                          });
                        }
                      }}
                      className="h-11 text-base [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                    />
                  ) : (
                    <div className="text-base font-medium px-1">{transaction.exchangeRate?.toFixed(4) || '-'}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 등록 시간 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">등록 시간</Label>
              <div className="text-sm text-muted-foreground font-medium">
                {formatKSTDateTime(transaction.createdAt)}
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-6 border-t">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 h-11 font-medium hover:bg-primary/5 hover:text-primary hover:border-primary transition-all"
                >
                  수정
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 h-11 font-medium shadow-sm transition-all hover:shadow-md"
                >
                  {loading ? '삭제 중...' : '삭제'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-11 font-medium"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 h-11 font-medium shadow-sm transition-all hover:shadow-md"
                >
                  {loading ? '저장 중...' : '저장'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      {/* 결제수단 추가 모달 */}
      <Dialog open={addMethodDialogOpen} onOpenChange={handleCloseAddDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">결제수단 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <Label htmlFor="newMethodName" className="text-sm font-semibold">결제수단 이름</Label>
              <Input
                id="newMethodName"
                placeholder="예: 신한카드, 현금, 토스페이"
                value={newMethodName}
                onChange={(e) => {
                  setNewMethodName(e.target.value);
                  setErrorMessage('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMethod();
                  }
                }}
                className="h-11 text-base"
                autoFocus
              />
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddDialog}
                className="flex-1 h-11 font-medium"
                disabled={addMethodLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleAddMethod}
                disabled={addMethodLoading}
                className="flex-1 h-11 font-medium shadow-sm transition-all hover:shadow-md"
              >
                {addMethodLoading ? '추가 중...' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
