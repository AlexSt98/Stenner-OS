import { CalendarDays } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToastStore } from '../../store/useToastStore';

/**
 * Inert by design — src/lib/integrations/googleCalendar.connect() throws
 * until OAuth credentials exist. Clicking it surfaces that honestly instead
 * of pretending to connect.
 */
export function GoogleCalendarConnect() {
  const connected = useStore((s) => s.settings.integrations.googleCalendar.connected);
  const pushToast = useToastStore((s) => s.push);

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.02]">
      <CalendarDays size={14} className="text-zinc-500" />
      <div className="leading-tight">
        <div className="text-[12px] font-medium text-zinc-300">Google Calendar</div>
        <div className="text-[10.5px] text-zinc-500">{connected ? 'Connected' : 'Not connected'}</div>
      </div>
      <button
        onClick={() => pushToast('Google Calendar needs OAuth credentials — coming soon')}
        className="ml-auto text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300"
      >
        Connect
      </button>
    </div>
  );
}
