import { Suspense } from 'react';
import { RegistryService } from '@/lib/mgc-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Calendar, Image as ImageIcon } from 'lucide-react';
import { notFound } from 'next/navigation';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function RegistryDetails({ registryId }: { registryId: string }) {
  let registry;
  let repositories = [];

  try {
    // Busca o registry específico
    const allRegistries = await RegistryService.listRegistries();
    registry = allRegistries.find((r) => r.id === registryId);

    if (!registry) {
      notFound();
    }

    // Busca repositórios do registry
    repositories = await RegistryService.listRepositoriesByRegistry(registryId);
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      notFound();
    }
    throw error;
  }

  const region = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';
  const registryHost = `container-registry.${region}.magalu.cloud`;

  return (
    <div className="space-y-6">
      {/* Informações do Registry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{registry.name}</CardTitle>
              <CardDescription>ID: {registry.id}</CardDescription>
            </div>
            <Badge variant="outline">{region}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {registry.storage_usage_bytes > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Uso de Armazenamento
                </p>
                <p className="font-semibold">{formatBytes(registry.storage_usage_bytes)}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Repositórios
              </p>
              <p className="font-semibold">{repositories.length}</p>
            </div>
            {registry.created_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Criado em
                </p>
                <p className="text-sm">
                  {new Date(registry.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Registry Host
              </p>
              <p className="text-sm font-mono">{registryHost}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Repositórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Repositórios ({repositories.length})
          </CardTitle>
          <CardDescription>
            Lista de repositórios de imagens Docker neste registry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {repositories.length === 0 ? (
            <div className="p-10 text-center border rounded bg-muted/50">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum repositório encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {repositories.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/registry/${registryId}/${repo.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-mono">{repo.name}</CardTitle>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardDescription>Docker Repository</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Imagens:</span>
                          <Badge variant="outline">{repo.image_count}</Badge>
                        </div>
                        {repo.created_at && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Criado: {new Date(repo.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        {repo.updated_at && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Atualizado: {new Date(repo.updated_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegistryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/registry">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Registry</h1>
          <p className="text-muted-foreground mt-1">
            Repositórios e imagens Docker
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando detalhes do registry...</p>
          </div>
        }
      >
        <RegistryDetailsWrapper params={params} />
      </Suspense>
    </div>
  );
}

async function RegistryDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RegistryDetails registryId={id} />;
}

