import { useState, useEffect } from 'react';
import { transactionAPI } from '@/lib/api';

/**
 * 모든 거래에서 사용된 태그 목록을 가져오는 훅
 * 태그는 사용 빈도순으로 정렬됩니다
 */
export function useTags() {
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        // 모든 거래 가져오기 (페이지 크기를 크게 설정)
        const response = await transactionAPI.getList(0, 1000);

        // 모든 태그 추출 및 빈도 계산
        const tagFrequency: Record<string, number> = {};

        response.data.content.forEach((transaction) => {
          if (transaction.tags) {
            try {
              const parsedTags = JSON.parse(transaction.tags);
              if (Array.isArray(parsedTags)) {
                parsedTags.forEach((tag: string) => {
                  if (tag.trim()) {
                    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
                  }
                });
              }
            } catch (error) {
              console.error('Failed to parse tags:', error);
            }
          }
        });

        // 빈도순으로 정렬
        const sortedTags = Object.entries(tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .map(([tag]) => tag);

        setTags(sortedTags);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  return { tags, loading };
}
