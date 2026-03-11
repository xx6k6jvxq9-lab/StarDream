import { Lock } from 'lucide-react';
import { CHARACTER_PROFILES, CHARACTER_PROFILE_IMAGES } from '../gameData';
import { CHARACTER_NAMES, type CharacterId, useGameStore } from '../store/useGameStore';

type CharacterCardProps = {
  characterId: CharacterId;
  minimal?: boolean;
};

const stageLabels: Record<string, { label: string; badgeClass: string }> = {
  guarded: { label: '警戒', badgeClass: 'bg-zinc-100 text-zinc-700' },
  warming: { label: '暖昧', badgeClass: 'bg-rose-100 text-rose-700' },
  dependent: { label: '依赖', badgeClass: 'bg-amber-100 text-amber-700' },
  obsessive: { label: '偏执', badgeClass: 'bg-red-100 text-red-700' },
  fractured: { label: '破裂', badgeClass: 'bg-slate-200 text-slate-700' },
};

export default function CharacterCard({ characterId, minimal = false }: CharacterCardProps) {
  const character = useGameStore((state) => state.characters[characterId]);
  const unlocked = useGameStore((state) => state.characterUnlocks[characterId]);
  const name = CHARACTER_NAMES[characterId] ?? characterId;
  const image = CHARACTER_PROFILE_IMAGES[characterId];
  const surface = CHARACTER_PROFILES[characterId]?.surface ?? '暂无设定';

  const stageKey = character?.stage ?? 'guarded';
  const stage = stageLabels[stageKey] ?? stageLabels.guarded;
  const favor = character?.favor ?? 0;
  const favorLocked = character?.favorLocked ?? false;
  const safeFavor = Math.max(0, Math.min(100, favor));

  if (minimal) {
    return (
      <article className="h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-64 w-full bg-zinc-100">
          {image ? (
            <img src={image} alt={name} className={`h-full w-full object-cover ${unlocked ? '' : 'grayscale opacity-55'}`} />
          ) : (
            <div className="h-full w-full bg-zinc-200" />
          )}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-zinc-500">
                <Lock className="h-4 w-4" />
                未解锁
              </span>
            </div>
          )}
        </div>
        <div className={`px-4 py-3 text-2xl font-bold ${unlocked ? 'text-zinc-900' : 'text-zinc-400'}`}>{name}</div>
      </article>
    );
  }

  return (
    <article className="h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="h-56 w-full bg-zinc-100">
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-contain bg-zinc-50" />
        ) : (
          <div className="h-full w-full bg-zinc-200" />
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl font-bold text-zinc-900">{name}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stage.badgeClass}`}>
            {stage.label}
          </span>
        </div>

        <p className="max-h-[72px] overflow-hidden text-sm leading-6 text-zinc-600">{surface}</p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
            <span>好感度</span>
            <span className="font-mono text-zinc-700">{safeFavor}</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${favorLocked ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${safeFavor}%` }}
            />
            {favorLocked && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-0.5 shadow">
                <Lock className="h-3 w-3 text-amber-700" />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
