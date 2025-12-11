'use client';

import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteImageAction } from './actions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MgcImage } from '@/lib/types';

export function DeleteImageButton({
  registryId,
  repositoryId,
  image,
}: {
  registryId: string;
  repositoryId: string;
  image: MgcImage;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const identifier = image.digest || image.tags?.[0];
    if (!identifier) return;

    const confirmMessage = `Tem certeza que deseja deletar esta imagem?\n\nDigest: ${image.digest}\nTags: ${image.tags?.join(', ') || 'sem tag'}\n\nEsta ação não pode ser desfeita.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteImageAction(registryId, repositoryId, identifier);
      router.refresh();
    } catch (error: any) {
      alert(`Erro ao deletar imagem: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      variant="destructive"
      size="sm"
      className="h-8"
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

