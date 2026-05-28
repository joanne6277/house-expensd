/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookkeepingRecord, LedgerMember } from './types';

export const SAMPLE_HOUSEHOLD = {
  id: "happy-home-demo",
  name: "溫馨之家公用帳本",
  monthlyBudget: 15000,
};

export const SAMPLE_MEMBERS: LedgerMember[] = [
  { userId: "demo-user-1", nickname: "爸爸 (明華)", color: "sky", lastActive: new Date().toISOString() },
  { userId: "demo-user-2", nickname: "媽媽 (麗雅)", color: "lavender", lastActive: new Date().toISOString() },
  { userId: "demo-user-3", nickname: "女兒 (小晴)", color: "coral", lastActive: new Date().toISOString() }
];

export const SAMPLE_RECORDS: BookkeepingRecord[] = [
  {
    id: "sample-1",
    type: "income",
    category: "公費撥款",
    amount: 15000,
    date: "2026-05-01",
    description: "5月份家庭預算公費撥入",
    createdBy: "demo-user-1",
    creatorName: "爸爸 (明華)"
  },
  {
    id: "sample-2",
    type: "expense",
    category: "水電網路費",
    amount: 2450,
    date: "2026-05-05",
    description: "4-5月份公用電費及光纖網路費",
    createdBy: "demo-user-2",
    creatorName: "媽媽 (麗雅)"
  },
  {
    id: "sample-3",
    type: "expense",
    category: "天然氣燃料",
    amount: 1280,
    date: "2026-05-08",
    description: "欣欣天然氣瓦斯費",
    createdBy: "demo-user-1",
    creatorName: "爸爸 (明華)"
  },
  {
    id: "sample-4",
    type: "expense",
    category: "生活雜費",
    amount: 1850,
    date: "2026-05-12",
    description: "好市多採購衛生紙與洗沐公用品",
    createdBy: "demo-user-3",
    creatorName: "女兒 (小晴)"
  },
  {
    id: "sample-5",
    type: "expense",
    category: "食材雜貨",
    amount: 3200,
    date: "2026-05-15",
    description: "全聯家庭一週生鮮食材採購",
    createdBy: "demo-user-2",
    creatorName: "媽媽 (麗雅)"
  },
  {
    id: "sample-6",
    type: "expense",
    category: "生活雜費",
    amount: 600,
    date: "2026-05-18",
    description: "客廳公用防蚊液與垃圾袋",
    createdBy: "demo-user-3",
    creatorName: "女兒 (小晴)"
  },
  {
    id: "sample-7",
    type: "expense",
    category: "修繕與維護",
    amount: 1500,
    date: "2026-05-20",
    description: "後陽台水龍頭老舊漏水更換",
    createdBy: "demo-user-1",
    creatorName: "爸爸 (明華)"
  },
  {
    id: "sample-8",
    type: "income",
    category: "其它收入",
    amount: 800,
    date: "2026-05-22",
    description: "回收舊家電與紙箱收入",
    createdBy: "demo-user-1",
    creatorName: "爸爸 (明華)"
  }
];
