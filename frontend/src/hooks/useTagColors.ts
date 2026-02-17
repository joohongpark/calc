import { useMemo } from 'react';
import { useTags } from '@/hooks/useTags';
import { buildTagColorMap, NO_TAG_COLOR, TagColor } from '@/lib/tagColors';

export function useTagColors() {
  const { tags: allTags, loading } = useTags();

  const colorMap = useMemo(() => buildTagColorMap(allTags), [allTags]);

  const getColor = (tagName: string): TagColor => {
    if (tagName === '태그 없음') return NO_TAG_COLOR;
    return colorMap.get(tagName) ?? NO_TAG_COLOR;
  };

  const getColorClass = (tagName: string): string => getColor(tagName).tw;
  const getColorHex = (tagName: string): string => getColor(tagName).hex;

  return { getColor, getColorClass, getColorHex, loading };
}
