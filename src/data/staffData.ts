export type StaffRole = "PR Manager" | "Stylist" | "Scout" | "Legal Counsel";

export type StaffEffect = {
  negateNegativeReputationLoss?: boolean;
  appearanceCharmReqDiscount?: number;
  monthlyHiddenSJobChance?: number;
  waiveContractPenalty?: boolean;
  endorsementIncomeBonus?: number;
};

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  salary: number;
  buffDesc: string;
  effect: StaffEffect;
}

export const STAFF_POOL: Staff[] = [
  {
    id: "staff_pr_manager_01",
    name: "顾闻舟",
    role: "PR Manager",
    salary: 18000,
    buffDesc: "自动抵消负面事件带来的声望下降（每回合生效一次）。",
    effect: {
      negateNegativeReputationLoss: true,
    },
  },
  {
    id: "staff_stylist_01",
    name: "闻雪",
    role: "Stylist",
    salary: 22000,
    buffDesc: "所有需要颜值/魅力的通告，判定门槛降低 10%。",
    effect: {
      appearanceCharmReqDiscount: 0.1,
    },
  },
  {
    id: "staff_scout_01",
    name: "程野",
    role: "Scout",
    salary: 26000,
    buffDesc: "每月初有概率刷出 S 级隐藏通告。",
    effect: {
      monthlyHiddenSJobChance: 0.2,
    },
  },
  {
    id: "staff_legal_counsel_01",
    name: "许棠",
    role: "Legal Counsel",
    salary: 24000,
    buffDesc: "与原公司解约免违约金；签约新代言时收入 +5%。",
    effect: {
      waiveContractPenalty: true,
      endorsementIncomeBonus: 0.05,
    },
  },
];

