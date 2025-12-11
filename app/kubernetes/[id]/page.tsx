import { Suspense } from 'react';
import { K8sService } from '@/lib/mgc-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ClusterStatus } from '@/components/mgc/cluster-status';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Server, Network, Cpu } from 'lucide-react';
import { notFound } from 'next/navigation';

async function ClusterDetails({ clusterId }: { clusterId: string }) {
  let cluster;
  try {
    cluster = await K8sService.getCluster(clusterId);
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      {/* Informações Gerais do Cluster */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{cluster.name}</CardTitle>
              <CardDescription>ID: {cluster.id}</CardDescription>
            </div>
            <ClusterStatus state={cluster.status.state as any} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Versão</p>
              <p className="font-semibold">{cluster.version}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Região</p>
              <Badge variant="outline">{cluster.region}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <p className="text-sm">{cluster.status.message || cluster.status.messages?.join(', ') || 'N/A'}</p>
            </div>
            {cluster.created_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Criado em</p>
                <p className="text-sm">
                  {new Date(cluster.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            {cluster.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Atualizado em</p>
                <p className="text-sm">
                  {new Date(cluster.updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
            {cluster.kube_api_server?.floating_ip && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">API Server</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono">{cluster.kube_api_server.floating_ip}</p>
                  {cluster.kube_api_server.port && (
                    <Badge variant="outline">:{cluster.kube_api_server.port}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Control Plane */}
      {cluster.controlplane && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Control Plane
            </CardTitle>
            <CardDescription>{cluster.controlplane.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Replicas</p>
                <p className="font-semibold">{cluster.controlplane.replicas}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Badge variant={cluster.controlplane.status.state === 'Running' ? 'success' : 'warning'}>
                  {cluster.controlplane.status.state}
                </Badge>
              </div>
              {cluster.controlplane.instance_template?.flavor && (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Flavor</p>
                    <p className="text-sm font-mono">{cluster.controlplane.instance_template.flavor.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Recursos</p>
                    <p className="text-sm">
                      {cluster.controlplane.instance_template.flavor.vcpu} vCPU,{' '}
                      {cluster.controlplane.instance_template.flavor.ram}GB RAM
                    </p>
                  </div>
                </>
              )}
              {cluster.controlplane.auto_scale && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Auto Scale</p>
                  <p className="text-sm">
                    {cluster.controlplane.auto_scale.min_replicas} - {cluster.controlplane.auto_scale.max_replicas}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network */}
      {cluster.network && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Rede
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cluster.network.name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Nome</p>
                  <p className="text-sm">{cluster.network.name}</p>
                </div>
              )}
              {cluster.network.uuid && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">UUID</p>
                  <p className="text-sm font-mono text-xs">{cluster.network.uuid}</p>
                </div>
              )}
              {cluster.network.cidr && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">CIDR</p>
                  <p className="text-sm font-mono">{cluster.network.cidr}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Node Pools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Node Pools
          </CardTitle>
          <CardDescription>
            {cluster.node_pools?.length || 0} node pool(s) configurado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!cluster.node_pools || cluster.node_pools.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum node pool configurado
            </p>
          ) : (
            <div className="space-y-4">
              {cluster.node_pools.map((pool) => (
                <Card key={pool.id} className="border-l-4 border-l-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{pool.name}</CardTitle>
                        <CardDescription className="text-xs font-mono mt-1">
                          ID: {pool.id}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          pool.status?.state === 'Running' ? 'success' : 'warning'
                        }
                      >
                        {pool.status?.state || 'Unknown'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Replicas
                        </p>
                        <p className="font-semibold">{pool.replicas}</p>
                      </div>
                      {pool.instance_template?.flavor && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Flavor
                            </p>
                            <p className="text-sm font-mono">
                              {pool.instance_template.flavor.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              Recursos
                            </p>
                            <p className="text-sm">
                              {pool.instance_template.flavor.vcpu} vCPU,{' '}
                              {pool.instance_template.flavor.ram}GB RAM
                              {pool.instance_template.flavor.size && (
                                <>, {pool.instance_template.flavor.size}GB Disk</>
                              )}
                            </p>
                          </div>
                        </>
                      )}
                      {pool.auto_scale && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Auto Scale
                          </p>
                          <p className="text-sm">
                            {pool.auto_scale.min_replicas} - {pool.auto_scale.max_replicas}
                          </p>
                        </div>
                      )}
                    </div>
                    {pool.instance_template?.node_image && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Node Image
                        </p>
                        <p className="text-sm font-mono">{pool.instance_template.node_image}</p>
                      </div>
                    )}
                    {pool.status?.messages && pool.status.messages.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Mensagens de Status
                        </p>
                        <ul className="space-y-1">
                          {pool.status.messages.map((msg, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {pool.labels && Object.keys(pool.labels).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Labels
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(pool.labels).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}={value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {pool.created_at && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Criado em
                            </p>
                            <p className="text-xs">
                              {new Date(pool.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          {pool.updated_at && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Atualizado em
                              </p>
                              <p className="text-xs">
                                {new Date(pool.updated_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ClusterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/kubernetes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Cluster</h1>
          <p className="text-muted-foreground mt-1">
            Informações detalhadas do cluster Kubernetes
          </p>
        </div>
        <Suspense fallback={<Button disabled>Carregando...</Button>}>
          <ClusterActionsWrapper params={params} />
        </Suspense>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando detalhes do cluster...</p>
          </div>
        }
      >
        <ClusterDetailsWrapper params={params} />
      </Suspense>
    </div>
  );
}

async function ClusterDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClusterDetails clusterId={id} />;
}

async function ClusterActionsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClusterActions clusterId={id} />;
}

async function ClusterActions({ clusterId }: { clusterId: string }) {
  return (
    <a
      href={`/api/kubeconfig?clusterId=${clusterId}`}
      download={`kubeconfig-${clusterId}.yaml`}
    >
      <Button variant="outline">
        <Download className="mr-2 h-4 w-4" />
        Download Kubeconfig
      </Button>
    </a>
  );
}

