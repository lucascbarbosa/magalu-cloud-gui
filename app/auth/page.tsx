import { Suspense } from 'react';
import { AuthService } from '@/lib/mgc-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle2, AlertCircle } from 'lucide-react';

async function AuthInfo() {
  let tenant;
  let isValid = false;
  let error: string | null = null;

  try {
    tenant = await AuthService.getCurrentTenant();
    isValid = true;
  } catch (err: any) {
    error = err.message || 'Erro ao validar credenciais';
    // Fallback para informações do .env
    tenant = {
      id: process.env.MGC_TENANT_ID || 'N/A',
      uuid: process.env.MGC_TENANT_ID || 'N/A',
      name: 'Current Tenant',
    };
  }

  const apiKey = process.env.MGC_API_KEY;
  const region = process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status de Autenticação</CardTitle>
            {isValid ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Erro
              </Badge>
            )}
          </div>
          <CardDescription>
            Informações sobre sua conexão com a Magalu Cloud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Tenant ID
              </p>
              <p className="font-mono text-sm break-all">{tenant.uuid}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Tenant Name
              </p>
              <p className="text-sm">{tenant.name || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Região Ativa
              </p>
              <Badge variant="outline">{region}</Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                API Key Configurada
              </p>
              <Badge variant={apiKey ? 'success' : 'destructive'}>
                {apiKey ? 'Sim' : 'Não'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração</CardTitle>
          <CardDescription>
            Como configurar suas credenciais da Magalu Cloud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. Obter API Key</h4>
            <p className="text-sm text-muted-foreground">
              Acesse o portal da Magalu Cloud e gere uma API Key no painel de
              configurações.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. Obter Tenant ID</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Execute o script de setup ou use a CLI oficial:
            </p>
            <div className="bg-slate-900 text-slate-50 p-3 rounded text-xs font-mono">
              bash setup-mgc.sh
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Ou via CLI: <code className="text-xs">mgc auth tenant current</code>
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. Variáveis de Ambiente</h4>
            <p className="text-sm text-muted-foreground mb-2">
              As credenciais são armazenadas em <code className="text-xs">.env.local</code>:
            </p>
            <div className="bg-slate-900 text-slate-50 p-3 rounded text-xs font-mono">
              MGC_API_KEY=your-api-key-here<br />
              MGC_TENANT_ID=your-tenant-id-here<br />
              NEXT_PUBLIC_MGC_REGION=br-se1
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <Key className="inline h-3 w-3 mr-1" />
              As credenciais são processadas apenas no servidor e nunca expostas
              ao navegador por questões de segurança.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Autenticação</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas credenciais e configurações de acesso à Magalu Cloud
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded">
            <p className="text-muted-foreground">Carregando informações de autenticação...</p>
          </div>
        }
      >
        <AuthInfo />
      </Suspense>
    </div>
  );
}

