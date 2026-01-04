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
import { transactionAPI, TransactionRequest } from '@/lib/api';
import { getCurrentKSTDate } from '@/lib/dateUtils';

/*
TransactionDialog 컴포넌트 프로퍼티
- open: boolean - 다이얼로그가 열려 있는지 여부
- onOpenChange: function - 다이얼로그 열림 상태 변경 시 콜백
- type: 'INCOME' | 'EXPENSE' - 거래 유형
- onSuccess: function (optional) - 거래 추가 성공 시 콜백
*/
interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'INCOME' | 'EXPENSE';
  onSuccess?: () => void;
}

type Step = 'amount' | 'description' | 'paymentMethod' | 'options';

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
}: TransactionDialogProps) {
  const [step, setStep] = useState<Step>('amount');
  const [formData, setFormData] = useState<Partial<TransactionRequest>>({
    type,
    currency: '원',
    transactionDate: getCurrentKSTDate(), // 한국 시간 기준 현재 날짜
  });
  const [tagsInput, setTagsInput] = useState(''); // 태그 입력용 별도 state

  const [loading, setLoading] = useState(false);

  const handleNext = (field: keyof TransactionRequest, value: any) => {
    setFormData({ ...formData, [field]: value });

    // 다음 단계로 이동
    if (step === 'amount') setStep('description');
    else if (step === 'description') setStep('paymentMethod');
    else if (step === 'paymentMethod') setStep('options');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 태그를 JSON 배열 문자열로 변환
      const tags = tagsInput
        ? JSON.stringify(tagsInput.split(',').map(t => t.trim()).filter(t => t))
        : undefined;

      await transactionAPI.create({ ...formData, tags } as TransactionRequest);
      alert('거래가 추가되었습니다!');
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      alert(error.response?.data?.message || '거래 추가에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('amount');
    setFormData({
      type,
      currency: 'KRW',
      transactionDate: getCurrentKSTDate(),
    });
    setTagsInput(''); // 태그 입력 초기화
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === 'description') { setStep('amount'); }
    else if (step === 'paymentMethod') { setStep('description'); }
    else if (step === 'options') { setStep('paymentMethod'); }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'INCOME' ? '수입' : '지출'} 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex gap-2">
            <div className={`h-2 flex-1 rounded ${step === 'amount' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded ${step === 'description' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded ${step === 'paymentMethod' ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded ${step === 'options' ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Step 1: Amount */}
          {step === 'amount' && (
            <AmountStep
              value={formData.amount}
              onNext={(value) => handleNext('amount', value)}
            />
          )}

          {/* Step 2: Description */}
          {step === 'description' && (
            <DescriptionStep
              value={formData.description}
              onNext={(value) => handleNext('description', value)}
              onBack={handleBack}
            />
          )}

          {/* Step 3: Payment Method */}
          {step === 'paymentMethod' && (
            <PaymentMethodStep
              value={formData.paymentMethod}
              onNext={(value) => handleNext('paymentMethod', value)}
              onBack={handleBack}
            />
          )}

          {/* Step 4: Options */}
          {step === 'options' && (
            <OptionsStep
              formData={formData}
              onChange={setFormData}
              tagsInput={tagsInput}
              onTagsChange={setTagsInput}
              onSubmit={handleSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Step 1: 금액 입력
function AmountStep({ value, onNext }: { value?: number; onNext: (value: number) => void }) {
  const [amount, setAmount] = useState(value?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onNext(numAmount);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-lg">금액을 입력하세요</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="10000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl h-16 text-center"
          autoFocus
          required
        />
      </div>
      <Button type="submit" className="w-full" size="lg">
        다음
      </Button>
    </form>
  );
}

// Step 2: 사용처 입력
function DescriptionStep({
  value,
  onNext,
  onBack,
}: {
  value?: string;
  onNext: (value: string) => void;
  onBack: () => void;
}) {
  const [description, setDescription] = useState(value || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onNext(description);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg">사용처를 입력하세요</Label>
        <Input
          id="description"
          placeholder="점심 식사"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-xl h-14"
          autoFocus
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button type="submit" className="flex-1" size="lg">
          다음
        </Button>
      </div>
    </form>
  );
}

// Step 3: 결제수단 선택
function PaymentMethodStep({
  value,
  onNext,
  onBack,
}: {
  value?: string;
  onNext: (value: string) => void;
  onBack: () => void;
}) {
  const paymentMethods = ['신용카드', '체크카드', '현금', '계좌이체', '기타'];

  return (
    <div className="space-y-4">
      <Label className="text-lg">결제수단을 선택하세요</Label>
      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <Button
            key={method}
            type="button"
            variant={value === method ? 'default' : 'outline'}
            onClick={() => onNext(method)}
            className="h-16 text-lg"
          >
            {method}
          </Button>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={onBack} className="w-full">
        이전
      </Button>
    </div>
  );
}

// Step 4: 추가 옵션
function OptionsStep({
  formData,
  onChange,
  tagsInput,
  onTagsChange,
  onSubmit,
  onBack,
  loading,
}: {
  formData: Partial<TransactionRequest>;
  onChange: (data: Partial<TransactionRequest>) => void;
  tagsInput: string;
  onTagsChange: (tags: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transactionDate">거래 날짜</Label>
        <Input
          id="transactionDate"
          type="date"
          value={formData.transactionDate}
          onChange={(e) => onChange({ ...formData, transactionDate: e.target.value })}
        />
      </div>

      {!showAdvanced ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvanced(true)}
          className="w-full"
        >
          추가 옵션 표시
        </Button>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
            <Input
              id="tags"
              placeholder="식비, 외식"
              value={tagsInput}
              onChange={(e) => onTagsChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="originalAmount">원금 (선택)</Label>
            <Input
              id="originalAmount"
              type="number"
              step="0.01"
              placeholder="해외 결제 시 원화"
              value={formData.originalAmount || ''}
              onChange={(e) =>
                onChange({ ...formData, originalAmount: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountRate">할인율 (%)</Label>
            <Input
              id="discountRate"
              type="number"
              step="0.01"
              placeholder="10"
              value={formData.discountRate || ''}
              onChange={(e) =>
                onChange({ ...formData, discountRate: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exchangeRate">환율 (선택)</Label>
            <Input
              id="exchangeRate"
              type="number"
              step="0.0001"
              placeholder="1350.5"
              value={formData.exchangeRate || ''}
              onChange={(e) =>
                onChange({ ...formData, exchangeRate: e.target.value ? parseFloat(e.target.value) : undefined })
              }
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          이전
        </Button>
        <Button onClick={onSubmit} disabled={loading} className="flex-1" size="lg">
          {loading ? '추가 중...' : '완료'}
        </Button>
      </div>
    </div>
  );
}
