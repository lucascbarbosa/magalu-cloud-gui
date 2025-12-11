import { Suspense } from 'react';
import Link from 'next/link';
import { RegistryService } from '@/lib/mgc-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Container, Package } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function RepositoryList() {
  let registries = [];
  try {
    registries = await RegistryService.listRegistries();
  } catch (error: any) {
    return (
      <div className="p-10 text-center border rounded bg-destructive/10">
        <p className="text-destructive">
          Erro ao carregar registries: {error.message || 'Erro desconhecido'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Verifique suas credenciais e permissões de acesso ao Container Registry
        </p>
      </div>
    );
  }

  if (registries.length === 0) {
    return (
      <div className="p-10 text-center border rounded bg-muted/50">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum registry encontrado.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Crie um registry ou faça push de imagens Docker para começar
        </p>
      </div>
    );
  }

  const region = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';
  const registryHost = `container-registry.${region}.magalu.cloud`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {registries.map((registry) => (
        <Link key={registry.id} href={`/registry/${registry.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-mono">{registry.name}</CardTitle>
              <Container className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Container Registry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Comando Docker:
                </p>
                <div className="bg-slate-900 text-slate-50 p-3 rounded text-xs font-mono break-all">
                  docker pull {registryHost}/{registry.name}
                </div>
              </div>
              {registry.storage_usage_bytes > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Uso de Armazenamento:
                  </p>
                  <p className="text-sm font-semibold">
                    {formatBytes(registry.storage_usage_bytes)}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {region}
                </Badge>
                {registry.created_at && (
                  <Badge variant="outline" className="text-xs">
                    Criado: {new Date(registry.created_at).toLocaleDateString('pt-BR')}
                  </Badge>
                )}
              </div>
              {registry.id && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-mono text-muted-foreground">
                    ID: {registry.id}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </Link>
      ))}
    </div>
  );
}

export default function RegistryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Container Registry</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seus repositórios de imagens Docker na Magalu Cloud
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando repositórios...</p>
          </div>
        }
      >
        <RepositoryList />
      </Suspense>
    </div>
  );
}


