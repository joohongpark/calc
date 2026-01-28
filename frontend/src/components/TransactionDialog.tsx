import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { transactionAPI, TransactionRequest, paymentMethodAPI, PaymentMethodResponse } from '@/lib/api';
import { getCurrentKSTDate } from '@/lib/dateUtils';
import { useTags } from '@/hooks/useTags';

/*
TransactionDialog 컴포넌트 프로퍼티
- open: boolean - 다이얼로그가 열려 있는지 여부
- onOpenChange: function - 다이얼로그 열림 상태 변경 시 콜백
- type: 'INCOME' | 'EXPENSE' - 거래 유형
- onSuccess: function (optional) - 거래 추가 성공 시 콜백
- initialDate: string (optional) - 초기 날짜 (YYYY-MM-DD 형식)
*/
interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'INCOME' | 'EXPENSE';
  onSuccess?: () => void;
  initialDate?: string;
}

type Step = 'amount' | 'description' | 'paymentMethod' | 'options';

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
  onSuccess,
  initialDate,
}: TransactionDialogProps) {
  const { tags: allTags } = useTags(); // 기존 태그 목록 가져오기
  const [step, setStep] = useState<Step>('amount');
  const [formData, setFormData] = useState<Partial<TransactionRequest>>({
    type,
    currency: 'KRW',
    transactionDate: initialDate || getCurrentKSTDate(), // 전달된 날짜 또는 현재 날짜
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 태그를 배열로 관리

  const [loading, setLoading] = useState(false);

  // initialDate가 변경될 때 formData 업데이트
  useEffect(() => {
    if (initialDate && open) {
      setFormData(prev => ({ ...prev, transactionDate: initialDate }));
    }
  }, [initialDate, open]);

  const handleNext = (field: keyof TransactionRequest, value: any) => {
    setFormData({ ...formData, [field]: value });

    // 다음 단계로 이동
    if (step === 'amount') setStep('description');
    else if (step === 'description') setStep('paymentMethod');
    else if (step === 'paymentMethod') setStep('options');
  };

  const handleSubmit = async () => {
    if (loading) return; // Race condition 방지

    setLoading(true);
    try {
      // 태그를 JSON 배열 문자열로 변환
      const tags = selectedTags.length > 0
        ? JSON.stringify(selectedTags)
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
    setSelectedTags([]); // 태그 초기화
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
            거래 추가
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
              onClick={() => setFormData({ ...formData, type: 'INCOME' })}
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
              onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
            >
              지출
            </Button>
          </div>

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
              value={formData.paymentMethodId}
              onNext={(value) => handleNext('paymentMethodId', value)}
              onBack={handleBack}
            />
          )}

          {/* Step 4: Options */}
          {step === 'options' && (
            <OptionsStep
              formData={formData}
              onChange={setFormData}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              allTags={allTags}
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
  value?: number;
  onNext: (value: number) => void;
  onBack: () => void;
}) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMethodDialogOpen, setAddMethodDialogOpen] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [addMethodLoading, setAddMethodLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPaymentMethods = async () => {
    try {
      const response = await paymentMethodAPI.getList();
      setPaymentMethods(response.data);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

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

  if (loading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg">결제수단을 선택하세요</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddMethodDialogOpen(true)}
          >
            추가
          </Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          등록된 결제수단이 없습니다. 먼저 결제수단을 등록해주세요.
        </div>
        <Button type="button" variant="outline" onClick={onBack} className="w-full">
          이전
        </Button>

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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg">결제수단을 선택하세요</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAddMethodDialogOpen(true)}
        >
          추가
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => (
          <Button
            key={method.id}
            type="button"
            variant={value === method.id ? 'default' : 'outline'}
            onClick={() => onNext(method.id)}
            className="h-16 text-lg"
          >
            {method.name}
          </Button>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={onBack} className="w-full">
        이전
      </Button>

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
    </div>
  );
}

// Step 4: 추가 옵션
function OptionsStep({
  formData,
  onChange,
  selectedTags,
  onTagsChange,
  allTags,
  onSubmit,
  onBack,
  loading,
}: {
  formData: Partial<TransactionRequest>;
  onChange: (data: Partial<TransactionRequest>) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  allTags: string[];
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 태그 자동완성 관련 상태
  const [currentTag, setCurrentTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 태그 입력값에 따라 추천 태그 필터링
  useEffect(() => {
    if (currentTag.trim()) {
      const filtered = allTags
        .filter(
          (tag) =>
            tag.toLowerCase().includes(currentTag.toLowerCase()) &&
            !selectedTags.includes(tag)
        )
        .slice(0, 5);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [currentTag, allTags, selectedTags]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTag = (tag?: string) => {
    const tagToAdd = tag || currentTag.trim();
    if (tagToAdd && !selectedTags.includes(tagToAdd)) {
      onTagsChange([...selectedTags, tagToAdd]);
      setCurrentTag('');
      setShowSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        handleAddTag(filteredSuggestions[selectedIndex]);
      } else if (currentTag.trim()) {
        handleAddTag();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

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
            <Label>태그</Label>
            <div className="relative">
              <div className="flex items-center gap-2 flex-wrap border rounded-md p-2 min-h-[42px]">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  ref={tagInputRef}
                  type="text"
                  placeholder="태그 추가"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => {
                    setTimeout(() => {
                      if (currentTag.trim() && selectedIndex === -1) {
                        handleAddTag();
                      }
                    }, 200);
                  }}
                  onFocus={() => currentTag.trim() && setShowSuggestions(true)}
                  className="flex-1 min-w-[100px] text-sm px-2 py-1 border-0 focus:outline-none focus:ring-0 bg-transparent"
                />
              </div>

              {/* 자동완성 드롭다운 */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-[200px] overflow-y-auto"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // onBlur 방지
                        handleAddTag(suggestion);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                        index === selectedIndex ? 'bg-accent' : ''
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
