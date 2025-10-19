import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db, type PreparationSession } from '@/lib/db';
import { PreparationDetails } from '@/features/preparations/PreparationDetails';

export const PreparationDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const loc = useLocation() as { state?: { session?: PreparationSession } };
  const fromState = loc.state?.session;
  const cacheKey = ['session', id];

  console.debug('[prep-detail] id', id, 'fromState?', !!fromState);

  // Warm cache + persist from navigation state so UI is instant
  if (fromState && fromState.id === id) {
    qc.setQueryData(cacheKey, fromState);
    // fire-and-forget upsert; don't block render
    db.sessions.put(fromState).catch(() => {});
  }

  // Safe query: NEVER return undefined
  const sessionQ = useQuery({
    queryKey: cacheKey,
    queryFn: async () => {
      if (!id) return null;
      const rec = await db.sessions.get(id);
      return rec ?? null;  // <-- critical: never return undefined
    },
    initialData: () => (qc.getQueryData(cacheKey) as PreparationSession | null | undefined) ?? null,
    retry: 2,
    retryDelay: 250,
    staleTime: 5_000,
  });

  // Early guards
  if (sessionQ.isLoading) return <div className="p-6">Loading...</div>;
  if (sessionQ.data === null) {
    // Preserve legacy "?f=" bounce
    const f = sp.get('f');
    if (f) {
      navigate(`/formula-first?code=${encodeURIComponent(f)}&auto=start`, { replace: true });
      return null;
    }
    return <div className="p-6">Preparation not found.</div>;
  }

  const session = sessionQ.data as PreparationSession;

  // --- DEFAULT-OPEN PREP FLOW ---
  // If your preparation flow is a modal inside PreparationDetails, we pass flags via props.
  // Mount open state from query params: ?modal=size or ?auto=1
  const [openPrep, setOpenPrep] = useState(false);
  useEffect(() => {
    if (sp.get('modal') === 'size' || sp.get('auto') === '1') {
      setOpenPrep(true);
    }
  }, [sp]);

  // Render detail + pass defaultOpen prop (or use key to force re-mount)
  return (
    <PreparationDetails
      id={id}
      layout="full"
      defaultOpen={openPrep}
      onOpenChange={setOpenPrep}
    />
  );
};


