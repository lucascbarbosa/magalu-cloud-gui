import { NextRequest, NextResponse } from 'next/server';
import { K8sService } from '@/lib/mgc-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const clusterId = searchParams.get('clusterId');

  if (!clusterId) {
    return NextResponse.json(
      { error: 'clusterId é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const { kubeconfig } = await K8sService.getKubeconfig(clusterId);

    return new NextResponse(kubeconfig, {
      headers: {
        'Content-Type': 'application/yaml',
        'Content-Disposition': `attachment; filename="kubeconfig-${clusterId}.yaml"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao obter kubeconfig' },
      { status: 500 }
    );
  }
}

