import { Suspense } from 'react';
import { K8sService } from '@/lib/mgc-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClusterStatus } from '@/components/mgc/cluster-status';
import { deleteClusterAction, downloadKubeconfigAction } from './actions';
import { Download, Trash2, Plus } from 'lucide-react';

// Componente de Lista Assíncrono (RSC)
async function ClusterList() {
  let clusters;
  try {
    clusters = await K8sService.listClusters();
  } catch (error: any) {
    return (
      <div className="p-10 text-center border rounded bg-destructive/10">
        <p className="text-destructive">
          Erro ao carregar clusters: {error.message || 'Erro desconhecido'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Verifique suas credenciais em .env.local
        </p>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="p-10 text-center border rounded bg-muted/50">
        <p className="text-muted-foreground">Nenhum cluster encontrado nesta região.</p>
        <Link href="/kubernetes/create">
          <Button className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Cluster
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Versão</TableHead>
            <TableHead>Nós</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clusters.map((cluster) => (
            <TableRow key={cluster.id}>
              <TableCell className="font-semibold">{cluster.name}</TableCell>
              <TableCell>
                <ClusterStatus state={cluster.status.state} />
              </TableCell>
              <TableCell>{cluster.version}</TableCell>
              <TableCell>
                {cluster.node_pools.reduce((acc, pool) => acc + pool.replicas, 0)}
              </TableCell>
              <TableCell>
                {new Date(cluster.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <a
                    href={`/api/kubeconfig?clusterId=${cluster.id}`}
                    download={`kubeconfig-${cluster.name}.yaml`}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <form
                    action={async () => {
                      'use server';
                      await deleteClusterAction(cluster.id);
                    }}
                  >
                    <Button
                      type="submit"
                      variant="destructive"
                      size="sm"
                      className="h-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function KubernetesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clusters Kubernetes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clusters Kubernetes na Magalu Cloud
          </p>
        </div>
        <Link href="/kubernetes/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cluster
          </Button>
        </Link>
      </div>

      {/* Suspense Boundary para Loading State Progressivo */}
      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando clusters da MGC...</p>
          </div>
        }
      >
        <ClusterList />
      </Suspense>
    </div>
  );
}

