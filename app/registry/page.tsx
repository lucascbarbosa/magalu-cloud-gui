import { Suspense } from 'react';
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

async function RepositoryList() {
  let repositories: string[] = [];
  try {
    repositories = await RegistryService.listRepositories();
  } catch (error: any) {
    return (
      <div className="p-10 text-center border rounded bg-destructive/10">
        <p className="text-destructive">
          Erro ao carregar repositórios: {error.message || 'Erro desconhecido'}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Verifique suas credenciais e permissões de acesso ao Container Registry
        </p>
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="p-10 text-center border rounded bg-muted/50">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum repositório de contêiner encontrado.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Faça push de imagens Docker para começar
        </p>
      </div>
    );
  }

  const region = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';
  const registryHost = `container-registry.${region}.magalu.cloud`;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Card key={repo} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-mono">{repo}</CardTitle>
              <Container className="h-5 w-5 text-muted-foreground" />
            </div>
            <CardDescription>Docker Repository</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Comando Docker:
                </p>
                <div className="bg-slate-900 text-slate-50 p-3 rounded text-xs font-mono break-all">
                  docker pull {registryHost}/{repo}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {region}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
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

