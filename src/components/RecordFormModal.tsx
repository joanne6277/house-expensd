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
    splitWithIds?: string[];
    splitShares?: { [userId: string]: number };
  }) => Promise<void> | void;
  onUpdateRecord?: (id: string, data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    payerId?: string;
    isSettled?: boolean;
    splitWithIds?: string[];
    splitShares?: { [userId: string]: number };
  }) => Promise<void> | void;
}

type SplitMode = 'equal' | 'custom';

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

  // --- shared mode state ---
  const [recordType, setRecordType] = useState<'income' | 'expense'>('expense');
  const [recordCategory, setRecordCategory] = useState<string>('生活雜費');
  const [recordAmount, setRecordAmount] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [recordDescription, setRecordDescription] = useState<string>('');
  const [recordPayerId, setRecordPayerId] = useState<string>('');
  const [recordIsSettled, setRecordIsSettled] = useState<boolean>(false);

  // --- split mode extra state ---
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  // equal mode: all checked member IDs (can include payer)
  const [equalParticipants, setEqualParticipants] = useState<string[]>([]);
  // custom mode: each member's custom amount string
  const [customShares, setCustomShares] = useState<{ [userId: string]: string }>({});

  // Build default participants = all members
  const allMemberIds = members.map(m => m.userId);

  // Detect if existing splitShares are all equal → use equal mode
  const detectSplitMode = (shares: { [uid: string]: number }): SplitMode => {
    const vals = Object.values(shares);
    if (vals.length <= 1) return 'equal';
    const first = vals[0];
    return vals.every(v => Math.abs(v - first) < 1) ? 'equal' : 'custom';
  };

  // Sync form when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setRecordType(initialData.type);
      setRecordCategory(initialData.category);
      setRecordAmount(String(initialData.amount));
      setRecordDate(initialData.date);
      setRecordDescription(initialData.description || '');
      setRecordPayerId(initialData.payerId || '');
      setRecordIsSettled(!!initialData.isSettled);

      if (isSplit) {
        if (initialData.splitShares && Object.keys(initialData.splitShares).length > 0) {
          const mode = detectSplitMode(initialData.splitShares);
          setSplitMode(mode);
          setEqualParticipants(Object.keys(initialData.splitShares));
          const shares: { [uid: string]: string } = {};
          members.forEach(m => {
            shares[m.userId] = String(initialData.splitShares![m.userId] ?? '');
          });
          setCustomShares(shares);
        } else if (initialData.splitWithIds && initialData.splitWithIds.length > 0) {
          setSplitMode('equal');
          setEqualParticipants(initialData.splitWithIds);
          setCustomShares({});
        } else {
          setSplitMode('equal');
          setEqualParticipants(allMemberIds);
          setCustomShares({});
        }
      }
    } else if (isOpen) {
      setRecordType('expense');
      setRecordCategory(isSplit ? '餐飲' : '生活雜費');
      setRecordAmount('');
      setRecordDate(new Date().toISOString().split('T')[0]);
      setRecordDescription('');
      setRecordPayerId('');
      setRecordIsSettled(false);
      setSplitMode('equal');
      setEqualParticipants(allMemberIds);
      setCustomShares({});
    }
  }, [initialData, isOpen]);

  // When type changes in shared mode, reset category
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

  // Toggle participant in equal mode
  const toggleEqualParticipant = (userId: string) => {
    setEqualParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Switch split mode with value carry-over
  const handleSplitModeChange = (next: SplitMode) => {
    if (next === splitMode) return;
    const totalAmount = Number(recordAmount) || 0;

    if (next === 'custom') {
      // equal → custom: prefill each participant with their equal share
      const count = equalParticipants.length;
      const perPerson = count > 0 ? Math.round(totalAmount / count) : 0;
      const shares: { [uid: string]: string } = {};
      members.forEach(m => {
        shares[m.userId] = equalParticipants.includes(m.userId) ? String(perPerson) : '';
      });
      setCustomShares(shares);
    } else {
      // custom → equal: use custom share keys as participants, sum as total
      const filledIds = members
        .filter(m => Number(customShares[m.userId]) > 0)
        .map(m => m.userId);
      setEqualParticipants(filledIds.length > 0 ? filledIds : allMemberIds);
      const total = members.reduce((s, m) => s + (Number(customShares[m.userId]) || 0), 0);
      if (total > 0) setRecordAmount(String(Math.round(total)));
    }
    setSplitMode(next);
  };

  // Compute derived split data for submission
  const buildSplitPayload = (): {
    splitWithIds: string[];
    splitShares: { [userId: string]: number };
    totalAmount: number;
  } => {
    if (splitMode === 'equal') {
      const count = equalParticipants.length;
      const total = Math.round(Number(recordAmount) || 0);
      const shares: { [uid: string]: number } = {};
      if (count > 0) {
        const base = Math.floor(total / count);
        const remainder = total - base * count;
        // 整數分配，最後一人吸收餘數，確保 sum(shares) === total
        equalParticipants.forEach((uid, i) => {
          shares[uid] = i === count - 1 ? base + remainder : base;
        });
      }
      return { splitWithIds: equalParticipants, splitShares: shares, totalAmount: total };
    } else {
      const shares: { [uid: string]: number } = {};
      members.forEach(m => {
        const v = Number(customShares[m.userId]);
        if (v > 0) shares[m.userId] = v;
      });
      const total = Math.round(Object.values(shares).reduce((s, v) => s + v, 0));
      return { splitWithIds: Object.keys(shares), splitShares: shares, totalAmount: total };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSplit) {
      if (!recordPayerId) return;
      const { splitWithIds, splitShares, totalAmount } = buildSplitPayload();
      if (splitWithIds.length === 0 || totalAmount <= 0) return;

      const data = {
        type: 'expense' as const,
        category: recordCategory,
        amount: totalAmount,
        date: recordDate,
        description: recordDescription.trim(),
        payerId: recordPayerId,
        // 編輯時保留原本結清狀態；新增則預設未結清
        isSettled: initialData?.isSettled ?? false,
        splitWithIds,
        splitShares,
      };

      if (initialData && onUpdateRecord) {
        onUpdateRecord(initialData.id, data);
      } else {
        onAddRecord(data);
      }
    } else {
      if (!recordAmount || isNaN(Number(recordAmount)) || Number(recordAmount) <= 0) return;

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
    }

    if (!initialData) {
      setRecordAmount('');
      setRecordDescription('');
      setRecordPayerId('');
      setRecordIsSettled(false);
      setSplitMode('equal');
      setEqualParticipants(allMemberIds);
      setCustomShares({});
    }
  };

  const quickAmounts = recordType === 'income' ? [1000, 5000, 10000] : [100, 500, 1000];

  // Equal mode: per-person preview
  const equalPerPerson = (() => {
    const total = Number(recordAmount) || 0;
    const count = equalParticipants.length;
    return count > 0 && total > 0 ? Math.round(total / count) : 0;
  })();

  // Custom mode: running total
  const customTotal = members.reduce((s, m) => s + (Number(customShares[m.userId]) || 0), 0);

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
            {/* Header */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  {initialData ? '編輯明細' : '新增明細'}
                </h3>
                <span className="text-[9px] text-slate-400">
                  {isSplit ? 'Split Bill Mode' : 'Collaborative Single Group Mode'}
                </span>
              </div>
              <button type="button" onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer">
                關閉
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex flex-col gap-3.5">

              {/* ── SHARED MODE ── */}
              {!isSplit && (
                <>
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setRecordType('expense')}
                      className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${recordType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                      公費支出 (-)
                    </button>
                    <button type="button" onClick={() => setRecordType('income')}
                      className={`py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${recordType === 'income' ? 'bg-brand-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>
                      公費撥款/收入 (+)
                    </button>
                  </div>

                  {recordType === 'expense' && (
                    <div className="flex flex-col gap-1">
                      <label className="label-sm">此筆由誰代墊？(選填)</label>
                      <select value={recordPayerId}
                        onChange={(e) => { setRecordPayerId(e.target.value); if (!e.target.value) setRecordIsSettled(false); }}
                        className="input-field">
                        <option value="">🏦 公費直接支付 (不需代墊)</option>
                        {members.map(m => <option key={m.userId} value={m.userId}>💵 {m.nickname}</option>)}
                      </select>
                    </div>
                  )}

                  {recordType === 'expense' && recordPayerId && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg">
                      <input id="input-is-settled-checkbox" type="checkbox" checked={recordIsSettled}
                        onChange={(e) => setRecordIsSettled(e.target.checked)}
                        className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 cursor-pointer" />
                      <label htmlFor="input-is-settled-checkbox" className="text-xs font-bold text-amber-900 select-none cursor-pointer">
                        此代墊款項已結清還款 (打勾代表已還款)
                      </label>
                    </div>
                  )}
                </>
              )}

              {/* ── SPLIT MODE ── */}
              {isSplit && (
                <>
                  {/* Payer */}
                  <div className="flex flex-col gap-1">
                    <label className="label-sm">由誰付款？(必填)</label>
                    <select value={recordPayerId}
                      onChange={(e) => setRecordPayerId(e.target.value)}
                      className="input-field" required>
                      <option value="">請選擇付款人</option>
                      {members.map(m => <option key={m.userId} value={m.userId}>💵 {m.nickname}</option>)}
                    </select>
                  </div>

                  {/* Split mode toggle */}
                  {recordPayerId && members.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="label-sm">分擔方式</label>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 text-[10px] font-bold">
                          <button type="button" onClick={() => handleSplitModeChange('equal')}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${splitMode === 'equal' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>
                            平均分擔
                          </button>
                          <button type="button" onClick={() => handleSplitModeChange('custom')}
                            className={`px-2.5 py-1 rounded-md transition cursor-pointer ${splitMode === 'custom' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>
                            自訂金額
                          </button>
                        </div>
                      </div>

                      {/* Equal mode: chip checkboxes */}
                      {splitMode === 'equal' && (
                        <div className="flex flex-wrap gap-2">
                          {members.map(m => {
                            const checked = equalParticipants.includes(m.userId);
                            return (
                              <button key={m.userId} type="button" onClick={() => toggleEqualParticipant(m.userId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${checked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
                                <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'border-white' : 'border-slate-400'}`}>
                                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                                </span>
                                {m.nickname}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Custom mode: per-member amount inputs */}
                      {splitMode === 'custom' && (
                        <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {members.map(m => (
                            <div key={m.userId} className="flex items-center gap-2.5">
                              <span className="text-[11px] font-bold text-slate-700 w-14 truncate shrink-0">{m.nickname}</span>
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                                <input type="number" inputMode="numeric" placeholder="0"
                                  value={customShares[m.userId] ?? ''}
                                  onChange={(e) => setCustomShares(prev => ({ ...prev, [m.userId]: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-400" />
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[10px] font-bold text-slate-500">
                            <span>總計</span>
                            <span className={`font-mono ${customTotal > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                              ${Math.round(customTotal).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {equalParticipants.length === 0 && splitMode === 'equal' && (
                        <p className="text-[10px] text-rose-500 font-semibold">請至少勾選一位分擔人</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Amount — only shown in equal mode or shared mode */}
              {(!isSplit || splitMode === 'equal') && (
                <div className="flex flex-col gap-1">
                  <label className="label-sm">
                    {isSplit ? '分擔金額總計 (NTD)' : '往來金額 (NTD)'}
                  </label>
                  {isSplit && splitMode === 'equal' && (
                    <p className="text-[10px] text-slate-400 -mt-0.5">勾選成員均分此金額，細節可寫在備註</p>
                  )}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">$</span>
                    <input type="number" inputMode="numeric" placeholder="請輸入台幣金額" required
                      value={recordAmount}
                      onChange={(e) => setRecordAmount(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 font-extrabold rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-hidden focus:border-brand-600 font-mono"
                      autoFocus />
                  </div>
                  <div className="flex gap-1.5 py-0.5">
                    {quickAmounts.map((amt) => (
                      <button key={amt} type="button" onClick={() => setRecordAmount(String(amt))}
                        className="bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[10px] font-bold py-0.5 px-2 rounded cursor-pointer">
                        + {amt}
                      </button>
                    ))}
                  </div>
                  {isSplit && splitMode === 'equal' && equalPerPerson > 0 && equalParticipants.length > 0 && (
                    <p className="text-[10px] text-indigo-600 font-semibold">
                      每人分擔 ${equalPerPerson.toLocaleString()}（共 {equalParticipants.length} 人）
                    </p>
                  )}
                </div>
              )}

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">選取分類</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(isSplit ? SPLIT_CATEGORIES : recordType === 'expense' ? PRESET_CATEGORIES.expense : PRESET_CATEGORIES.income).map(cat => {
                    const isSelected = recordCategory === cat.name;
                    return (
                      <button key={cat.name} type="button" onClick={() => setRecordCategory(cat.name)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 border transition cursor-pointer truncate ${isSelected ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-slate-200/80 hover:bg-slate-50'}`}>
                        <CategoryIcon name={cat.name} className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="truncate w-full text-center">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">往來日期</label>
                <input type="date" required value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)} className="input-field" />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="label-sm">備註 (選填)</label>
                <input type="text"
                  placeholder={isSplit ? '例如：各自分擔項目說明' : '例如：大潤發家庭採買'}
                  value={recordDescription}
                  onChange={(e) => setRecordDescription(e.target.value)}
                  className="input-field" maxLength={100} />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 mt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-600 py-2.5 rounded-lg font-bold text-xs hover:bg-slate-100 transition cursor-pointer">
                  取消
                </button>
                <button type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold text-xs transition cursor-pointer">
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
