import { useState } from 'react';
import { Download, RotateCcw, Trash2, Database, KeyRound, CalendarDays, HardDrive, Mail, Sparkles, Webhook, Bot } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { Label, TextInput } from '../components/common/Fields';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const AVATARS = ['🧑‍🎨', '🧑‍💻', '🦊', '🐱', '🐨', '👾', '🪐', '🔥'];

const INTEGRATIONS = [
  { key: 'googleCalendar', name: 'Google Calendar', icon: CalendarDays, desc: 'Two-way sync for events and task blocks.' },
  { key: 'googleDrive', name: 'Google Drive', icon: HardDrive, desc: 'Attach files and references from Drive.' },
  { key: 'gmail', name: 'Gmail', icon: Mail, desc: 'Turn emails into tasks or ideas.' },
] as const;

const ROADMAP = [
  { icon: Database, label: 'PostgreSQL', desc: 'Swap LocalStorage for a real database via the same store interface.' },
  { icon: KeyRound, label: 'Authentication', desc: 'Multi-user accounts and session handling.' },
  { icon: Sparkles, label: 'AI', desc: 'Smart task suggestions, idea summarization, auto-scheduling.' },
  { icon: Webhook, label: 'Webhooks', desc: 'Push activity events to external tools.' },
  { icon: Bot, label: 'Automations', desc: 'Rules like "when idea tagged Merch → create task".' },
];

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemoData = useStore((s) => s.resetDemoData);
  const pushToast = useToastStore((s) => s.push);
  const fullState = useStore();

  const [name, setName] = useState(settings.name);
  const [role, setRole] = useState(settings.role);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const saveProfile = () => {
    updateSettings({ name: name.trim() || settings.name, role: role.trim() || settings.role });
    pushToast('Profile updated');
  };

  const exportData = () => {
    const data = {
      tasks: fullState.tasks,
      projects: fullState.projects,
      events: fullState.events,
      timeSessions: fullState.timeSessions,
      ideas: fullState.ideas,
      boards: fullState.boards,
      activities: fullState.activities,
      settings: fullState.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stenner-os-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Exported data');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-[20px] font-bold">Settings</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Your profile, integrations and data.</p>
      </div>

      <div className="stenner-card p-5">
        <h2 className="text-[13px] font-bold text-zinc-300 mb-4">PROFILE</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-[28px]">
            {settings.avatarEmoji}
          </div>
          <div className="flex flex-wrap gap-1.5 max-w-xs">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => updateSettings({ avatarEmoji: a })}
                className={`w-8 h-8 rounded-lg text-[16px] flex items-center justify-center border transition-colors ${
                  settings.avatarEmoji === a ? 'border-violet-500 bg-violet-500/15' : 'border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <TextInput value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
        </div>
        <Button variant="primary" size="sm" className="mt-4" onClick={saveProfile}>
          Save profile
        </Button>
      </div>

      <div className="stenner-card p-5">
        <h2 className="text-[13px] font-bold text-zinc-300 mb-1">INTEGRATIONS</h2>
        <p className="text-[12px] text-zinc-500 mb-4">Connections require credentials that aren't configured yet — the plumbing is ready.</p>
        <div className="space-y-2.5">
          {INTEGRATIONS.map((i) => (
            <div key={i.key} className="flex items-center gap-3 p-3 rounded-xl border border-white/10">
              <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center text-zinc-400 shrink-0">
                <i.icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium">{i.name}</div>
                <div className="text-[11.5px] text-zinc-500">{i.desc}</div>
              </div>
              <Button variant="secondary" size="sm" disabled title="Coming soon — needs OAuth credentials">
                Connect
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="stenner-card p-5">
        <h2 className="text-[13px] font-bold text-zinc-300 mb-1">ARCHITECTURE ROADMAP</h2>
        <p className="text-[12px] text-zinc-500 mb-4">V1 runs fully local. These are wired for later, not active yet.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {ROADMAP.map((r) => (
            <div key={r.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03]">
              <r.icon size={15} className="text-zinc-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-[12.5px] font-medium text-zinc-300">{r.label}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stenner-card p-5">
        <h2 className="text-[13px] font-bold text-zinc-300 mb-4">DATA</h2>
        <p className="text-[12px] text-zinc-500 mb-4">Everything lives in your browser's LocalStorage — nothing leaves this device.</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="sm" onClick={exportData}>
            <Download size={13} /> Export data (.json)
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={13} /> Reset to demo data
          </Button>
          <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
            <Trash2 size={13} /> Clear all data
          </Button>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset to demo data?"
        width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                resetDemoData();
                setConfirmReset(false);
                pushToast('Demo data restored');
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400">This replaces everything with the original seed data. Your current tasks, projects and ideas will be lost.</p>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Clear all data?"
        width={380}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                localStorage.removeItem('stenner-os-storage-v1');
                window.location.reload();
              }}
            >
              Clear everything
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-zinc-400">This permanently wipes all tasks, projects, ideas, boards and time sessions. This can't be undone.</p>
      </Modal>
    </div>
  );
}
