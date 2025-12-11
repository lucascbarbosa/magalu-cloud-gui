// Definições de Tipos baseadas na documentação MGC

export interface MgcCluster {
  id: string;
  name: string;
  description?: string;
  status: {
    state: 'PROVISIONING' | 'RUNNING' | 'DELETING' | 'ERROR' | 'Running';
    message?: string;
    messages?: string[];
  };
  version: string;
  created_at?: string;
  updated_at?: string;
  node_pools?: MgcNodePool[];
  region: string;
  controlplane?: MgcControlPlane;
  network?: {
    name?: string;
    uuid?: string;
    subnet_id?: string;
    cidr?: string;
  };
  kube_api_server?: {
    floating_ip?: string;
    port?: number;
  };
  platform?: {
    version?: string;
  };
  project_id?: string;
  machine_types_source?: string;
  allowed_cidrs?: string[];
  addons?: {
    loadbalance?: string;
    secrets?: string;
    volume?: string;
  };
}

export interface MgcControlPlane {
  id: string;
  name: string;
  replicas: number;
  status: {
    state: string;
    messages?: string[];
  };
  created_at?: string;
  updated_at?: string;
  instance_template?: MgcInstanceTemplate;
  auto_scale?: {
    min_replicas: number;
    max_replicas: number;
  };
  labels?: Record<string, string>;
  securityGroups?: string[];
  tags?: string[] | null;
  zone?: string | null;
}

export interface MgcNodePool {
  id: string;
  name: string;
  replicas: number;
  status: {
    state: string;
    messages?: string[];
  };
  created_at?: string;
  updated_at?: string;
  flavor?: {
    name: string;
    vcpu: number;
    ram: number;
    id?: string;
    size?: number;
  };
  instance_template?: MgcInstanceTemplate;
  auto_scale?: {
    min_replicas: number;
    max_replicas: number;
  };
  labels?: Record<string, string>;
  securityGroups?: string[];
  tags?: string[] | null;
  zone?: string | null;
}

export interface MgcInstanceTemplate {
  flavor: {
    id?: string;
    name: string;
    vcpu: number;
    ram: number;
    size?: number;
  };
  node_image?: string;
  disk_size?: number;
  disk_type?: string;
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

export interface MgcRegistry {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  storage_usage_bytes: number;
}

export interface MgcRegistryListResponse {
  results: MgcRegistry[];
  meta?: {
    page?: {
      count: number;
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export interface MgcRegistryTags {
  name: string;
  tags: string[];
}

export interface MgcRepository {
  id: string;
  name: string;
  registry_name: string;
  image_count: number;
  created_at: string;
  updated_at: string;
}

export interface MgcRepositoryListResponse {
  results: MgcRepository[];
  meta?: {
    page?: {
      count: number;
      limit: number;
      offset: number;
      total: number;
    };
  };
}

export interface MgcImage {
  digest: string;
  size_bytes: number;
  pushed_at: string;
  pulled_at?: string;
  tags: string[];
  tags_details?: Array<{
    name: string;
    pushed_at: string;
    pulled_at?: string;
    signed: boolean;
  }>;
  extra_attr?: {
    architecture?: string;
    author?: string;
    config?: any;
    created?: string;
    os?: string;
    manifest_media_type?: string;
    media_type?: string;
  };
}

export interface MgcImageListResponse {
  results: MgcImage[];
  meta?: {
    page?: {
      count: number;
      limit: number;
      offset: number;
      total: number;
    };
  };
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

