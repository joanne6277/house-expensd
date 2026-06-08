/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users } from 'lucide-react';
import { LedgerMode } from '../types';

interface SplitBalance {
  balanced: boolean;
  settlements: { from: string; to: string; amount: number }[];
  totalAll: number;
  memberTotals: { nickname: string; paid: number }[];
}

interface LedgerHighlightCardProps {
  householdName: string;
  monthlyMetrics: { income: number; expense: number; net: number };
  onOpenConfig: () => void;
  ledgerMode?: LedgerMode;
  splitBalance?: SplitBalance | null;
  selectedMonth?: string;
}

export function LedgerHighlightCard({
  householdName,
  monthlyMetrics,
  onOpenConfig,
  ledgerMode = 'shared',
  splitBalance,
  selectedMonth,
}: LedgerHighlightCardProps) {
  const isSplit = ledgerMode === 'split';

  return (
    <section id="ledger-header-card" className="bg-linear-to-br from-brand-400 to-brand-700 rounded-2xl text-white p-5 shadow-sm flex flex-col gap-4">
      <div className="card-header">
        <div className="flex flex-col">
          <span className="text-[10px] text-brand-300 font-semibold uppercase tracking-wider">
            {isSplit ? '雙人分帳' : '共享帳本'}
          </span>
          <h2 className="text-base font-bold tracking-tight mt-0.5">{householdName}</h2>
        </div>
        <button
          id="gear-config-btn"
          onClick={onOpenConfig}
          className="btn-ghost text-brand-100"
          title="修改帳本名稱"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>

      {isSplit ? (
        <>
          <div className="flex flex-col gap-1 border-t border-brand-600/40 pt-3.5">
            <span className="text-[10px] text-brand-200 font-medium">{selectedMonth} · 待還款金額</span>
            {!splitBalance ? (
              <div className="text-lg font-bold text-brand-300 mt-0.5">尚未設定成員</div>
            ) : splitBalance.balanced ? (
              <div className="text-2xl font-black text-emerald-300 tracking-tight mt-0.5 font-mono">
                $0 <span className="text-base font-semibold">已平帳</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-rose-300 tracking-tight mt-0.5 font-mono">
                ${splitBalance.settlements.reduce((s, r) => s + r.amount, 0).toLocaleString()}
              </div>
            )}
          </div>

          <div className="grid gap-2 bg-brand-950/40 p-3 rounded-xl border border-brand-500/10 text-xs"
            style={{ gridTemplateColumns: splitBalance ? `repeat(${Math.min(splitBalance.memberTotals.length, 3)}, 1fr)` : '1fr 1fr' }}
          >
            {splitBalance ? splitBalance.memberTotals.map((m, i) => (
              <div key={i} className={i > 0 ? 'border-l border-brand-600/30 pl-2.5' : ''}>
                <span className="text-brand-300 text-[10px] block truncate">{m.nickname} 付出</span>
                <div className="text-white font-bold mt-1 font-mono">${m.paid.toLocaleString()}</div>
              </div>
            )) : (
              <>
                <div>
                  <span className="text-brand-300 text-[10px] block">本月總支出</span>
                  <div className="text-white font-bold mt-1 font-mono">$0</div>
                </div>
                <div className="border-l border-brand-600/30 pl-2.5">
                  <span className="text-brand-300 text-[10px] block">待還款筆數</span>
                  <div className="text-white font-bold mt-1 font-mono">0 筆</div>
                </div>
              </>
            )}
          </div>

          {splitBalance && !splitBalance.balanced && (
            <div className="flex flex-col gap-1.5 bg-brand-950/30 p-2.5 rounded-xl border border-brand-500/10">
              <span className="text-[10px] text-brand-300 font-semibold">還款明細</span>
              {splitBalance.settlements.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>
                    <span className="text-rose-300 font-bold">{s.from}</span>
                    <span className="text-brand-300 mx-1">→</span>
                    <span className="text-emerald-300 font-bold">{s.to}</span>
                  </span>
                  <span className="font-mono font-bold text-white">${s.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1 border-t border-brand-600/40 pt-3.5">
            <span className="text-[10px] text-brand-200 font-medium">當前家庭公費餘額 (賸餘款)</span>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5 font-mono">
              ${monthlyMetrics.net.toLocaleString()} 元
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 bg-brand-950/40 p-3 rounded-xl border border-brand-500/10 text-xs">
            <div>
              <span className="text-brand-300 text-[10px] block">本月總公費收入</span>
              <div className="text-emerald-300 font-bold mt-1 font-mono">
                +${monthlyMetrics.income.toLocaleString()}
              </div>
            </div>
            <div className="border-l border-brand-600/30 pl-3.5">
              <span className="text-brand-300 text-[10px] block">本月總公費支出</span>
              <div className="text-rose-300 font-bold mt-1 font-mono">
                -${monthlyMetrics.expense.toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
