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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Calendar, Image as ImageIcon, Trash2, HardDrive } from 'lucide-react';
import { notFound } from 'next/navigation';
import { DeleteImageButton } from './delete-button';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

async function RepositoryDetails({
  registryId,
  repositoryId,
}: {
  registryId: string;
  repositoryId: string;
}) {
  let repository;
  let images = [];

  try {
    repository = await RegistryService.getRepository(registryId, repositoryId);
    images = await RegistryService.listImages(registryId, repositoryId);
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
      {/* Informações do Repositório */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{repository.name}</CardTitle>
              <CardDescription>ID: {repository.id}</CardDescription>
            </div>
            <Badge variant="outline">{repository.registry_name}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Total de Imagens
              </p>
              <p className="font-semibold">{repository.image_count}</p>
            </div>
            {repository.created_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Criado em
                </p>
                <p className="text-sm">
                  {new Date(repository.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            {repository.updated_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Atualizado em
                </p>
                <p className="text-sm">
                  {new Date(repository.updated_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Docker Pull
              </p>
              <p className="text-sm font-mono text-xs">
                {registryHost}/{repository.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Imagens/Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagens e Tags ({images.length})
          </CardTitle>
          <CardDescription>
            Lista de imagens Docker com suas tags e informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="p-10 text-center border rounded bg-muted/50">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma imagem encontrada.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tags</TableHead>
                    <TableHead>Digest</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Push</TableHead>
                    <TableHead>Pull</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image) => (
                    <TableRow key={image.digest}>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {image.tags && image.tags.length > 0 ? (
                            image.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="font-mono">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">sem tag</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                          {image.digest}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatBytes(image.size_bytes)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {image.pushed_at
                            ? new Date(image.pushed_at).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {image.pulled_at
                            ? new Date(image.pulled_at).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteImageButton
                          registryId={registryId}
                          repositoryId={repositoryId}
                          image={image}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string; repositoryId: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Suspense fallback={<Button variant="ghost" size="icon" disabled><ArrowLeft className="h-4 w-4" /></Button>}>
          <BackButton params={params} />
        </Suspense>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Detalhes do Repositório</h1>
          <p className="text-muted-foreground mt-1">
            Imagens Docker e tags
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando detalhes do repositório...</p>
          </div>
        }
      >
        <RepositoryDetailsWrapper params={params} />
      </Suspense>
    </div>
  );
}

async function RepositoryDetailsWrapper({
  params,
}: {
  params: Promise<{ id: string; repositoryId: string }>;
}) {
  const { id, repositoryId } = await params;
  return <RepositoryDetails registryId={id} repositoryId={repositoryId} />;
}

async function BackButton({
  params,
}: {
  params: Promise<{ id: string; repositoryId: string }>;
}) {
  const { id } = await params;
  return (
    <Link href={`/registry/${id}`}>
      <Button variant="ghost" size="icon">
        <ArrowLeft className="h-4 w-4" />
      </Button>
    </Link>
  );
}

