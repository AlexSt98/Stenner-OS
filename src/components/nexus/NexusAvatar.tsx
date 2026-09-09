import { NEXUS_AVATAR_URL } from '../../lib/nexus/identity';

interface NexusAvatarProps {
  size?: number;
  glow?: boolean;
  className?: string;
}

/** NEXUS's one visual identity, used everywhere it "speaks" — chat, its home header, the sidebar, thinking state. */
export function NexusAvatar({ size = 40, glow = false, className = '' }: NexusAvatarProps) {
  return (
    <div
      className={`shrink-0 rounded-full overflow-hidden ${glow ? 'ring-2 ring-violet-500/30' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        boxShadow: glow ? '0 0 24px 4px rgba(139, 92, 246, 0.25), 0 0 8px 1px rgba(59, 130, 246, 0.2)' : undefined,
      }}
    >
      <img src={NEXUS_AVATAR_URL} alt="NEXUS" className="w-full h-full object-cover" />
    </div>
  );
}
