import { Suspense } from 'react';
import { K8sService, RegistryService } from '@/lib/mgc-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Container, Package, Key, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function DashboardStats() {
  let clustersCount = 0;
  let repositoriesCount = 0;
  let clustersStatus = { running: 0, provisioning: 0, error: 0 };

  try {
    const clusters = await K8sService.listClusters();
    clustersCount = clusters.length;
    clusters.forEach((cluster) => {
      if (cluster.status.state === 'RUNNING') clustersStatus.running++;
      else if (cluster.status.state === 'PROVISIONING') clustersStatus.provisioning++;
      else if (cluster.status.state === 'ERROR') clustersStatus.error++;
    });
  } catch (error) {
    console.error('Erro ao carregar clusters:', error);
  }

  try {
    const repositories = await RegistryService.listRepositories();
    repositoriesCount = repositories.length;
  } catch (error) {
    console.error('Erro ao carregar repositórios:', error);
  }

  const region = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clusters</CardTitle>
            <Container className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clustersCount}</div>
            <p className="text-xs text-muted-foreground">
              {clustersStatus.running} em execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositórios</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repositoriesCount}</div>
            <p className="text-xs text-muted-foreground">
              Imagens Docker disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Região</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{region}</div>
            <p className="text-xs text-muted-foreground">Região ativa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {process.env.MGC_API_KEY ? '✓' : '✗'}
            </div>
            <p className="text-xs text-muted-foreground">
              {process.env.MGC_API_KEY ? 'Conectado' : 'Desconectado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kubernetes</CardTitle>
            <CardDescription>
              Gerencie seus clusters Kubernetes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/kubernetes">
              <Button className="w-full">Ver Clusters</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Container Registry</CardTitle>
            <CardDescription>
              Explore seus repositórios Docker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/registry">
              <Button className="w-full" variant="outline">
                Ver Registry
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clusters */}
      <Card>
        <CardHeader>
          <CardTitle>Clusters Recentes</CardTitle>
          <CardDescription>
            Últimos clusters criados ou modificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Carregando...</p>
            }
          >
            <RecentClustersList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentClustersList() {
  try {
    const clusters = await K8sService.listClusters();
    const recentClusters = clusters
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);

    if (recentClusters.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhum cluster encontrado
          </p>
          <Link href="/kubernetes/create">
            <Button className="mt-4" variant="outline">
              Criar Primeiro Cluster
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {recentClusters.map((cluster) => (
          <Link
            key={cluster.id}
            href="/kubernetes"
            className="flex items-center justify-between p-3 border rounded hover:bg-accent transition-colors"
          >
            <div>
              <p className="font-medium">{cluster.name}</p>
              <p className="text-sm text-muted-foreground">
                {cluster.version} • {cluster.node_pools.reduce((acc, pool) => acc + pool.replicas, 0)} nós
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(cluster.created_at).toLocaleDateString('pt-BR')}
            </div>
          </Link>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <p className="text-sm text-destructive">
        Erro ao carregar clusters. Verifique suas credenciais.
      </p>
    );
  }
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da sua infraestrutura na Magalu Cloud
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        }
      >
        <DashboardStats />
      </Suspense>
    </div>
  );
}

