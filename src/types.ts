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
  createdAt?: any;
  updatedAt?: any;
}

export interface LedgerMember {
  userId: string;
  nickname: string;
  color: string; // Hex or tailwind-friendly indicator (e.g. orange, blue, green)
  lastActive: string; // ISO date-time
}

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
