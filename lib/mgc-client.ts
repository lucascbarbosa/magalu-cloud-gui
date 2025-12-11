import 'server-only';

import type {
  MgcCluster,
  MgcKubeconfig,
  MgcRegistryRepository,
  MgcApiResponse,
  MgcFlavor,
} from './types';

// Configuração do Ambiente
const API_KEY = process.env.MGC_API_KEY;
const TENANT_ID = process.env.MGC_TENANT_ID;
const REGION = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';

function getCredentials() {
  if (!API_KEY || !TENANT_ID) {
    throw new Error("Credenciais MGC não encontradas. Execute setup-mgc.sh.");
  }
  return { API_KEY, TENANT_ID, REGION };
}

// Cabeçalhos Padrão exigidos pela API (gerados dinamicamente)
function getHeaders() {
  const { API_KEY, TENANT_ID } = getCredentials();
  return {
    'x-api-key': API_KEY,
    'x-tenant-id': TENANT_ID,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

/**
 * Wrapper genérico para fetch com tratamento de erros MGC
 */
async function mgcFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { REGION } = getCredentials();
  const HEADERS = getHeaders();
  
  // Construção dinâmica do endpoint regional
  const baseUrl = `https://api.magalu.cloud/${REGION}`;
  const url = `${baseUrl}${endpoint}`;

  console.log(`[MGC API] ${options.method || 'GET'} ${url}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...HEADERS,
      ...options.headers,
    },
    // Next.js 15: Cache padrão de 30s para GET, no-store para outros
    next: {
      revalidate: options.method === 'GET' ? 30 : 0,
      tags: ['mgc-data'],
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MGC Error] ${response.status}: ${errorText}`);
    throw new Error(`Falha na API MGC (${response.status}): ${errorText}`);
  }

  // Tratamento para respostas vazias (ex: DELETE 204)
  if (response.status === 204) return {} as T;

  return response.json();
}

// --- Módulos da API ---

export const K8sService = {
  listClusters: async (): Promise<MgcCluster[]> => {
    // Endpoint: https://api.magalu.cloud/br-se1/kubernetes/v0/clusters
    const response = await mgcFetch<MgcApiResponse<MgcCluster>>(
      '/kubernetes/v0/clusters'
    );
    return response.results || [];
  },

  getCluster: async (clusterId: string): Promise<MgcCluster> => {
    return mgcFetch<MgcCluster>(`/kubernetes/v0/clusters/${clusterId}`);
  },

  createCluster: async (data: {
    name: string;
    version: string;
    node_pools: Array<{
      name: string;
      flavor: string;
      replicas: number;
      tags?: string[];
      auto_scale?: {
        min_replicas: number;
        max_replicas: number;
      };
    }>;
    description?: string;
  }): Promise<MgcCluster> => {
    return mgcFetch<MgcCluster>('/kubernetes/v0/clusters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getKubeconfig: async (clusterId: string): Promise<MgcKubeconfig> => {
    // Endpoint crítico para funcionalidade "Connect"
    return mgcFetch<MgcKubeconfig>(
      `/kubernetes/v0/clusters/${clusterId}/kubeconfig`,
      {
        cache: 'no-store',
      } as RequestInit
    );
  },

  deleteCluster: async (clusterId: string): Promise<void> => {
    await mgcFetch(`/kubernetes/v0/clusters/${clusterId}`, {
      method: 'DELETE',
    });
  },

  listFlavors: async (): Promise<MgcFlavor[]> => {
    // Endpoint para listar flavors disponíveis
    try {
      const response = await mgcFetch<MgcApiResponse<MgcFlavor>>(
        '/compute/v0/flavors'
      );
      return response.results || [];
    } catch {
      // Fallback para flavors conhecidos se a API não estiver disponível
      return [
        { name: 'cloud-k8s.gp1.small', vcpu: 2, ram: 4 },
        { name: 'cloud-k8s.gp1.medium', vcpu: 4, ram: 8 },
        { name: 'cloud-k8s.gp1.large', vcpu: 8, ram: 16 },
      ];
    }
  },
};

export const RegistryService = {
  // O Registry tem um domínio separado
  // Endpoint: https://container-registry.br-ne1.magalu.cloud
  listRepositories: async (): Promise<string[]> => {
    const { REGION, TENANT_ID, API_KEY } = getCredentials();
    const registryUrl = `https://container-registry.${REGION}.magalu.cloud/v2/_catalog`;

    // Autenticação no Registry geralmente usa Basic Auth (API Key) ou Bearer Token
    // Baseado em padrões Docker V2
    const authHeader = `Basic ${Buffer.from(`${TENANT_ID}:${API_KEY}`).toString('base64')}`;

    const response = await fetch(registryUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: ['registry-data'],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao acessar Container Registry (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as MgcRegistryRepository;
    return data.repositories || [];
  },

  listTags: async (repository: string): Promise<string[]> => {
    const { REGION, TENANT_ID, API_KEY } = getCredentials();
    const registryUrl = `https://container-registry.${REGION}.magalu.cloud/v2/${repository}/tags/list`;

    const authHeader = `Basic ${Buffer.from(`${TENANT_ID}:${API_KEY}`).toString('base64')}`;

    const response = await fetch(registryUrl, {
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: ['registry-data'],
      },
    });

    if (!response.ok) {
      throw new Error(`Falha ao listar tags (${response.status})`);
    }

    const data = (await response.json()) as { tags: string[] };
    return data.tags || [];
  },
};

export const AuthService = {
  getCurrentTenant: async () => {
    // Tenta obter informações do tenant atual
    // Nota: Este endpoint pode variar na API real
    try {
      return await mgcFetch<{ id: string; uuid: string; name?: string }>(
        '/iam/v0/tenants/current'
      );
    } catch {
      // Fallback: retorna informações do .env
      const { TENANT_ID } = getCredentials();
      return {
        id: TENANT_ID,
        uuid: TENANT_ID,
        name: 'Current Tenant',
      };
    }
  },
};

