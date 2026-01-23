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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '거래 수정' : '거래 상세'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 거래 유형 */}
          <div className="space-y-2">
            <Label htmlFor="type">거래 유형</Label>
            {isEditing ? (
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })
                }
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="INCOME">수입</option>
                <option value="EXPENSE">지출</option>
              </select>
            ) : (
              <div
                className={`px-4 py-2 rounded-lg text-center font-semibold ${
                  transaction.type === 'INCOME'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {transaction.type === 'INCOME' ? '수입' : '지출'}
              </div>
            )}
          </div>

          {/* 금액 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
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
                required
              />
            ) : (
              <div className="text-2xl font-bold">
                {transaction.amount.toLocaleString()}{getCurrencySymbol(transaction.currency)}
              </div>
            )}
          </div>

          {/* 사용처 */}
          <div className="space-y-2">
            <Label htmlFor="description">사용처</Label>
            {isEditing ? (
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            ) : (
              <div className="text-lg">{transaction.description}</div>
            )}
          </div>

          {/* 결제수단 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="paymentMethod">결제수단</Label>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddMethodDialogOpen(true)}
                >
                  추가
                </Button>
              )}
            </div>
            {isEditing ? (
              paymentMethods.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  결제수단을 불러오는 중이거나 등록된 결제수단이 없습니다.
                </div>
              ) : (
                <select
                  id="paymentMethod"
                  value={formData.paymentMethodId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethodId: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
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
              <div>{getPaymentMethodName(transaction.paymentMethodId)}</div>
            )}
          </div>

          {/* 거래 날짜 */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate">거래 날짜</Label>
            {isEditing ? (
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  setFormData({ ...formData, transactionDate: e.target.value })
                }
              />
            ) : (
              <div>{formatDateStringToKorean(transaction.transactionDate)}</div>
            )}
          </div>

          {/* 태그 */}
          {(isEditing || transaction.tags) && (
            <div className="space-y-2">
              <Label htmlFor="tags">태그</Label>
              {isEditing ? (
                <Input
                  id="tags"
                  placeholder="식비, 외식"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              ) : (
                <div>
                  {(() => {
                    if (!transaction.tags) return '-';
                    try {
                      const parsed = JSON.parse(transaction.tags);
                      return Array.isArray(parsed) ? parsed.join(', ') : '-';
                    } catch (error) {
                      console.error('Failed to parse tags:', error);
                      return '-';
                    }
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 추가 옵션들 */}
          {(isEditing ||
            transaction.originalAmount ||
            transaction.discountRate ||
            transaction.exchangeRate) && (
            <>
              {(isEditing || transaction.originalAmount) && (
                <div className="space-y-2">
                  <Label htmlFor="originalAmount">원금</Label>
                  {isEditing ? (
                    <Input
                      id="originalAmount"
                      type="number"
                      step="0.01"
                      min="0"
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
                    />
                  ) : (
                    <div>{transaction.originalAmount?.toLocaleString() || '-'}</div>
                  )}
                </div>
              )}

              {(isEditing || transaction.discountRate) && (
                <div className="space-y-2">
                  <Label htmlFor="discountRate">할인율 (%)</Label>
                  {isEditing ? (
                    <Input
                      id="discountRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
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
                    />
                  ) : (
                    <div>{transaction.discountRate ? `${transaction.discountRate}%` : '-'}</div>
                  )}
                </div>
              )}

              {(isEditing || transaction.exchangeRate) && (
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate">환율</Label>
                  {isEditing ? (
                    <Input
                      id="exchangeRate"
                      type="number"
                      step="0.0001"
                      min="0"
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
                    />
                  ) : (
                    <div>{transaction.exchangeRate?.toFixed(4) || '-'}</div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 등록 시간 */}
          <div className="space-y-2">
            <Label>등록 시간 (한국 시간)</Label>
            <div className="text-sm text-muted-foreground">
              {formatKSTDateTime(transaction.createdAt)}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-4">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  수정
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? '삭제 중...' : '삭제'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1"
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>결제수단 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newMethodName">결제수단 이름</Label>
              <Input
                id="newMethodName"
                placeholder="예: 신한카드, 현금"
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
                autoFocus
              />
              {errorMessage && (
                <p className="text-sm text-red-600">{errorMessage}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddDialog}
                className="flex-1"
                disabled={addMethodLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleAddMethod}
                disabled={addMethodLoading}
                className="flex-1"
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
