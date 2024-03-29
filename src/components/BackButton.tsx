'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { LuArrowLeft } from 'react-icons/lu';
import { useRouter } from 'next/navigation';

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={() => (href ? router.replace(href) : router.back())} size="icon" variant="ghost">
          <LuArrowLeft className="h-6 w-6" />
          <p className="sr-only">Back</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Back</TooltipContent>
    </Tooltip>
  );
}
