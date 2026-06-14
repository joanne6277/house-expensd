/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { LedgerMode } from '../types';

interface SplitBalance {
  balanced: boolean;
  settlements: { from: string; to: string; amount: number }[];
  memberActualConsumption: { nickname: string; consumed: number }[];
}

interface LedgerHighlightCardProps {
  householdName: string;
  monthlyMetrics: { income: number; expense: number; net: number };
  onOpenConfig: () => void;
  ledgerMode?: LedgerMode;
  splitBalance?: SplitBalance | null;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
  onBulkSettle?: () => void;
}

export function LedgerHighlightCard({
  householdName,
  monthlyMetrics,
  onOpenConfig,
  ledgerMode = 'shared',
  splitBalance,
  selectedMonth,
  onSelectMonth,
  onBulkSettle,
}: LedgerHighlightCardProps) {
  const isSplit = ledgerMode === 'split';

  const handleMonthOffset = (offset: number) => {
    if (!selectedMonth || !onSelectMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    onSelectMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <section id="ledger-header-card" className="bg-linear-to-br from-brand-400 to-brand-700 rounded-2xl text-white p-5 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="card-header">
        <div className="flex flex-col">
          <span className="text-[10px] text-brand-300 font-semibold uppercase tracking-wider">
            {isSplit ? '分帳模式' : '共享帳本'}
          </span>
          <h2 className="text-base font-bold tracking-tight mt-0.5">{householdName}</h2>
        </div>

        {/* split mode: 月份選擇器取代帳冊設定按鈕 */}
        {isSplit ? (
          <div className="flex items-center gap-0.5 bg-brand-950/30 px-2 py-1 rounded-lg border border-brand-500/10">
            <button type="button" onClick={() => handleMonthOffset(-1)}
              className="p-0.5 hover:bg-brand-600/30 rounded transition text-brand-300 hover:text-white cursor-pointer">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <input
              type="month"
              value={selectedMonth || ''}
              onChange={(e) => onSelectMonth?.(e.target.value)}
              className="bg-transparent border-none text-white text-[11px] font-bold font-mono text-center focus:outline-none cursor-pointer w-20"
            />
            <button type="button" onClick={() => handleMonthOffset(1)}
              className="p-0.5 hover:bg-brand-600/30 rounded transition text-brand-300 hover:text-white cursor-pointer">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            id="gear-config-btn"
            onClick={onOpenConfig}
            className="btn-ghost text-brand-100"
            title="修改帳本名稱"
          >
            <Users className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSplit ? (
        <>

          {/* Member actual consumption grid */}
          <div className="flex flex-col gap-1.5 border-t border-brand-600/40 pt-3.5">
            <span className="text-[10px] text-brand-200 font-medium tracking-wide">成員當月支出</span>
            {!splitBalance ? (
              <p className="text-sm font-bold text-brand-300">尚未設定成員</p>
            ) : (
              <div
                className="grid gap-2 bg-brand-950/40 p-3 rounded-xl border border-brand-500/10 text-xs"
                style={{ gridTemplateColumns: `repeat(${Math.min(splitBalance.memberActualConsumption.length, 3)}, 1fr)` }}
              >
                {splitBalance.memberActualConsumption.map((m, i) => (
                  <div key={i} className={i > 0 ? 'border-l border-brand-600/30 pl-2.5' : ''}>
                    <span className="text-brand-300 text-[10px] block truncate">{m.nickname}</span>
                    <div className="text-white font-bold mt-1 font-mono">${m.consumed.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settlement details */}
          {splitBalance && (
            <div className="flex flex-col gap-1.5 bg-brand-950/30 p-2.5 rounded-xl border border-brand-500/10">
              <span className="text-[10px] text-brand-300 font-semibold">還款明細</span>
              {splitBalance.balanced ? (
                <p className="text-xs text-emerald-300 font-bold">✓ 本月已平帳</p>
              ) : (
                <>
                  {splitBalance.settlements.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>
                        <span className="text-rose-300 font-bold">{s.from}</span>
                        <span className="text-brand-300 mx-1">→</span>
                        <span className="text-emerald-300 font-bold">{s.to}</span>
                        <span className="font-mono font-bold text-white ml-2">${s.amount.toLocaleString()}</span>
                      </span>
                      {onBulkSettle && (
                        <button
                          type="button"
                          onClick={onBulkSettle}
                          className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-md transition active:scale-95 cursor-pointer shrink-0 ml-2"
                        >
                          <CheckCircle className="w-2.5 h-2.5" />
                          結清
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
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
