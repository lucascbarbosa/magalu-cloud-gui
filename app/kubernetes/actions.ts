'use server';

import { K8sService } from '@/lib/mgc-client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createClusterAction(formData: FormData) {
  const name = formData.get('name') as string;
  const flavor = formData.get('flavor') as string;
  const nodes = parseInt(formData.get('nodes') as string);
  const version = formData.get('version') as string || 'v1.28.5';

  // Validação básica
  if (!name || !flavor) {
    throw new Error('Nome e Flavor são obrigatórios.');
  }

  if (nodes < 1 || nodes > 10) {
    throw new Error('Número de nós deve estar entre 1 e 10.');
  }

  // Payload conforme documentação
  const payload = {
    name,
    version,
    node_pools: [
      {
        name: 'default-pool',
        flavor: flavor, // ex: "cloud-k8s.gp1.small"
        replicas: nodes,
        tags: ['criado-via-gui'],
        auto_scale: {
          min_replicas: 1,
          max_replicas: nodes + 2,
        },
      },
    ],
  };

  try {
    await K8sService.createCluster(payload);
    // Revalida o cache da lista e redireciona
    revalidatePath('/kubernetes');
    redirect('/kubernetes');
  } catch (err: any) {
    throw new Error(`Erro ao criar cluster: ${err.message || err}`);
  }
}

export async function deleteClusterAction(clusterId: string) {
  try {
    await K8sService.deleteCluster(clusterId);
    revalidatePath('/kubernetes');
    return { success: true };
  } catch (err: any) {
    return { error: `Erro ao deletar cluster: ${err.message || err}` };
  }
}

export async function downloadKubeconfigAction(clusterId: string) {
  try {
    const { kubeconfig } = await K8sService.getKubeconfig(clusterId);
    return { kubeconfig };
  } catch (err: any) {
    return { error: `Erro ao obter kubeconfig: ${err.message || err}` };
  }
}

