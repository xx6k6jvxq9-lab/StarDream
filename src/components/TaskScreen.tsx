import { useMemo, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import type { GameTime, PhaseTask, Player } from "../gameData";
import { CHARACTER_PROFILE_IMAGES, JOBS, getStatName } from "../gameData";
import { TASK_MENTORS, TASK_TRACK_META, TASK_TRACK_ORDER, type TaskTrack } from "../data/tasks";
import businessMentorImage from "../assets/characters/sy.jpg";
import gamingMentorImage from "../assets/characters/dj.jpg";
import charityMentorImage from "../assets/characters/gy.jpg";
import musicMentorImage from "../assets/characters/yy.jpg";
import danceMentorImage from "../assets/characters/wd.jpg";

type TaskScreenProps = {
  player: Player;
  tasks: PhaseTask[];
  completedTaskIds: string[];
  currentTime: GameTime;
  liuFavor: number;
  getReqCurrentValue: (key: string, player: Player, liuFavor: number) => number;
  onSubmit: (taskId: string) => void;
  isMobileLandscapeViewport?: boolean;
};

const mentorImageById: Record<string, string | undefined> = {
  liu_mengyao: CHARACTER_PROFILE_IMAGES["liu_mengyao"],
  system_business: businessMentorImage,
  system_gaming: gamingMentorImage,
  system_charity: charityMentorImage,
  system_music: musicMentorImage,
  system_dance: danceMentorImage,
};

export default function TaskScreen({
  player,
  tasks,
  completedTaskIds,
  currentTime: _currentTime,
  liuFavor,
  getReqCurrentValue,
  onSubmit,
  isMobileLandscapeViewport = false,
}: TaskScreenProps) {
  const [activeTrack, setActiveTrack] = useState<TaskTrack>(TASK_TRACK_ORDER[0]);

  const completedSet = useMemo(() => new Set(completedTaskIds), [completedTaskIds]);
  const tasksByTrack = useMemo(
    () =>
      TASK_TRACK_ORDER.reduce((acc, track) => {
        acc[track] = tasks.filter((task) => task.track === track);
        return acc;
      }, {} as Record<TaskTrack, PhaseTask[]>),
    [tasks],
  );

  const trackTasks = tasksByTrack[activeTrack] ?? [];
  const taskTitleById = useMemo(
    () =>
      tasks.reduce((acc, task) => {
        acc[task.id] = task.title;
        return acc;
      }, {} as Record<string, string>),
    [tasks],
  );
  const jobTitleById = useMemo(
    () =>
      JOBS.reduce((acc, job) => {
        acc[job.id] = job.name;
        return acc;
      }, {} as Record<string, string>),
    [],
  );

  const completedTrackCount = trackTasks.filter((task) => completedSet.has(task.id)).length;
  const progress = trackTasks.length ? Math.round((completedTrackCount / trackTasks.length) * 100) : 0;
  const levelIndex = progress >= 100 ? 2 : progress >= 50 ? 1 : 0;
  const trackLevel = TASK_TRACK_META[activeTrack].levels[levelIndex];

  const getTaskStatus = (task: PhaseTask): "locked" | "active" | "completed" => {
    if (completedSet.has(task.id)) return "completed";
    const preUnlocked = !task.preTaskId || completedSet.has(task.preTaskId);
    if (!preUnlocked) return "locked";
    if (task.targetJobId && !(player.acceptedJobIds ?? []).includes(task.targetJobId)) return "locked";
    return "active";
  };

  const activeTask = trackTasks.find((task) => getTaskStatus(task) === "active") ?? null;
  const currentMentor = TASK_MENTORS[activeTrack] ?? null;
  const mentorImage = currentMentor ? mentorImageById[currentMentor.id] : undefined;

  const canSubmitTask = (task: PhaseTask | null): boolean => {
    if (!task) return false;
    if (getTaskStatus(task) !== "active") return false;
    if (task.preTaskId && !completedSet.has(task.preTaskId)) return false;
    if (task.requiredItem && !player.inventory.includes(task.requiredItem)) return false;
    if (task.targetJobId && !(player.acceptedJobIds ?? []).includes(task.targetJobId)) return false;
    return Object.entries(task.req).every(([key, target]) => getReqCurrentValue(key, player, liuFavor) >= Number(target));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-zinc-900">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          多赛道职业考核
        </h3>
        <div className="flex flex-wrap gap-2">
          {TASK_TRACK_ORDER.map((track) => (
            <button
              key={track}
              onClick={() => setActiveTrack(track)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                activeTrack === track
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {TASK_TRACK_META[track].label}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-600">{TASK_TRACK_META[activeTrack].label}进度</span>
            <span className="font-bold text-zinc-900">
              {completedTrackCount}/{trackTasks.length} · {trackLevel}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${isMobileLandscapeViewport ? 'grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1 xl:grid-cols-[320px_1fr]'}`}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {mentorImage ? (
              <img
                src={mentorImage}
                alt={currentMentor?.name ?? "导师"}
                className={`${isMobileLandscapeViewport ? 'h-[300px]' : 'h-[360px]'} w-full object-cover ${currentMentor?.id === "liu_mengyao" ? "object-top" : "object-center"}`}
              />
            ) : (
              <div className="flex h-[360px] w-full items-center justify-center text-sm font-bold text-zinc-400">导师联络中</div>
            )}
          </div>
          <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-xs font-bold text-zinc-500">{currentMentor ? `${currentMentor.name} · ${currentMentor.role}` : "赛道导师"}</div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-800">
              {activeTask?.dialogue ?? currentMentor?.line ?? "当前赛道任务已清空，等待新阶段。"}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h4 className="text-base font-bold text-zinc-900">当前任务</h4>
            {activeTask ? (
              <div className="mt-3 space-y-4">
                <div>
                  <div className="text-xl font-black text-zinc-900">{activeTask.title}</div>
                  <div className="mt-1 text-sm text-zinc-600">{activeTask.desc}</div>
                  {activeTask.targetJobId && !(player.acceptedJobIds ?? []).includes(activeTask.targetJobId) && (
                    <div className="mt-2 text-xs font-semibold text-amber-600">
                      ⚠️ 请先前往通告大厅接取《{jobTitleById[activeTask.targetJobId] ?? activeTask.targetJobId}》
                    </div>
                  )}
                  {activeTask.requiredItem && (
                    <div className="mt-2 text-xs font-semibold text-amber-600">前置道具：{activeTask.requiredItem}</div>
                  )}
                </div>
                <div className="space-y-3">
                  {Object.entries(activeTask.req).map(([key, target]) => {
                    const targetNum = Number(target);
                    const isActivated = !activeTask.targetJobId || (player.acceptedJobIds ?? []).includes(activeTask.targetJobId);
                    const current = isActivated ? Math.floor(getReqCurrentValue(key, player, liuFavor)) : 0;
                    const ratio = Math.max(0, Math.min(100, (current / targetNum) * 100));
                    return (
                      <div key={key}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-zinc-600">{getStatName(key) || key}</span>
                          <span className={current >= targetNum ? "font-bold text-emerald-600" : "text-zinc-500"}>
                            {current}/{targetNum}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={`h-full transition-all ${current >= targetNum ? "bg-emerald-500" : "bg-zinc-400"}`}
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => onSubmit(activeTask.id)}
                  disabled={!canSubmitTask(activeTask)}
                  className={`w-full rounded-xl py-3 text-sm font-bold transition ${
                    canSubmitTask(activeTask)
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "cursor-not-allowed bg-zinc-100 text-zinc-400"
                  }`}
                >
                  提交考核
                </button>
              </div>
            ) : (
              <div className="mt-3 text-sm font-bold text-zinc-500">当前无可提交任务（请先在通告大厅接取对应通告）</div>
            )}
          </div>

          <div className={`${isMobileLandscapeViewport ? 'max-h-[360px]' : 'max-h-[440px]'} space-y-2 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm`}>
            <h4 className="text-sm font-bold text-zinc-900">任务列表</h4>
            {trackTasks.map((task) => {
              const status = getTaskStatus(task);
              const done = status === "completed";
              const active = status === "active";
              const unlockedByPre = !task.preTaskId || completedSet.has(task.preTaskId);
              const waitingJob = unlockedByPre && !!task.targetJobId && !(player.acceptedJobIds ?? []).includes(task.targetJobId);

              return (
                <div
                  key={task.id}
                  className={`rounded-xl border p-3 ${
                    done
                      ? "border-emerald-200 bg-emerald-50/70"
                      : active
                        ? "border-zinc-200 bg-white"
                        : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-bold ${done ? "text-emerald-700" : "text-zinc-900"}`}>{task.title}</div>
                    {!done && status === "locked" && <Lock className="h-4 w-4 text-zinc-400" />}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {done
                      ? "已完成"
                      : active
                        ? "进行中"
                        : waitingJob
                          ? `待接取通告：${task.targetJobId ? (jobTitleById[task.targetJobId] ?? task.targetJobId) : "—"}`
                          : `需先完成：${task.preTaskId ? (taskTitleById[task.preTaskId] ?? task.preTaskId) : ""}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
