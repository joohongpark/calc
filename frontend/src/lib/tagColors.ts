export interface TagColor {
  tw: string;   // Tailwind bg class
  hex: string;  // Hex for Recharts
}

export const TAG_COLORS: TagColor[] = [
  { tw: 'bg-red-500',    hex: '#ef4444' },
  { tw: 'bg-orange-500', hex: '#f97316' },
  { tw: 'bg-yellow-400', hex: '#facc15' },
  { tw: 'bg-green-500',  hex: '#22c55e' },
  { tw: 'bg-blue-500',   hex: '#3b82f6' },
  { tw: 'bg-purple-500', hex: '#a855f7' },
  { tw: 'bg-gray-400',   hex: '#9ca3af' },
];

export const NO_TAG_COLOR: TagColor = { tw: 'bg-gray-300', hex: '#d1d5db' };

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * 오픈 어드레싱(linear probing) 방식으로 태그 → 색상 매핑 테이블을 생성.
 * 빈도순 정렬된 태그 배열을 받아, 자주 쓰는 태그부터 우선 배정.
 * 7개 이하 태그는 모든 태그가 고유 색상 보장.
 */
export function buildTagColorMap(allTags: string[]): Map<string, TagColor> {
  const size = TAG_COLORS.length;
  const occupied = new Array<boolean>(size).fill(false);
  const map = new Map<string, TagColor>();

  for (const tag of allTags) {
    const baseSlot = hashString(tag) % size;
    let slot = baseSlot;
    let found = false;

    // linear probing: 빈 슬롯을 찾을 때까지 순회
    for (let i = 0; i < size; i++) {
      const candidate = (baseSlot + i) % size;
      if (!occupied[candidate]) {
        slot = candidate;
        occupied[candidate] = true;
        found = true;
        break;
      }
    }

    // 모든 슬롯이 점유됐으면 원래 해시 슬롯으로 fallback (색상 재사용)
    if (!found) {
      slot = baseSlot;
    }

    map.set(tag, TAG_COLORS[slot]);
  }

  return map;
}

export function parseTags(tags: string | undefined | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
