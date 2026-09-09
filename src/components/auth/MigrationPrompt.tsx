import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { hasPendingLocalData, userHasRemoteData, migrateLocalDataToSupabase, MIGRATION_FLAG_KEY } from '../../lib/supabase/sync';
import { useStore } from '../../store/useStore';

/**
 * Offers a ONE-TIME import of existing localStorage data into Supabase.
 * Never deletes or overwrites the original localStorage data — see
 * migrateLocalDataToSupabase() in lib/supabase/sync.ts. Only shown when:
 *   (a) there is local data that hasn't been marked as migrated yet, AND
 *   (b) this Supabase account has no rows yet (so we never silently
 *       overwrite data that's already there from another device).
 */
export function MigrationPrompt({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const hydrateFromSupabase = useStore((s) => s.hydrateFromSupabase);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasPendingLocalData()) {
        setChecking(false);
        return;
      }
      const remoteHasData = await userHasRemoteData();
      if (!cancelled) {
        setVisible(!remoteHasData);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (checking || !visible) return null;

  const skip = () => setVisible(false);

  const confirmMigrate = async () => {
    setStatus('working');
    setError(null);
    const result = await migrateLocalDataToSupabase(userId);
    if (result.ok) {
      await hydrateFromSupabase(userId);
      setStatus('idle');
      setVisible(false);
    } else {
      setStatus('error');
      setError(result.error ?? 'Migration failed.');
    }
  };

  return (
    <Modal open={visible} onClose={skip} title="Import your local data?" width={440}>
      <p className="text-[13px] text-zinc-400 mb-2">
        We found existing STENNER OS data on this device (tasks, projects, calendar events and more) that hasn't been synced
        to your account yet.
      </p>
      <p className="text-[13px] text-zinc-400">
        Importing copies it to your Supabase account so it's available on your other devices too.{' '}
        <strong className="text-zinc-300">Nothing local is deleted or changed</strong> — this only adds data to the cloud.
      </p>
      {error && <p className="text-[12px] text-red-400 mt-3">{error}</p>}
      <div className="flex items-center justify-end gap-2 mt-5">
        <Button variant="ghost" onClick={skip} disabled={status === 'working'}>
          Not now
        </Button>
        <Button variant="primary" onClick={confirmMigrate} disabled={status === 'working'}>
          {status === 'working' ? 'Importing…' : 'Import to Supabase'}
        </Button>
      </div>
    </Modal>
  );
}

// Re-exported for convenience where a caller only needs the flag key name
// (e.g. debugging/reset flows) without pulling in the rest of sync.ts.
export { MIGRATION_FLAG_KEY };
