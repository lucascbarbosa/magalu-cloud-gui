'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REGIONS = [
  { value: 'br-se1', label: 'Sudeste (br-se1)' },
  { value: 'br-ne1', label: 'Nordeste (br-ne1)' },
];

function RegionSelectInner() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRegion, setCurrentRegion] = useState('br-se1');

  useEffect(() => {
    // Lê a região da URL ou do ambiente
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const region = params.get('region') || process.env.NEXT_PUBLIC_MGC_REGION || 'br-se1';
      setCurrentRegion(region);
    }
  }, []);

  const handleRegionChange = (value: string) => {
    setCurrentRegion(value);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('region', value);
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    }
  };

  return (
    <Select value={currentRegion} onValueChange={handleRegionChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione a região" />
      </SelectTrigger>
      <SelectContent>
        {REGIONS.map((region) => (
          <SelectItem key={region.value} value={region.value}>
            {region.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RegionSelect() {
  return (
    <Suspense fallback={
      <div className="w-[200px] h-10 border rounded-md bg-muted animate-pulse" />
    }>
      <RegionSelectInner />
    </Suspense>
  );
}

