/**
 * @file page.tsx
 * @description Instruments 예시 페이지
 *
 * Supabase 공식 Next.js 가이드의 예시를 구현한 페이지입니다.
 * instruments 테이블의 데이터를 조회하여 표시합니다.
 *
 * @see https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 */

import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    .from('instruments')
    .select();

  if (error) {
    console.error('Error fetching instruments:', error);
    return (
      <div className="p-4 text-red-600">
        Error loading instruments: {error.message}
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="p-4">
        <p>No instruments found.</p>
        <p className="mt-2 text-sm text-gray-600">
          Please create the instruments table and add some data in Supabase
          Dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Instruments</h2>
      <ul className="space-y-2">
        {instruments.map((instrument: { id: number; name: string }) => (
          <li
            key={instrument.id}
            className="p-2 border rounded hover:bg-gray-50"
          >
            {instrument.name}
          </li>
        ))}
      </ul>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">
          View raw JSON
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
          {JSON.stringify(instruments, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default function Instruments() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Supabase Integration Test</h1>
      <Suspense fallback={<div className="p-4">Loading instruments...</div>}>
        <InstrumentsData />
      </Suspense>
    </div>
  );
}

