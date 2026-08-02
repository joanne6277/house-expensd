/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HouseholdLedger {
  id: string;
  name: string;
  monthlyBudget: number;
  createdAt?: any;
}

export interface BookkeepingRecord {
  id: string; // Document ID
  type: 'income' | 'expense';
  category: string; // E.g., 公費收入, 水電費, 網路費, 天然氣費, 生活雜費, 其它
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  createdBy?: string; // uid or user ID
  creatorName?: string; // member's Nickname
  payerId?: string; // 代墊人 ID (選填)
  payerName?: string; // 代墊人暱稱 (選填)
  isSettled?: boolean; // 已結清 (勾選，預設 false/未結清)
  splitWithIds?: string[]; // 分擔人 ID 陣列 (split mode 用，undefined 表示除付款人外全員均分)
  splitShares?: { [userId: string]: number }; // 每位分擔人的實際金額 (有此欄位時優先使用)
  /**
   * 已結清的「成對債務」清單，每個元素是 pairKey() 產生的正規化字串。
   * 一筆三人共用的帳目同時含有兩組獨立債務（各分擔人 → 付款人），
   * 單一個 isSettled 布林值無法只清掉其中一組，故用此欄位記錄到對的層級。
   * isSettled === true 代表整筆全部結清，此時不需再查 settledPairs。
   */
  settledPairs?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface LedgerMember {
  userId: string;
  nickname: string;
  color: string; // Hex or tailwind-friendly indicator (e.g. orange, blue, green)
  lastActive: string; // ISO date-time
}

export type LedgerMode = 'shared' | 'split';

/**
 * 產生兩位成員之間的正規化「對」鍵值（與順序無關），
 * 用於 BookkeepingRecord.settledPairs。
 */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/**
 * 解析一筆分帳紀錄中，每位分擔人各自應付的金額。
 * 優先序：splitShares（自訂金額）→ splitWithIds（均分）→ 除付款人外全員均分。
 */
export function resolveShares(
  record: BookkeepingRecord,
  members: LedgerMember[]
): { [userId: string]: number } {
  const isMember = (id: string) => members.some(m => m.userId === id);

  if (record.splitShares && Object.keys(record.splitShares).length > 0) {
    return Object.fromEntries(
      Object.entries(record.splitShares).filter(([uid]) => isMember(uid))
    );
  }

  if (record.splitWithIds && record.splitWithIds.length > 0) {
    const eligible = record.splitWithIds.filter(isMember);
    const per = eligible.length > 0 ? record.amount / eligible.length : 0;
    return Object.fromEntries(eligible.map(uid => [uid, per]));
  }

  const others = members.filter(m => m.userId !== record.payerId).map(m => m.userId);
  const per = others.length > 0 ? record.amount / others.length : 0;
  return Object.fromEntries(others.map(uid => [uid, per]));
}

/** 該筆紀錄中，debtor → creditor 這組債務是否已結清。 */
export function isPairSettled(
  record: BookkeepingRecord,
  debtor: string,
  creditor: string
): boolean {
  if (record.isSettled) return true;
  return !!record.settledPairs?.includes(pairKey(debtor, creditor));
}

export const SPLIT_CATEGORIES = [
  { name: '餐飲', icon: 'UtensilsCrossed', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { name: '交通', icon: 'Car', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { name: '購物', icon: 'ShoppingBag', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
  { name: '日用品', icon: 'Droplets', color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
  { name: '娛樂', icon: 'Smile', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { name: '其它', icon: 'HelpCircle', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
];

export const PRESET_CATEGORIES = {
  income: [
    { name: '公費撥款', icon: 'Coins', color: 'bg-brand-100 text-brand-700 hover:bg-brand-200' },
    { name: '公費收入', icon: 'PlusCircle', color: 'bg-brand-100 text-brand-700 hover:bg-brand-200' },
    { name: '其它收入', icon: 'TrendingUp', color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
  ],
  expense: [
    { name: '水費', icon: 'Droplets', color: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' },
    { name: '電費', icon: 'Zap', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { name: '網路費', icon: 'Wifi', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { name: '天然氣燃料', icon: 'Flame', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { name: '生活雜費', icon: 'ShoppingBag', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { name: '其它支出', icon: 'HelpCircle', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  ]
};

export const MEMBER_COLORS = [
  { name: '統一橘', value: 'coral', hex: '#fa9016', bgClass: 'bg-rose-500', textClass: 'text-rose-500' },
  { name: '湖水綠', value: 'mint', hex: '#4EAD8A', bgClass: 'bg-emerald-500', textClass: 'text-emerald-500' },
  { name: '晴空藍', value: 'sky', hex: '#4D96FF', bgClass: 'bg-blue-500', textClass: 'text-blue-500' },
  { name: '薰衣草', value: 'lavender', hex: '#9B5DE5', bgClass: 'bg-purple-500', textClass: 'text-purple-500' },
  { name: '向日葵', value: 'yellow', hex: '#F1C40F', bgClass: 'bg-amber-500', textClass: 'text-amber-500' },
];
