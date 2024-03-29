'use client';

import { useEffect } from 'react';
import { LuLoader2 } from 'react-icons/lu';
import { BASE_URL } from '~/utils/constants';

export default function SuccessPage() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (typeof window.opener !== 'undefined' && window.opener) {
      (window.opener as Window).postMessage('success', BASE_URL ?? '*');
    }
    window.close();
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center">
      <LuLoader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}
