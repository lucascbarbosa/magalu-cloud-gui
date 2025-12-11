'use server';

import { RegistryService } from '@/lib/mgc-client';
import { revalidatePath } from 'next/cache';

export async function deleteImageAction(
  registryId: string,
  repositoryId: string,
  digestOrTag: string
) {
  try {
    await RegistryService.deleteImage(registryId, repositoryId, digestOrTag);
    revalidatePath(`/registry/${registryId}/${repositoryId}`);
    return { success: true };
  } catch (err: any) {
    throw new Error(`Erro ao deletar imagem: ${err.message || err}`);
  }
}

