import { useState, useRef, KeyboardEvent } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { transactionAPI } from '@/lib/api';
import { getCurrentKSTDate } from '@/lib/dateUtils';

interface TransactionInputProps {
  type: 'INCOME' | 'EXPENSE';
  onSuccess?: () => void;
}

interface ParsedTransaction {
  description: string;
  amount: number;
}

export function TransactionInput({ type, onSuccess }: TransactionInputProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [autoMode, setAutoMode] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto 모드: 정규식으로 "마트 20000원" 형식 파싱
  const parseAutoInput = (input: string): ParsedTransaction | null => {
    // 패턴 1: "설명 금액원" (예: "마트 20000원")
    const pattern1 = /^(.+?)\s+([\d,]+)원?\s*$/;
    // 패턴 2: "금액원 설명" (예: "20000원 마트")
    const pattern2 = /^([\d,]+)원?\s+(.+)$/;
    // 패턴 3: "설명 금액" (원 없이, 예: "마트 20000")
    const pattern3 = /^(.+?)\s+([\d,]+)\s*$/;

    let match = input.match(pattern1);
    if (match) {
      return {
        description: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, ''))
      };
    }

    match = input.match(pattern2);
    if (match) {
      return {
        description: match[2].trim(),
        amount: parseFloat(match[1].replace(/,/g, ''))
      };
    }

    match = input.match(pattern3);
    if (match && !isNaN(parseFloat(match[2].replace(/,/g, '')))) {
      return {
        description: match[1].trim(),
        amount: parseFloat(match[2].replace(/,/g, ''))
      };
    }

    return null;
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      let description = '';
      let amount = 0;

      if (autoMode) {
        const parsed = parseAutoInput(content);
        if (parsed) {
          description = parsed.description;
          amount = parsed.amount;
        } else {
          // Auto 모드인데 파싱 실패 시 에러 표시
          alert('입력 형식이 올바르지 않습니다. 예: "마트 20000원"');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Manual 모드: content를 description으로 사용
        description = content;
        // Manual 모드에서는 금액을 별도로 입력받아야 하는데,
        // 현재는 Auto 모드만 완전히 구현
        alert('Manual 모드는 아직 구현되지 않았습니다. Auto 모드를 사용해주세요.');
        setIsSubmitting(false);
        return;
      }

      // API 호출
      await transactionAPI.create({
        type,
        amount,
        description,
        paymentMethod: '기타', // 기본값
        currency: '원',
        tags: tags.length > 0 ? JSON.stringify(tags) : undefined,
        transactionDate: getCurrentKSTDate()
      });

      // 성공 후 초기화
      setContent('');
      setTags([]);
      setAttachedFiles([]);
      onSuccess?.();

      // textarea에 포커스
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('거래 내역 추가에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter로 제출
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* 태그 입력 영역 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">@</span>
        <input
          type="text"
          placeholder="태그 추가"
          value={currentTag}
          onChange={(e) => setCurrentTag(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={handleAddTag}
          className="text-sm px-2 py-1 border-0 focus:outline-none focus:ring-0 bg-transparent flex-1 min-w-[100px]"
        />
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {/* 메인 입력 영역 */}
      <Textarea
        ref={textareaRef}
        placeholder={autoMode ? '예: 마트 20000원' : '내용을 입력하세요'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0"
      />

      {/* 첨부된 파일 목록 */}
      {attachedFiles.length > 0 && (
        <div className="space-y-1">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span className="flex-1 truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 하단 컨트롤 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 파일 첨부 버튼 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="파일 첨부"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Auto 모드 토글 */}
          <div className="flex items-center gap-2">
            <Switch
              checked={autoMode}
              onCheckedChange={setAutoMode}
              id="auto-mode"
            />
            <label htmlFor="auto-mode" className="text-sm cursor-pointer">
              Auto
            </label>
          </div>
        </div>

        {/* 전송 버튼 */}
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="rounded-full h-10 w-10"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
