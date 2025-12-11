import { Badge } from '@/components/ui/badge';
import type { MgcCluster } from '@/lib/types';

interface ClusterStatusProps {
  state: MgcCluster['status']['state'];
}

export function ClusterStatus({ state }: ClusterStatusProps) {
  const variantMap = {
    RUNNING: 'success' as const,
    PROVISIONING: 'warning' as const,
    DELETING: 'warning' as const,
    ERROR: 'destructive' as const,
  };

  return (
    <Badge variant={variantMap[state] || 'default'}>
      {state}
    </Badge>
  );
}

