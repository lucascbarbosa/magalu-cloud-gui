// Definições de Tipos baseadas na documentação MGC

export interface MgcCluster {
  id: string;
  name: string;
  description?: string;
  status: {
    state: 'PROVISIONING' | 'RUNNING' | 'DELETING' | 'ERROR';
    messages?: string;
  };
  version: string;
  created_at: string;
  node_pools: MgcNodePool[];
  region: string;
}

export interface MgcNodePool {
  id: string;
  name: string;
  replicas: number;
  flavor: {
    name: string;
    vcpu: number;
    ram: number;
  };
  auto_scale?: {
    min_replicas: number;
    max_replicas: number;
  };
}

export interface MgcFlavor {
  name: string;
  vcpu: number;
  ram: number;
  disk?: number;
  description?: string;
}

export interface MgcKubeconfig {
  kubeconfig: string;
}

export interface MgcRegistryRepository {
  repositories: string[];
}

export interface MgcRegistryTags {
  name: string;
  tags: string[];
}

export interface MgcTenant {
  id: string;
  name?: string;
  uuid: string;
}

export interface MgcApiResponse<T> {
  results: T[];
  count?: number;
  next?: string;
  previous?: string;
}

