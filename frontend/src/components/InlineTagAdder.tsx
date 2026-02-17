import { useState, useEffect, useRef, useLayoutEffect, KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { transactionAPI, TransactionResponse } from '@/lib/api';
import { useTags } from '@/hooks/useTags';
import { useTagColors } from '@/hooks/useTagColors';

interface InlineTagAdderProps {
  transaction: TransactionResponse;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSuccess: () => void;
  onClose: () => void;
}

export default function InlineTagAdder({ transaction, anchorRef, onSuccess, onClose }: InlineTagAdderProps) {
  const { tags: allTags } = useTags();
  const { getColorClass } = useTagColors();
  const [input, setInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 앵커 기준 위치 계산
  useLayoutEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [anchorRef]);

  // 스크롤/리사이즈 시 위치 업데이트
  useEffect(() => {
    const update = () => {
      if (anchorRef.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef]);

  useEffect(() => {
    if (position) inputRef.current?.focus();
  }, [position]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose, anchorRef]);

  // 자동완성 필터링
  useEffect(() => {
    const existingTags = getExistingTags();
    if (input.trim()) {
      const filtered = allTags
        .filter(
          (tag) =>
            tag.toLowerCase().includes(input.toLowerCase()) &&
            !existingTags.includes(tag)
        )
        .slice(0, 5);
      setFilteredSuggestions(filtered);
    } else {
      const filtered = allTags
        .filter((tag) => !existingTags.includes(tag))
        .slice(0, 5);
      setFilteredSuggestions(filtered);
    }
    setSelectedIndex(-1);
  }, [input, allTags, transaction.tags]);

  const getExistingTags = (): string[] => {
    if (!transaction.tags) return [];
    try {
      const parsed = JSON.parse(transaction.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveTag = async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || saving) return;

    const existingTags = getExistingTags();
    if (existingTags.includes(trimmed)) return;

    setSaving(true);
    try {
      const newTags = [...existingTags, trimmed];
      await transactionAPI.update(transaction.id, {
        tags: JSON.stringify(newTags),
      });
      onSuccess();
    } catch (error) {
      console.error('태그 추가 실패:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        saveTag(filteredSuggestions[selectedIndex]);
      } else if (input.trim()) {
        saveTag(input);
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
      onClose();
    }
  };

  if (!position) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-[9999] w-48 bg-background border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="태그 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-full text-sm px-2 py-1.5 border rounded bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div className="border-t max-h-[160px] overflow-y-auto">
          {filteredSuggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                saveTag(tag);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${getColorClass(tag)}`} />
              {tag}
            </button>
          ))}
        </div>
      )}
      {saving && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t">저장 중...</div>
      )}
    </div>,
    document.body
  );
}
