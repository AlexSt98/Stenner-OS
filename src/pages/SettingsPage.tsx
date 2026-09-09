import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download,
  RotateCcw,
  Trash2,
  Database,
  KeyRound,
  CalendarDays,
  HardDrive,
  Mail,
  Sparkles,
  Webhook,
  Bot,
  BrainCircuit,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { Label, TextInput } from '../components/common/Fields';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { fetchNexusStatus, type NexusStatus } from '../lib/nexus/client';

const AVATARS = ['🧑‍🎨', '🧑‍💻', '🦊', '🐱', '🐨', '👾', '🪐', '🔥'];

const INTEGRATIONS = [
  { key: 'googleCalendar', name: 'Google Calendar', icon: CalendarDays, desc: 'Two-way sync for events and task blocks.' },
  { key: 'googleDrive', name: 'Google Drive', icon: HardDrive, desc: 'Attach files and references from Drive.' },
  { key: 'gmail', name: 'Gmail', icon: Mail, desc: 'Turn emails into tasks or ideas.' },
] as const;

const ROADMAP = [
  { icon: Database, label: 'PostgreSQL', desc: 'Swap LocalStorage for a real database via the same store interface.' },
  { icon: KeyRound, label: 'Authentication', desc: 'Multi-user accounts and session handling.' },
  { icon: Sparkles, label: 'More AI providers', desc: 'OpenAI and Anthropic are scaffolded in NEXUS — flip AI_PROVIDER once implemented.' },
  { icon: Webhook, label: 'Webhooks', desc: 'Push activity events to external tools.' },
  { icon: Bot, label: 'Automations', desc: 'Rules like "when idea tagged Merch → create task".' },
];

const NEXUS_PROVIDERS = [
  { id: 'gemini', name: 'Gemini', available: true },
  { id: 'openai', name: 'OpenAI', available: false },
  { id: 'claude', name: 'Claude', available: false },
] as const;

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const resetDemoData = useStore((s) => s.resetDemoData);
  const nexusUsage = useStore((s) => s.nexusUsage);
  const pushToast = useToastStore((s) => s.push);
  const fullState = useStore();
  const navigate = useNavigate();

  const [name, setName] = useState(settings.name);
  const [role, setRole] = useState(settings.role);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [nexusStatus, setNexusStatus] = useState<NexusStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    fetchNexusStatus().then(setNexusStatus);
  }, []);

  const refreshNexusStatus = async () => {
    setCheckingStatus(true);
    const status = await fetchNexusStatus(true);
    setNexusStatus(status);
    setCheckingStatus(false);
  };

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
        <div className="flex items-center gap-2 mb-1">
          <BrainCircuit size={15} className="text-violet-400" />
          <h2 className="text-[13px] font-bold text-zinc-300">NEXUS</h2>
        </div>
        <p className="text-[12px] text-zinc-500 mb-4">The intelligence layer of STENNER OS — its own AI provider, kept server-side.</p>

        <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 mb-3.5">
          <span className={`w-2 h-2 rounded-full shrink-0 ${nexusStatus?.connected ? 'bg-green-400' : 'bg-zinc-600'}`} />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium">{nexusStatus?.connected ? 'Connected' : 'Not connected'}</div>
            <div className="text-[11.5px] text-zinc-500">
              {nexusStatus?.connected
                ? `Talking to ${nexusStatus.provider}.`
                : 'Add GEMINI_API_KEY to a .env file (copy .env.example) and restart the server.'}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={refreshNexusStatus} disabled={checkingStatus}>
            <RefreshCw size={12} className={checkingStatus ? 'animate-spin' : ''} /> Recheck
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/nexus')}>
            Open NEXUS
          </Button>
        </div>

        <Label>AI Provider</Label>
        <div className="flex items-center gap-2 mb-4">
          {NEXUS_PROVIDERS.map((p) => (
            <button
              key={p.id}
              disabled={!p.available}
              title={p.available ? undefined : 'Scaffolded — not implemented yet'}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border transition-colors ${
                p.available
                  ? 'border-violet-500 bg-violet-500/15 text-white'
                  : 'border-white/10 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <Label>API configuration</Label>
        <div className="flex items-center gap-2 mb-4">
          <code className="stenner-input px-3 py-2 text-[12.5px] font-mono text-zinc-500 flex-1">
            {nexusStatus?.connected ? '••••••••••••••••' : 'not set'}
          </code>
        </div>

        <Label>Usage today</Label>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="stenner-card px-3 py-2.5">
            <div className="text-[10px] text-zinc-500">Requests</div>
            <div className="text-[15px] font-bold mt-0.5">{nexusUsage.requests}</div>
          </div>
          <div className="stenner-card px-3 py-2.5">
            <div className="text-[10px] text-zinc-500">Tokens used</div>
            <div className="text-[15px] font-bold mt-0.5">{nexusUsage.totalTokens.toLocaleString()}</div>
          </div>
          <div className="stenner-card px-3 py-2.5">
            <div className="text-[10px] text-zinc-500">Est. cost</div>
            <div className="text-[15px] font-bold mt-0.5">
              ${((nexusUsage.promptTokens * 0.1 + nexusUsage.completionTokens * 0.4) / 1_000_000).toFixed(4)}
            </div>
          </div>
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
