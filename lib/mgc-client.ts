import 'server-only';

import type {
  MgcCluster,
  MgcKubeconfig,
  MgcRegistryRepository,
  MgcRegistry,
  MgcRegistryListResponse,
  MgcRepository,
  MgcRepositoryListResponse,
  MgcImage,
  MgcImageListResponse,
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
    // Log de erro (404s podem ser esperados em alguns casos, mas ainda logamos)
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
  // Lista registries usando a API REST da Magalu Cloud
  listRegistries: async () => {
    try {
      const response = await mgcFetch<MgcRegistryListResponse>(
        '/container-registry/v0/registries'
      );
      return response.results || [];
    } catch (error: any) {
      // Se o endpoint não existe ou retorna erro, tenta fallback para Docker V2
      if (error.message?.includes('404')) {
        console.warn('API REST de registries não disponível, tentando Docker V2...');
        return await RegistryService.listRepositoriesDockerV2();
      }
      console.error('Erro ao listar registries:', error);
      return [];
    }
  },

  // Fallback: Lista repositórios usando Docker V2 API
  listRepositoriesDockerV2: async (): Promise<MgcRegistry[]> => {
    const { REGION, TENANT_ID, API_KEY } = getCredentials();
    const registryUrl = `https://container-registry.${REGION}.magalu.cloud/v2/_catalog`;

    // Autenticação no Registry geralmente usa Basic Auth (API Key) ou Bearer Token
    // Baseado em padrões Docker V2
    const authHeader = `Basic ${Buffer.from(`${TENANT_ID}:${API_KEY}`).toString('base64')}`;

    try {
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
        // Se o registry não existe ou não está disponível, retorna array vazio
        if (response.status === 404) {
          console.warn('Container Registry não encontrado ou não configurado');
          return [];
        }
        const errorText = await response.text();
        console.error(`Falha ao acessar Container Registry (${response.status}): ${errorText}`);
        return [];
      }

      const data = (await response.json()) as MgcRegistryRepository;
      // Converte lista de nomes para formato MgcRegistry
      return (data.repositories || []).map((name) => ({
        id: name, // Usa o nome como ID temporário
        name,
        created_at: '',
        updated_at: '',
        storage_usage_bytes: 0,
      }));
    } catch (error) {
      // Em caso de erro de rede ou outro problema, retorna array vazio
      console.error('Erro ao acessar Container Registry:', error);
      return [];
    }
  },

  // Mantém compatibilidade com código existente
  listRepositories: async (): Promise<string[]> => {
    const registries = await RegistryService.listRegistries();
    return registries.map((r) => r.name);
  },

  // Lista repositórios de um registry específico
  listRepositoriesByRegistry: async (registryId: string): Promise<MgcRepository[]> => {
    try {
      const response = await mgcFetch<MgcRepositoryListResponse>(
        `/container-registry/v0/registries/${registryId}/repositories`
      );
      return response.results || [];
    } catch (error: any) {
      console.error('Erro ao listar repositórios:', error);
      return [];
    }
  },

  // Obtém detalhes de um repositório
  getRepository: async (registryId: string, repositoryId: string): Promise<MgcRepository> => {
    return mgcFetch<MgcRepository>(
      `/container-registry/v0/registries/${registryId}/repositories/${repositoryId}`
    );
  },

  // Lista imagens/tags de um repositório
  listImages: async (registryId: string, repositoryId: string): Promise<MgcImage[]> => {
    try {
      const response = await mgcFetch<MgcImageListResponse>(
        `/container-registry/v0/registries/${registryId}/repositories/${repositoryId}/images`
      );
      return response.results || [];
    } catch (error: any) {
      console.error('Erro ao listar imagens:', error);
      return [];
    }
  },

  // Obtém detalhes de uma imagem específica
  getImage: async (
    registryId: string,
    repositoryId: string,
    digestOrTag: string
  ): Promise<MgcImage> => {
    return mgcFetch<MgcImage>(
      `/container-registry/v0/registries/${registryId}/repositories/${repositoryId}/images/${encodeURIComponent(digestOrTag)}`
    );
  },

  // Deleta uma imagem
  deleteImage: async (
    registryId: string,
    repositoryId: string,
    digestOrTag: string
  ): Promise<void> => {
    await mgcFetch(
      `/container-registry/v0/registries/${registryId}/repositories/${repositoryId}/images/${encodeURIComponent(digestOrTag)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Método legado - mantém compatibilidade
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
    // Nota: Este endpoint pode variar na API real e pode não estar disponível
    try {
      const { REGION } = getCredentials();
      const baseUrl = `https://api.magalu.cloud/${REGION}`;
      const url = `${baseUrl}/iam/v0/tenants/current`;
      const HEADERS = getHeaders();

      const response = await fetch(url, {
        headers: HEADERS,
        next: {
          revalidate: 300, // Cache por 5 minutos
          tags: ['auth-data'],
        },
      });

      if (!response.ok) {
        // Se o endpoint não existe (404), trata silenciosamente
        // pois é esperado que esse endpoint possa não estar disponível
        if (response.status === 404) {
          // Retorna null para indicar que o endpoint não existe
          // e será usado o fallback
          return null as any;
        }
        // Para outros erros, lança exceção normalmente
        const errorText = await response.text();
        throw new Error(`Falha na API MGC (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (err: any) {
      // Qualquer erro (incluindo 404) usa fallback silenciosamente
      // Não faz log de erros esperados como 404
      if (err.message && !err.message.includes('404') && !err.message.includes('ENDPOINT_NOT_FOUND')) {
        console.warn('[MGC Auth] Erro ao obter tenant, usando fallback:', err.message);
      }
      
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

