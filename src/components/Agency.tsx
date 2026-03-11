import { useMemo, useState } from "react";
import {
  Battery,
  Building2,
  Coins,
  Crown,
  Map,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  type Action,
  type Company,
  type FacilityId,
  type GameTime,
  type Player,
  type Stats,
  ACTIONS,
  COMPANIES,
  FACILITIES,
} from "../gameData";
import type { CompanyState } from "../store/useGameStore";
import { STAFF_POOL } from "../data/staffData";
import { useViewportMode } from "./GameViewport";

const BOSS_MODE_COST = 200000;

type AgencyProps = {
  player: Player;
  time: GameTime;
  effectiveStats: Stats;
  companyState: CompanyState;
  getStatName: (key: string) => string;
  formatDisplayTime: (time: GameTime) => string;
  onUpgradeFacility: (facilityId: FacilityId) => void;
  onPerformAction: (action: Action) => void;
  onAddToSchedule: (action: Action) => void;
  onSwitchCompany: (companyId: string) => void;
  onCreateBossMode: (companyName: string, startupCost: number) => void;
  onHireStaff: (staffId: string) => void;
  onFireStaff: (staffId: string) => void;
};

export default function Agency({
  player,
  time,
  effectiveStats,
  companyState,
  getStatName,
  formatDisplayTime,
  onUpgradeFacility,
  onPerformAction,
  onAddToSchedule,
  onSwitchCompany,
  onCreateBossMode,
  onHireStaff,
  onFireStaff,
}: AgencyProps) {
  const { isMobileLandscape } = useViewportMode();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const currentCompany = COMPANIES.find((c) => c.id === player.companyId);
  const canUnlockBossMode = player.money > 500000 && (player.reputation > 1000 || player.stats.popularity > 1000);
  const hiredStaff = STAFF_POOL.filter((s) => companyState.hiredStaffIds.includes(s.id));
  const companyActions = ACTIONS.company ?? [];

  const switchCandidates = useMemo(
    () => COMPANIES.filter((c) => c.id !== player.companyId),
    [player.companyId],
  );

  const getPenalty = (company: Company): number => {
    if (!player.contractEnd) return 0;
    const isContractActive =
      time.year < player.contractEnd.year ||
      (time.year === player.contractEnd.year && time.month < player.contractEnd.month) ||
      (time.year === player.contractEnd.year &&
        time.month === player.contractEnd.month &&
        time.week < player.contractEnd.week);
    return isContractActive ? company.penalty : 0;
  };

  const handleCreateBossMode = () => {
    const name = newCompanyName.trim();
    if (!name || !canUnlockBossMode) return;
    onCreateBossMode(name, BOSS_MODE_COST);
    setIsCreateModalOpen(false);
    setNewCompanyName("");
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Building2 className="w-24 h-24 text-zinc-900" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1 tracking-widest">
              {companyState.isBoss ? "老板模式" : "当前签约公司"}
            </div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">
              {companyState.isBoss ? companyState.companyName : currentCompany?.name}
            </h3>
            <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
              {companyState.isBoss
                ? "你已自立门户，开始打造自己的娱乐帝国。"
                : currentCompany?.desc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">合同到期</div>
              <div className="text-sm font-bold text-zinc-900">
                {player.contractEnd ? formatDisplayTime(player.contractEnd) : "长期合作"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">公司抽成</div>
              <div className="text-sm font-bold text-zinc-900">
                {companyState.isBoss ? "0%" : `${Math.round((currentCompany?.commission || 0) * 100)}%`}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">违约金</div>
              <div className="text-sm font-bold text-red-500">
                ￥{(currentCompany?.penalty || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">专属福利</div>
              <div className="text-sm font-bold text-emerald-600">
                {companyState.isBoss ? "老板自主运营增益" : currentCompany?.perk}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          公司设施
        </h3>
        <div className={`grid gap-4 ${isMobileLandscape ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {Object.values(FACILITIES).map((facility) => {
            const currentLevel = Number(player.facilities[facility.id] ?? 0);
            const isMaxLevel = currentLevel >= facility.levels.length;
            const nextLevelData = isMaxLevel ? null : facility.levels[currentLevel];

            return (
              <div key={facility.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-zinc-900">{facility.name}</h4>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    Lv.{currentLevel}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-4 flex-1">{facility.desc}</p>

                {nextLevelData ? (
                  <div className="space-y-3">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">下一级预览</div>
                    <div className="text-xs font-medium text-emerald-600">{nextLevelData.bonusDesc}</div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>费用: ￥{nextLevelData.cost.money.toLocaleString()}</span>
                      <span>耗时: {nextLevelData.cost.time} 天</span>
                    </div>
                    <button
                      onClick={() => onUpgradeFacility(facility.id)}
                      disabled={player.money < nextLevelData.cost.money}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        player.money >= nextLevelData.cost.money
                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      升级设施
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs font-bold text-zinc-400 bg-zinc-50 rounded-xl">已达到最高等级</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {companyActions.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            进修学习
          </h3>
          <div className={`grid gap-3 ${isMobileLandscape ? "grid-cols-3" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {companyActions.map((action) => (
              <div
                key={action.id}
                className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all duration-300 group flex flex-col"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-bold text-zinc-900">{action.name}</h3>
                  <span className="text-[10px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 font-medium">
                    耗时 {action.time} 天
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3 leading-relaxed flex-1">{action.desc}</p>
                <div className="flex items-center gap-2 text-xs font-medium mb-3">
                  {action.cost.stamina > 0 && (
                    <span className="flex items-center gap-1 text-zinc-600">
                      <Battery className="w-3 h-3 text-zinc-400" />-{action.cost.stamina}
                    </span>
                  )}
                  {action.cost.money > 0 && (
                    <span className="flex items-center gap-1 text-zinc-600">
                      <Coins className="w-3 h-3 text-zinc-400" />-{action.cost.money}
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5 mt-auto">
                  <button
                    onClick={() => onPerformAction(action)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
                  >
                    执行
                  </button>
                  <button
                    onClick={() => onAddToSchedule(action)}
                    className="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 py-1.5 rounded text-xs font-bold transition-colors"
                  >
                    加入行程
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {companyState.isBoss ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            员工管理
          </h3>

          <div className="bg-white border border-zinc-200 rounded-2xl p-4">
            <div className="text-xs text-zinc-400 uppercase font-bold mb-2 tracking-wide">当前公司 Buff</div>
            {hiredStaff.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {hiredStaff.map((staff) => (
                  <span key={staff.id} className="text-xs font-semibold px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
                    {staff.name}：{staff.buffDesc}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-zinc-500">尚未雇佣员工。</div>
            )}
          </div>

          <div className={`grid gap-4 ${isMobileLandscape ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
            {STAFF_POOL.map((staff) => {
              const hired = companyState.hiredStaffIds.includes(staff.id);
              const canHire = player.money >= staff.salary;
              return (
                <div key={staff.id} className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-zinc-900">{staff.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-bold">
                      {staff.role}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">{staff.buffDesc}</p>
                  <div className="text-xs text-zinc-600 mb-4">薪水：￥{staff.salary.toLocaleString()} / 回合</div>
                  {hired ? (
                    <button
                      onClick={() => onFireStaff(staff.id)}
                      className="w-full py-2 rounded-xl text-xs font-bold transition-all bg-zinc-100 hover:bg-zinc-200 text-zinc-800"
                    >
                      解雇
                    </button>
                  ) : (
                    <button
                      onClick={() => onHireStaff(staff.id)}
                      disabled={!canHire}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        canHire ? "bg-zinc-900 text-white hover:bg-zinc-800" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      招募（支付 ￥{staff.salary.toLocaleString()}）
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-500" />
            寻找新东家
          </h3>

          <div className={`grid gap-4 mb-4 ${isMobileLandscape ? "grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
            <div
              className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col ${
                canUnlockBossMode ? "border-zinc-200" : "border-zinc-100 opacity-70"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  成立个人娱乐帝国
                </h4>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">置顶机会</span>
              </div>
              <p className="text-xs text-zinc-500 mb-3 flex-1">
                自立门户，组建自己的公司与班底。开启老板模式后，将切换为员工管理体系。
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${player.money > 500000 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  资金 &gt; 500,000
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    player.reputation > 1000 || player.stats.popularity > 1000
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  声望/人气 &gt; 1,000
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-50 text-amber-600">
                  启动资金 ￥{BOSS_MODE_COST.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={!canUnlockBossMode}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                  canUnlockBossMode
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}
              >
                开启老板模式
              </button>
            </div>

            {switchCandidates.map((company) => {
              const isMet =
                (!company.minPopularity || player.stats.popularity >= company.minPopularity) &&
                (!company.minStats ||
                  Object.entries(company.minStats).every(([k, v]) => effectiveStats[k as keyof Stats] >= (v as number)));
              const penalty = currentCompany ? getPenalty(currentCompany) : 0;

              return (
                <div
                  key={company.id}
                  className={`bg-white p-5 rounded-2xl border ${isMet ? "border-zinc-200" : "border-zinc-100 opacity-60"} shadow-sm flex flex-col`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-zinc-900">{company.name}</h4>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">抽成 {Math.round(company.commission * 100)}%</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">合同 {company.contractDuration * 7} 天</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mb-4 flex-1">{company.desc}</p>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {company.minPopularity && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            player.stats.popularity >= company.minPopularity ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                          }`}
                        >
                          人气 {company.minPopularity}
                        </span>
                      )}
                      {company.minStats &&
                        Object.entries(company.minStats).map(([k, v]) => (
                          <span
                            key={k}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              effectiveStats[k as keyof Stats] >= (v as number) ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}
                          >
                            {getStatName(k)} {v}
                          </span>
                        ))}
                      {penalty > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-bold">
                          违约金 ￥{penalty.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onSwitchCompany(company.id)}
                      disabled={!isMet || player.money < penalty}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                        isMet && player.money >= penalty
                          ? "bg-zinc-900 text-white hover:bg-zinc-800"
                          : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      }`}
                    >
                      {penalty > 0 ? "支付违约金并签约" : "签约"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 shadow-xl p-5">
            <h4 className="text-lg font-bold text-zinc-900 mb-2">成立个人娱乐帝国</h4>
            <p className="text-sm text-zinc-500 mb-4">输入公司名称后将开启老板模式，并扣除启动资金 ￥{BOSS_MODE_COST.toLocaleString()}。</p>
            <input
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              placeholder="请输入公司名称"
              className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-900/10"
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateBossMode}
                disabled={!newCompanyName.trim() || !canUnlockBossMode}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                  newCompanyName.trim() && canUnlockBossMode
                    ? "bg-zinc-900 text-white hover:bg-zinc-800"
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}
              >
                确认成立
              </button>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
