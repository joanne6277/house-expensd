/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LedgerMember, PRESET_CATEGORIES, SPLIT_CATEGORIES, BookkeepingRecord, LedgerMode } from '../types';
import { CategoryIcon } from './CategoryIcon';

export interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: LedgerMember[];
  initialData?: BookkeepingRecord | null;
  ledgerMode?: LedgerMode;
  onAddRecord: (data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    payerId?: string;
    isSettled?: boolean;
  }) => Promise<void> | void;
  onUpdateRecord?: (id: string, data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    payerId?: string;
    isSettled?: boolean;
  }) => Promise<void> | void;
}

export function RecordFormModal({
  isOpen,
  onClose,
  members,
  initialData,
  ledgerMode = 'shared',
  onAddRecord,
  onUpdateRecord,
}: RecordFormModalProps) {
  const isSplit = ledgerMode === 'split';
  // Inner local state for the form inputs
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');
  const [recordCategory, setRecordCategory] = useState<string>('生活雜費');
  const [recordAmount, setRecordAmount] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [recordDescription, setRecordDescription] = useState<string>('');
  const [recordPayerId, setRecordPayerId] = useState<string>('');
  const [recordIsSettled, setRecordIsSettled] = useState<boolean>(false);

  // Sync state with initialData when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setRecordType(initialData.type);
      setRecordCategory(initialData.category);
      setRecordAmount(String(initialData.amount));
      setRecordDate(initialData.date);
      setRecordDescription(initialData.description || '');
      setRecordPayerId(initialData.payerId || '');
      setRecordIsSettled(!!initialData.isSettled);
    } else if (isOpen) {
      // Reset to defaults for "Add" mode when opening
      setRecordType('expense');
      setRecordCategory(isSplit ? '餐飲' : '生活雜費');
      setRecordAmount('');
      setRecordDate(new Date().toISOString().split('T')[0]);
      setRecordDescription('');
      setRecordPayerId('');
      setRecordIsSettled(false);
    }
  }, [initialData, isOpen]);

  // Sync category selection whenever the type changes (only in "Add" mode)
  useEffect(() => {
    if (!initialData) {
      if (recordType === 'income') {
        setRecordCategory('公費收入');
        setRecordPayerId('');
        setRecordIsSettled(false);
      } else {
        setRecordCategory('生活雜費');
      }
    }
  }, [recordType, initialData]);

  // Handle submit action
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordAmount || isNaN(Number(recordAmount)) || Number(recordAmount) <= 0) return;
    if (isSplit && !recordPayerId) return;

    const data = {
      type: recordType,
      category: recordCategory,
      amount: Math.round(Number(recordAmount)),
      date: recordDate,
      description: recordDescription.trim(),
      payerId: recordPayerId || undefined,
      isSettled: recordPayerId ? recordIsSettled : undefined,
    };

    if (initialData && onUpdateRecord) {
      onUpdateRecord(initialData.id, data);
    } else {
      onAddRecord(data);
    }

    // Reset local inputs (only if not updating, or parent will close anyway)
    if (!initialData) {
      setRecordAmount('');
      setRecordDescription('');
      setRecordPayerId('');
      setRecordIsSettled(false);
    }
  };

  // Quick preset amounts handler
  const quickAmounts = recordType === 'income' ? [1000, 5000, 10000] : [100, 500, 1000];

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="quick-add-modal-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            id="quick-add-modal"
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-md overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  {initialData ? '編輯明細' : '新增明細'}
                </h3>
                <span className="text-[9px] text-slate-400">{isSplit ? 'Split Bill Mode' : 'Collaborative Single Group Mode'}</span>
              </div>
              <button 
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                關閉
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-3.5">
              
              {/* Income vs Expense Selection Tabs — hidden in split mode (always expense) */}
              {!isSplit && (
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRecordType('expense')}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      recordType === 'expense'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    公費支出 (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecordType('income')}
                    className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                      recordType === 'income'
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/50'
                    }`}
                  >
                    公費撥款/收入 (+)
                  </button>
                </div>
              )}

              {/* Payer — required in split mode, optional in shared mode */}
              {(isSplit || recordType === 'expense') && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="label-sm">
                      {isSplit ? '由誰付款？(必填)' : '此筆由誰代墊？(選填)'}
                    </label>
                    <select
                      value={recordPayerId}
                      onChange={(e) => {
                        setRecordPayerId(e.target.value);
                        if (!e.target.value) setRecordIsSettled(false);
                      }}
                      className="input-field"
                      required={isSplit}
                    >
                      {!isSplit && <option value="">🏦 公費直接支付 (不需代墊)</option>}
                      {isSplit && <option value="">請選擇付款人</option>}
                      {members.map(m => (
                        <option key={m.userId} value={m.userId}>💵 {m.nickname}</option>
                      ))}
                    </select>
                  </div>

                  {/* Settlement checkbox — only in shared mode */}
                  {!isSplit && recordPayerId && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg">
                      <input
                        id="input-is-settled-checkbox"
                        type="checkbox"
                        checked={recordIsSettled}
                        onChange={(e) => setRecordIsSettled(e.target.checked)}
                        className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer"
                      />
                      <label htmlFor="input-is-settled-checkbox" className="text-xs font-bold text-amber-900 select-none cursor-pointer">
                        此代墊款項已結清還款 (打勾代表已還款)
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* Amount */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">往來金額 (NTD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="請輸入台幣金額"
                    required
                    value={recordAmount}
                    onChange={(e) => setRecordAmount(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-extrabold rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-hidden focus:border-brand-600 font-mono"
                    autoFocus
                  />
                </div>
                
                {/* Presets */}
                <div className="flex gap-1.5 py-0.5">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRecordAmount(String(amt))}
                      className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded cursor-pointer"
                    >
                      + {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selection Grid */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">選取分類</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(isSplit ? SPLIT_CATEGORIES : recordType === 'expense' ? PRESET_CATEGORIES.expense : PRESET_CATEGORIES.income).map(cat => {
                    const isSelected = recordCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setRecordCategory(cat.name)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition cursor-pointer truncate ${
                          isSelected 
                            ? 'bg-brand-50 border-brand-500 text-brand-700' 
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <CategoryIcon name={cat.name} className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="truncate w-full text-center">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Calendar Date */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">往來日期</label>
                <input
                  type="date"
                  required
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Description memo */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">備註 (備忘備註，選填)</label>
                <input
                  type="text"
                  placeholder="例如：大潤發家庭採買"
                  value={recordDescription}
                  onChange={(e) => setRecordDescription(e.target.value)}
                  className="input-field"
                  maxLength={100}
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 py-2.5 rounded-lg font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold text-xs transition cursor-pointer"
                >
                  儲存明細
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
