/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  PieChart as PieChartIcon, 
  BarChart3 as BarChart3Icon,
  Wallet
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { BookkeepingRecord, PRESET_CATEGORIES, LedgerMember } from '../types';

interface StatisticsPanelProps {
  filteredRecords: BookkeepingRecord[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  currentChartTab: 'pie' | 'bar' | 'settlement';
  onChangeChartTab: (tab: 'pie' | 'bar' | 'settlement') => void;
  categoryChartData: { name: string; value: number }[];
  dailyChartData: { day: string; '收入': number; '支出': number }[];
  members: LedgerMember[];
  onBulkSettle: () => void;
}

export function StatisticsPanel({
  filteredRecords,
  selectedMonth,
  onSelectMonth,
  currentChartTab,
  onChangeChartTab,
  categoryChartData,
  dailyChartData,
  members,
  onBulkSettle,
}: StatisticsPanelProps) {
  
  // Calculate unsettled prepayments grouped by payer
  const unsettledPrepayments = React.useMemo(() => {
    const map: { [payerId: string]: number } = {};
    filteredRecords.forEach(rec => {
      if (rec.type === 'expense' && rec.payerId && !rec.isSettled) {
        map[rec.payerId] = (map[rec.payerId] || 0) + rec.amount;
      }
    });
    return Object.entries(map).map(([payerId, amount]) => {
      const member = members.find(m => m.userId === payerId);
      return {
        payerId,
        payerName: member ? member.nickname : '未知成員',
        amount
      };
    });
  }, [filteredRecords, members]);

  const totalUnsettled = unsettledPrepayments.reduce((sum, item) => sum + item.amount, 0);

  // Color mapper for Recharts slices
  const getSliceColorForCategory = (catName: string): string => {
    const matched = [
      ...PRESET_CATEGORIES.expense, 
      ...PRESET_CATEGORIES.income
    ].find(p => p.name === catName);
    
    if (matched) {
      if (matched.name.includes('水費')) return '#06B6D4'; // cyan-500
      if (matched.name.includes('電費')) return '#3B82F6'; // blue-500
      if (matched.name.includes('網路')) return '#6366F1'; // indigo-500
      if (matched.name.includes('瓦斯') || matched.name.includes('天然氣')) return '#F97316'; // orange-500
      if (matched.name.includes('雜費')) return '#64748B'; // slate-500
      if (matched.name.includes('撥款')) return '#10B981'; // emerald-500
      if (matched.name.includes('公費')) return '#059669'; // emerald-600
    }
    return '#718096'; // fallback slate/gray
  };

  return (
    <section id="recharts-visuals-card" className="bg-white rounded-xl p-4 border border-slate-200 shadow-3xs flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xs text-slate-800 tracking-tight">本月收支圓餅與趨勢圖</h3>
        
        {/* Chart toggle switch */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
          <button 
            onClick={() => onChangeChartTab('pie')}
            className={`p-1 rounded-md cursor-pointer transition ${currentChartTab === 'pie' ? 'bg-white text-indigo-600 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            title="支出類別佔比"
          >
            <PieChartIcon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onChangeChartTab('bar')}
            className={`p-1 rounded-md cursor-pointer transition ${currentChartTab === 'bar' ? 'bg-white text-indigo-600 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            title="每日往來趨勢"
          >
            <BarChart3Icon className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onChangeChartTab('settlement')}
            className={`p-1 rounded-md cursor-pointer transition ${currentChartTab === 'settlement' ? 'bg-white text-indigo-600 shadow-3xs font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            title="代墊款項結算"
          >
            <Wallet className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Month selective controller */}
      <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
        <span className="text-[10px] text-slate-500 font-bold">查看月份: </span>
        <input 
          type="month" 
          value={selectedMonth}
          onChange={(e) => onSelectMonth(e.target.value)}
          className="bg-white border border-slate-200 text-xs rounded-md px-2 py-0.5 font-bold font-mono text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Canvas state container */}
      <div className="h-44 flex flex-col items-center justify-center">
        {currentChartTab === 'settlement' ? (
          <div className="w-full h-full flex flex-col gap-3">
            <div className="flex-1 overflow-y-auto pr-1">
              {unsettledPrepayments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-1.5 text-slate-400">
                  <Wallet className="w-5 h-5 opacity-20" />
                  <p className="text-[10px]">本月暫無待結清的代墊費用。</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {unsettledPrepayments.map(item => (
                    <div key={item.payerId} className="flex items-center justify-between bg-slate-50/50 border border-slate-100 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                          {item.payerName[0]}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{item.payerName}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-slate-400 font-medium">待還款金額</span>
                        <span className="text-xs font-black text-rose-600 font-mono">${item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {unsettledPrepayments.length > 0 && (
              <button 
                onClick={onBulkSettle}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-3 h-3" />
                <span>一鍵結清本月所有代墊 (${totalUnsettled.toLocaleString()})</span>
              </button>
            )}
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-6 flex flex-col items-center gap-1.5">
            <BarChart3Icon className="w-5 h-5 text-slate-300" />
            <p className="text-[10px] text-slate-400">目前本月尚無任何公費紀錄。</p>
          </div>
        ) : currentChartTab === 'pie' ? (
          categoryChartData.length === 0 ? (
            <div className="text-center text-[10px] text-slate-400 py-6">
              本月無任何「公費支出」項目。
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-[50%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getSliceColorForCategory(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value}`, '支出金額']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend listing */}
              <div className="w-[50%] text-[9px] flex flex-col gap-1 overflow-y-auto max-h-[140px] pl-1 select-none">
                {categoryChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-1 w-full border-b border-dashed border-slate-100 pb-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="w-2 h-2 rounded-xs shrink-0" style={{ backgroundColor: getSliceColorForCategory(item.name) }}></span>
                      <span className="text-slate-600 truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-800 font-bold font-mono shrink-0">${item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          // Chronological daily bar chart
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChartData}>
              <XAxis dataKey="day" tick={{ fontSize: 8 }} tickLine={false} />
              <YAxis tick={{ fontSize: 8 }} tickLine={false} width={25} />
              <Tooltip formatter={(value) => [`$${value}`]} />
              <Legend wrapperStyle={{ fontSize: 8 }} />
              <Bar dataKey="收入" fill="#38A169" radius={[3, 3, 0, 0]} />
              <Bar dataKey="支出" fill="#E53E3E" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
