import { K8sService } from '@/lib/mgc-client';
import { createClusterAction } from '../actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function FlavorSelect() {
  let flavors;
  try {
    flavors = await K8sService.listFlavors();
  } catch {
    // Fallback para flavors conhecidos
    flavors = [
      { name: 'cloud-k8s.gp1.small', vcpu: 2, ram: 4 },
      { name: 'cloud-k8s.gp1.medium', vcpu: 4, ram: 8 },
      { name: 'cloud-k8s.gp1.large', vcpu: 8, ram: 16 },
    ];
  }

  return (
    <Select name="flavor" required>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um flavor" />
      </SelectTrigger>
      <SelectContent>
        {flavors.map((flavor) => (
          <SelectItem key={flavor.name} value={flavor.name}>
            {flavor.name} ({flavor.vcpu} vCPU, {flavor.ram}GB RAM)
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CreateClusterPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/kubernetes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Novo Cluster</h1>
          <p className="text-muted-foreground mt-1">
            Configure um novo cluster Kubernetes na Magalu Cloud
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Cluster</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar um novo cluster Kubernetes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createClusterAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cluster *</Label>
              <Input
                id="name"
                name="name"
                placeholder="meu-cluster"
                required
                minLength={3}
                maxLength={50}
              />
              <p className="text-sm text-muted-foreground">
                Nome único para identificar o cluster (3-50 caracteres)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="version">Versão do Kubernetes</Label>
              <Input
                id="version"
                name="version"
                placeholder="v1.28.5"
                defaultValue="v1.28.5"
              />
              <p className="text-sm text-muted-foreground">
                Versão do Kubernetes a ser instalada
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flavor">Flavor (Tamanho da Máquina) *</Label>
              <FlavorSelect />
              <p className="text-sm text-muted-foreground">
                Tamanho das máquinas virtuais do cluster
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nodes">Número de Nós *</Label>
              <Input
                id="nodes"
                name="nodes"
                type="number"
                min="1"
                max="10"
                defaultValue="2"
                required
              />
              <p className="text-sm text-muted-foreground">
                Número inicial de nós no cluster (1-10)
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Criar Cluster</Button>
              <Link href="/kubernetes">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

