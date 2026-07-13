import type { ZmanimDisplayRow } from '@/lib/zmanimDisplay';
import { HomeCopy } from '@/lib/rebiidCopy';
import { ZmanimRowList } from '@/src/components/ZmanimRowList';

interface ZmanimCardProps {
  rows: ZmanimDisplayRow[];
}

export function ZmanimCard({ rows }: ZmanimCardProps) {
  return <ZmanimRowList rows={rows} emptyText={HomeCopy.emptyZmanim} />;
}
