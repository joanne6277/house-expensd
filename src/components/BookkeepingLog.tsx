/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookkeepingRecord, PRESET_CATEGORIES } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface BookkeepingLogProps {
  filteredRecords: BookkeepingRecord[];
  filterType: 'all' | 'income' | 'expense';
  filterCategory: string;
  setFilterType: (type: 'all' | 'income' | 'expense') => void;
  setFilterCategory: (category: string) => void;
  onDeleteRecord: (id: string) => void;
  onEditRecord: (record: BookkeepingRecord) => void;
  onToggleSettled: (record: BookkeepingRecord) => void;
  onOpenAddModal: () => void;
}

export function BookkeepingLog({
  filteredRecords,
  filterType,
  filterCategory,
  setFilterType,
  setFilterCategory,
  onDeleteRecord,
  onEditRecord,
  onToggleSettled,
  onOpenAddModal,
}: BookkeepingLogProps) {
  return (
    <section id="bookings-log" className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-xs text-slate-800 tracking-tight">家庭公費支出與入帳清單</h3>
        
        {/* Horizontal Filter tags */}
        <div id="filter-controls" className="flex gap-1 overflow-x-auto pb-1 select-none">
          <button 
            type="button"
            onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
              filterType === 'all' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            全部
          </button>
          <button 
            type="button"
            onClick={() => { setFilterType('income'); setFilterCategory('all'); }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
              filterType === 'income' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            收支-存入 (+)
          </button>
          <button 
            type="button"
            onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
              filterType === 'expense' 
                ? 'bg-rose-600 text-white' 
                : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            收支-支出 (-)
          </button>

          {(filterType === 'expense' ? PRESET_CATEGORIES.expense : PRESET_CATEGORIES.income).map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => {
                setFilterType(filterType === 'all' ? 'expense' : filterType);
                setFilterCategory(cat.name);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-semibold shrink-0 border transition-all cursor-pointer ${
                filterCategory === cat.name
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* List display */}
      <div className="flex flex-col gap-1.5 w-full">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl py-8 px-4 text-center border border-slate-200/80 shadow-3xs flex flex-col items-center gap-1">
            <p className="text-[10px] text-slate-400">當前篩選條件無任何公費紀錄。</p>
            <button 
              type="button"
              onClick={onOpenAddModal}
              className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
            >
              新增一筆
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredRecords.map((rec) => {
              const isIncome = rec.type === 'income';
              return (
                <motion.div 
                  key={rec.id}
                  layoutId={`record-${rec.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-white rounded-xl p-3 border border-slate-200 hover:border-indigo-200 shadow-3xs flex items-center justify-between transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      <CategoryIcon name={rec.category} className="w-4 h-4" />
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] bg-slate-100 font-bold text-slate-600 px-1.5 py-0.5 rounded">
                          {rec.category}
                        </span>
                        
                        {rec.payerId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSettled(rec);
                            }}
                            className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition border ${
                              rec.isSettled 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 animate-pulse'
                            }`}
                            title="點擊可直接切換結清狀態"
                          >
                            <span>💵 由 {rec.payerName} 代墊</span>
                            <span className="opacity-40">•</span>
                            <span className="font-extrabold">{rec.isSettled ? '已結清 ✅' : '未結清(點此結結清)'}</span>
                          </button>
                        ) : (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/60">
                            🏦 公費直付
                          </span>
                        )}

                        <span className="text-[9px] text-slate-400 font-mono">
                          {rec.date}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-xs text-slate-800 mt-1 truncate">
                        {rec.description || `${rec.category}往來記錄`}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <span className={`font-mono text-xs font-black shrink-0 ${isIncome ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {isIncome ? `+$${rec.amount.toLocaleString()}` : `-$${rec.amount.toLocaleString()}`}
                    </span>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => onEditRecord(rec)}
                        className="text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                        title="編輯項目"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded-md hover:bg-slate-50 cursor-pointer transition-colors"
                        title="刪除項目"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
