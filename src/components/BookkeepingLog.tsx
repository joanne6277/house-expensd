/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, Pencil, Check, CircleAlert, Landmark, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BookkeepingRecord, PRESET_CATEGORIES, LedgerMember, LedgerMode } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const SPLIT_FILTER_CATEGORIES = ['餐飲', '日用品'];

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
  ledgerMode?: LedgerMode;
  members?: LedgerMember[];
  filterMember?: string;
  setFilterMember?: (userId: string) => void;
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
  ledgerMode = 'shared',
  members = [],
  filterMember = 'all',
  setFilterMember,
}: BookkeepingLogProps) {
  const isSplit = ledgerMode === 'split';
  const [pendingDelete, setPendingDelete] = useState<BookkeepingRecord | null>(null);
  useBodyScrollLock(!!pendingDelete);

  const confirmDelete = () => {
    if (pendingDelete) {
      onDeleteRecord(pendingDelete.id);
      setPendingDelete(null);
    }
  };

  return (
    <section id="bookings-log" className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-bold text-xs text-slate-800 tracking-tight">
          {isSplit ? '所有帳目紀錄' : '家庭公費支出與入帳清單'}
        </h3>

        {/* Horizontal Filter tags */}
        <div id="filter-controls" className="flex gap-1 overflow-x-auto pb-1 select-none">
          {isSplit ? (
            <>
              {/* Member filter */}
              <button
                type="button"
                onClick={() => { setFilterMember?.('all'); setFilterCategory('all'); }}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  filterMember === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                全部
              </button>
              {members.map(m => (
                <button
                  key={m.userId}
                  type="button"
                  onClick={() => { setFilterMember?.(m.userId); setFilterCategory('all'); }}
                  className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                    filterMember === m.userId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {m.nickname}
                </button>
              ))}
              {/* Category filter */}
              {SPLIT_FILTER_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold shrink-0 border transition-all cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setFilterType('all'); setFilterCategory('all'); }}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
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
                className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  filterType === 'income'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                收入
              </button>
              <button
                type="button"
                onClick={() => { setFilterType('expense'); setFilterCategory('all'); }}
                className={`px-3 py-2 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  filterType === 'expense'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                支出
              </button>
              {(filterType === 'expense' ? PRESET_CATEGORIES.expense : PRESET_CATEGORIES.income).map(cat => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setFilterType(filterType === 'all' ? 'expense' : filterType);
                    setFilterCategory(cat.name);
                  }}
                  className={`px-3 py-2 rounded-lg text-[11px] font-semibold shrink-0 border transition-all cursor-pointer ${
                    filterCategory === cat.name
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </>
          )}
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
              // 結清按鈕只在「支出 + 有代墊人」時出現
              const showSettleButton = !isIncome && !!rec.payerId;
              // shared mode 沒有結清按鈕時，第一個 slot 顯示禁用標籤
              const showDisabledLabel = !isSplit && !showSettleButton;

              return (
                <motion.div
                  key={rec.id}
                  layoutId={`record-${rec.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-white rounded-xl border border-slate-200 shadow-3xs overflow-hidden"
                >
                  {/* 上半部：金額與資訊 */}
                  <div className="p-3 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <CategoryIcon name={rec.category} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-800 truncate">
                          {rec.description || rec.category}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] bg-slate-100 font-bold text-slate-600 px-1.5 py-0.5 rounded">
                            {rec.category}
                          </span>
                          {/* 付款資訊（公費直付 / 公費收入 改顯示在按鈕區）*/}
                          {rec.payerId && (
                            <span className="text-[10px] font-semibold text-slate-500">
                              💵 {rec.payerName} {isSplit ? '付款' : '代墊'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">{rec.date}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-mono text-base font-black shrink-0 ${
                      isIncome ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {isIncome ? '+' : '-'}${rec.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* 下半部：永遠顯示的 action 按鈕 */}
                  <div className="border-t border-slate-100 bg-slate-50/60 flex">
                    {showSettleButton && (
                      <>
                        <button
                          type="button"
                          onClick={() => onToggleSettled(rec)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold cursor-pointer transition ${
                            rec.isSettled
                              ? 'text-emerald-700 hover:bg-emerald-50'
                              : 'text-amber-700 hover:bg-amber-50'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          {rec.isSettled ? '已結清' : '結清'}
                        </button>
                        <div className="w-px bg-slate-200" />
                      </>
                    )}
                    {showDisabledLabel && (
                      <>
                        <div
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold select-none cursor-not-allowed ${
                            isIncome ? 'text-emerald-600 bg-emerald-50/40' : 'text-indigo-600 bg-indigo-50/40'
                          }`}
                        >
                          {isIncome ? <Coins className="w-3.5 h-3.5" /> : <Landmark className="w-3.5 h-3.5" />}
                          {isIncome ? '公費收入' : '公費直付'}
                        </div>
                        <div className="w-px bg-slate-200" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditRecord(rec)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      修改
                    </button>
                    <div className="w-px bg-slate-200" />
                    <button
                      type="button"
                      onClick={() => setPendingDelete(rec)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      刪除
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {pendingDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-2xl w-full max-w-xs shadow-xl overflow-hidden"
            >
              <div className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
                  <CircleAlert className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mt-1">確認刪除此筆？</h3>
                <p className="text-[11px] text-slate-500">
                  「{pendingDelete.description || pendingDelete.category}」
                  <span className="font-mono font-bold text-slate-700 ml-1">
                    ${pendingDelete.amount.toLocaleString()}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">此操作無法復原</p>
              </div>
              <div className="flex border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
                >
                  取消
                </button>
                <div className="w-px bg-slate-100" />
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-3 text-xs font-extrabold text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                >
                  確認刪除
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
