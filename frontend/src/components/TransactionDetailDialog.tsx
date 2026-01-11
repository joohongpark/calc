import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { transactionAPI, TransactionRequest, TransactionResponse } from '@/lib/api';
import { formatKSTDateTime } from '@/lib/dateUtils';
import { getCurrencySymbol } from '@/lib/currencyUtils';

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
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<TransactionRequest>>({
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    paymentMethod: transaction.paymentMethod,
    currency: transaction.currency,
    originalAmount: transaction.originalAmount,
    discountRate: transaction.discountRate,
    exchangeRate: transaction.exchangeRate,
    tags: transaction.tags,
    transactionDate: transaction.transactionDate,
  });

  // 태그를 문자열 형태로 관리 (JSON 파싱)
  const [tagsInput, setTagsInput] = useState(
    transaction.tags ? JSON.parse(transaction.tags).join(', ') : ''
  );

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // 태그를 JSON 배열 문자열로 변환
      const tags = tagsInput
        ? JSON.stringify(tagsInput.split(',').map((t: string) => t.trim()).filter((t: string) => t))
        : undefined;

      await transactionAPI.update(transaction.id, { ...formData, tags } as TransactionRequest);
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
      paymentMethod: transaction.paymentMethod,
      currency: transaction.currency,
      originalAmount: transaction.originalAmount,
      discountRate: transaction.discountRate,
      exchangeRate: transaction.exchangeRate,
      tags: transaction.tags,
      transactionDate: transaction.transactionDate,
    });
    setTagsInput(transaction.tags ? JSON.parse(transaction.tags).join(', ') : '');
    onOpenChange(false);
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
            <Label>거래 유형</Label>
            <div
              className={`px-4 py-2 rounded-lg text-center font-semibold ${
                transaction.type === 'INCOME'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {transaction.type === 'INCOME' ? '수입' : '지출'}
            </div>
          </div>

          {/* 금액 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액</Label>
            {isEditing ? (
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) })
                }
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
            <Label htmlFor="paymentMethod">결제수단</Label>
            {isEditing ? (
              <Input
                id="paymentMethod"
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                required
              />
            ) : (
              <div>{transaction.paymentMethod}</div>
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
              <div>{new Date(transaction.transactionDate).toLocaleDateString('ko-KR')}</div>
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
                <div>{transaction.tags ? JSON.parse(transaction.tags).join(', ') : '-'}</div>
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
                      value={formData.originalAmount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          originalAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
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
                      value={formData.discountRate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountRate: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
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
                      value={formData.exchangeRate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          exchangeRate: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
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
    </Dialog>
  );
}
