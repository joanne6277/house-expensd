/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users } from 'lucide-react';

interface LedgerHighlightCardProps {
  householdName: string;
  monthlyMetrics: { income: number; expense: number; net: number };
  onOpenConfig: () => void;
}

export function LedgerHighlightCard({
  householdName,
  monthlyMetrics,
  onOpenConfig,
}: LedgerHighlightCardProps) {
  return (
    <section id="ledger-header-card" className="bg-gradient-to-br from-indigo-700 to-indigo-950 rounded-2xl text-white p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">共享帳本</span>
          <h2 className="text-base font-bold tracking-tight mt-0.5">{householdName}</h2>
        </div>
        
        <button 
          id="gear-config-btn" 
          onClick={onOpenConfig}
          className="p-1.5 text-indigo-150 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
          title="修改帳本名稱"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 border-t border-indigo-600/40 pt-3.5">
        <span className="text-[10px] text-indigo-200 font-medium">當前家庭公費餘額 (賸餘款)</span>
        <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
          ${monthlyMetrics.net.toLocaleString()} 元
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/10 text-xs">
        <div>
          <span className="text-indigo-300 text-[10px] block">本月總公費收入</span>
          <div className="text-emerald-400 font-bold mt-1 font-mono">
            +${monthlyMetrics.income.toLocaleString()}
          </div>
        </div>
        <div className="border-l border-indigo-600/30 pl-3.5">
          <span className="text-indigo-300 text-[10px] block">本月總公費支出</span>
          <div className="text-rose-300 font-bold mt-1 font-mono">
            -${monthlyMetrics.expense.toLocaleString()}
          </div>
        </div>
      </div>
    </section>
  );
}
