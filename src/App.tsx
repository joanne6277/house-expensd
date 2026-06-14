/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';

// Import Types and presets
import { BookkeepingRecord, LedgerMember, LedgerMode } from './types';


// Import Firebase
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, orderBy, deleteDoc } from 'firebase/firestore';

// Import Modular Sub-Components
import { Header } from './components/Header';
import { FeedbackToast } from './components/FeedbackToast';
import { LedgerHighlightCard } from './components/LedgerHighlightCard';
import { CollaboratorsRow } from './components/CollaboratorsRow';
import { StatisticsPanel } from './components/StatisticsPanel';
import { BookkeepingLog } from './components/BookkeepingLog';
import { RecordFormModal } from './components/RecordFormModal';
import { SettingsModal } from './components/SettingsModal';

const LEDGER_TABS: { id: string; defaultName: string; mode: LedgerMode }[] = [
  { id: 'shared-family-ledger', defaultName: '家庭公費帳本', mode: 'shared' },
  { id: 'second-ledger', defaultName: '其他分帳', mode: 'split' },
];

const computeDefaultMonth = (mode: LedgerMode): string => {
  const now = new Date();
  // shared 模式預設前一月，split 模式預設當月
  const target = mode === 'split'
    ? now
    : new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function App() {
  // --- STATE DECLARATIONS ---
  const isDbOnline = isFirebaseConfigured;

  const [activeLedgerIdx, setActiveLedgerIdx] = useState(0);
  const householdId = LEDGER_TABS[activeLedgerIdx].id;
  const ledgerMode = LEDGER_TABS[activeLedgerIdx].mode;

  const [householdName, setHouseholdName] = useState<string>(LEDGER_TABS[0].defaultName);
  const [records, setRecords] = useState<BookkeepingRecord[]>([]);
  const [members, setMembers] = useState<LedgerMember[]>([]);

  // Local active session identity (who is holding the device)
  const [currentMemberId, setCurrentMemberId] = useState<string>(() => {
    return localStorage.getItem('simulated_member_id') || 'demo-user-1';
  });

  // Filter settings
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMember, setFilterMember] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    () => computeDefaultMonth(LEDGER_TABS[0].mode)
  );

  // Modal and Display controllers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BookkeepingRecord | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currentChartTab, setCurrentChartTab] = useState<'pie' | 'settlement'>('pie');

  // Feedback notifications standard toast state
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Reset state when switching ledger tabs
  useEffect(() => {
    setRecords([]);
    setMembers([]);
    setHouseholdName(LEDGER_TABS[activeLedgerIdx].defaultName);
    setFilterType('all');
    setFilterCategory('all');
    setFilterMember('all');
    setSelectedMonth(computeDefaultMonth(LEDGER_TABS[activeLedgerIdx].mode));
  }, [activeLedgerIdx]);

  // --- REAL-TIME FIRESTORE SYNC & DATA FERRYING ---
  useEffect(() => {
    if (isDbOnline && db) {
      // 1. Ledger title details
      const ledgerRef = doc(db, 'household_ledgers', householdId);
      const unsubLedger = onSnapshot(ledgerRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHouseholdName(data.name || '共同支出與公費帳本');
        } else {
          setDoc(ledgerRef, {
            id: householdId,
            name: LEDGER_TABS[activeLedgerIdx].defaultName,
            monthlyBudget: 0,
            createdAt: new Date().toISOString()
          }, { merge: true }).catch(err => console.error("Error initializing ledger:", err));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `household_ledgers/${householdId}`);
      });

      // 2. Transcribing active bookings records list
      const recordsColRef = collection(db, 'household_ledgers', householdId, 'records');
      const recordsQuery = query(recordsColRef, orderBy('date', 'desc'));
      const unsubRecords = onSnapshot(recordsQuery, (snapshot) => {
        const loadedRecords: BookkeepingRecord[] = [];
        snapshot.forEach((docSnap) => {
          loadedRecords.push({ id: docSnap.id, ...docSnap.data() } as BookkeepingRecord);
        });
        setRecords(loadedRecords);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `household_ledgers/${householdId}/records`);
      });

      // 3. Simulated/Registered household collaborators
      const membersColRef = collection(db, 'household_ledgers', householdId, 'members');
      const unsubMembers = onSnapshot(membersColRef, (snapshot) => {
        const loadedMembers: LedgerMember[] = [];
        snapshot.forEach((docSnap) => {
          loadedMembers.push(docSnap.data() as LedgerMember);
        });
        setMembers(loadedMembers);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `household_ledgers/${householdId}/members`);
      });

      return () => {
        unsubLedger();
        unsubRecords();
        unsubMembers();
      };
    } else {
      // LOCAL FALLBACK MODE
      const storedLedger = localStorage.getItem(`local_ledger_${householdId}`);
      if (storedLedger) {
        setHouseholdName(JSON.parse(storedLedger).name || "公用家庭帳本");
      } else {
        const initial = { id: householdId, name: "公用家庭帳本" };
        localStorage.setItem(`local_ledger_${householdId}`, JSON.stringify(initial));
        setHouseholdName(initial.name);
      }

      const cachedRecords = localStorage.getItem(`local_records_${householdId}`);
      if (cachedRecords) {
        setRecords(JSON.parse(cachedRecords));
      }

      const cachedMembers = localStorage.getItem(`local_members_${householdId}`);
      if (cachedMembers) {
        setMembers(JSON.parse(cachedMembers));
      }
    }
  }, [isDbOnline, householdId]);

  // Keep simulated active user updated on localStorage
  useEffect(() => {
    localStorage.setItem('simulated_member_id', currentMemberId);
  }, [currentMemberId]);

  // --- STATISTICAL FILTER CALCULATIONS ---
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const recMonth = rec.date.substring(0, 7);
      if (recMonth !== selectedMonth) return false;
      if (filterType !== 'all' && rec.type !== filterType) return false;
      if (filterCategory !== 'all' && rec.category !== filterCategory) return false;
      return true;
    });
  }, [records, selectedMonth, filterType, filterCategory]);

  const allTimeFilteredRecords = useMemo(() => {
    return records.filter(rec => {
      if (ledgerMode === 'split') {
        if (filterMember !== 'all' && rec.payerId !== filterMember) return false;
      } else {
        if (filterType !== 'all' && rec.type !== filterType) return false;
      }
      if (filterCategory !== 'all' && rec.category !== filterCategory) return false;
      return true;
    });
  }, [records, filterType, filterCategory, filterMember, ledgerMode]);

  const monthlyMetrics = useMemo(() => {
    let incomeSum = 0;
    let expenseSum = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    records.forEach(rec => {
      // Lifetime totals
      if (rec.type === 'income') {
        totalIncome += rec.amount;
      } else {
        totalExpense += rec.amount;
      }

      // Current actual month totals (not selectedMonth)
      if (rec.date.substring(0, 7) === currentMonthStr) {
        if (rec.type === 'income') {
          incomeSum += rec.amount;
        } else {
          expenseSum += rec.amount;
        }
      }
    });

    return {
      income: incomeSum,
      expense: expenseSum,
      net: totalIncome - totalExpense
    };
  }, [records]);

  const splitBalance = useMemo(() => {
    if (ledgerMode !== 'split' || members.length < 2) return null;

    // nets[userId] > 0: 別人欠他; < 0: 他欠別人
    const nets: { [userId: string]: number } = {};
    members.forEach(m => { nets[m.userId] = 0; });

    // 每筆 record：解析每位分擔人應付金額，付款人應收加總
    records
      .filter(r => r.date.substring(0, 7) === selectedMonth && r.payerId)
      .forEach(r => {
        if (!r.payerId || nets[r.payerId] === undefined) return;

        let shares: { [uid: string]: number };

        if (r.splitShares && Object.keys(r.splitShares).length > 0) {
          // 優先使用自訂金額（含付款人自己若有分擔）
          shares = Object.fromEntries(
            Object.entries(r.splitShares).filter(([uid]) => nets[uid] !== undefined)
          );
        } else if (r.splitWithIds && r.splitWithIds.length > 0) {
          // fallback：splitWithIds 均分
          const eligible = r.splitWithIds.filter(id => nets[id] !== undefined);
          const per = eligible.length > 0 ? r.amount / eligible.length : 0;
          shares = Object.fromEntries(eligible.map(uid => [uid, per]));
        } else {
          // 最舊 fallback：除付款人外全員均分
          const others = members.filter(m => m.userId !== r.payerId).map(m => m.userId);
          const per = others.length > 0 ? r.amount / others.length : 0;
          shares = Object.fromEntries(others.map(uid => [uid, per]));
        }

        if (Object.keys(shares).length === 0) return;

        const totalShare = Object.values(shares).reduce((s, v) => s + v, 0);
        nets[r.payerId] += totalShare;         // 付款人應收分擔人總額
        Object.entries(shares).forEach(([uid, amt]) => {
          nets[uid] -= amt;                    // 各分擔人應付自己那份
        });
      });

    // 四捨五入，避免浮點誤差
    const roundedNets = members.map(m => ({
      userId: m.userId,
      nickname: m.nickname,
      net: Math.round(nets[m.userId] || 0),
    }));

    // 貪心配對產生最少筆數的還款清單
    const creditors = roundedNets.filter(n => n.net > 0).sort((a, b) => b.net - a.net);
    const debtors   = roundedNets.filter(n => n.net < 0).sort((a, b) => a.net - b.net);
    const settlements: { from: string; to: string; amount: number }[] = [];

    let ci = 0, di = 0;
    const cRem = creditors.map(c => c.net);
    const dRem = debtors.map(d => Math.abs(d.net));

    while (ci < creditors.length && di < debtors.length) {
      const amt = Math.min(cRem[ci], dRem[di]);
      if (amt > 0) {
        settlements.push({ from: debtors[di].nickname, to: creditors[ci].nickname, amount: amt });
      }
      cRem[ci] -= amt;
      dRem[di] -= amt;
      if (cRem[ci] === 0) ci++;
      if (dRem[di] === 0) di++;
    }

    // 各人實際消費 = 所有記錄中屬於該成員的 share 加總
    const consumed: { [userId: string]: number } = {};
    members.forEach(m => { consumed[m.userId] = 0; });

    records
      .filter(r => r.date.substring(0, 7) === selectedMonth && r.payerId)
      .forEach(r => {
        let shares: { [uid: string]: number };
        if (r.splitShares && Object.keys(r.splitShares).length > 0) {
          shares = Object.fromEntries(
            Object.entries(r.splitShares).filter(([uid]) => consumed[uid] !== undefined)
          );
        } else if (r.splitWithIds && r.splitWithIds.length > 0) {
          const eligible = r.splitWithIds.filter(id => consumed[id] !== undefined);
          const per = eligible.length > 0 ? r.amount / eligible.length : 0;
          shares = Object.fromEntries(eligible.map(uid => [uid, per]));
        } else {
          const others = members.filter(m => m.userId !== r.payerId).map(m => m.userId);
          const per = others.length > 0 ? r.amount / others.length : 0;
          shares = Object.fromEntries(others.map(uid => [uid, per]));
        }
        Object.entries(shares).forEach(([uid, amt]) => {
          if (consumed[uid] !== undefined) consumed[uid] += amt;
        });
      });

    return {
      balanced: settlements.length === 0,
      settlements,
      memberActualConsumption: members.map(m => ({
        nickname: m.nickname,
        consumed: Math.round(consumed[m.userId] || 0),
      })),
    };
  }, [ledgerMode, members, records, selectedMonth]);

  const categoryChartData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    filteredRecords
      .filter(r => r.type === 'expense')
      .forEach(rec => {
        categoryTotals[rec.category] = (categoryTotals[rec.category] || 0) + rec.amount;
      });
    return Object.keys(categoryTotals).map(cat => ({
      name: cat,
      value: categoryTotals[cat]
    }));
  }, [filteredRecords]);

  const dailyChartData = useMemo(() => {
    const dailyMap: { [key: string]: { income: number; expense: number } } = {};
    filteredRecords.forEach(rec => {
      const day = rec.date.substring(8, 10) + '日';
      if (!dailyMap[day]) {
        dailyMap[day] = { income: 0, expense: 0 };
      }
      if (rec.type === 'income') {
        dailyMap[day].income += rec.amount;
      } else {
        dailyMap[day].expense += rec.amount;
      }
    });
    return Object.keys(dailyMap)
      .sort()
      .map(day => ({
        day,
        '收入': dailyMap[day].income,
        '支出': dailyMap[day].expense
      }));
  }, [filteredRecords]);

  // --- CORE CALL EVENTS / MUTATIONS ---
  const handleAddRecordItem = async (data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    payerId?: string;
    isSettled?: boolean;
    splitWithIds?: string[];
    splitShares?: { [userId: string]: number };
  }) => {
    const payer = data.payerId ? (members.find(m => m.userId === data.payerId) || null) : null;

    const currentUser = members.find(m => m.userId === currentMemberId);
    const payload: Partial<BookkeepingRecord> = {
      createdBy: currentMemberId,
      creatorName: currentUser ? currentUser.nickname : "Unknown",
      type: data.type,
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description,
    };

    if (data.payerId) {
      payload.payerId = data.payerId;
      payload.payerName = payer ? payer.nickname : '';
      payload.isSettled = data.isSettled;
    }

    if (data.splitWithIds && data.splitWithIds.length > 0) {
      payload.splitWithIds = data.splitWithIds;
    }
    if (data.splitShares && Object.keys(data.splitShares).length > 0) {
      payload.splitShares = data.splitShares;
    }

    const newRecordId = 'rec_' + Date.now();

    if (isDbOnline && db) {
      try {
        const docRef = doc(db, 'household_ledgers', householdId, 'records', newRecordId);
        await setDoc(docRef, { ...payload, id: newRecordId, createdAt: new Date().toISOString() });
        triggerFeedback("成功記錄一筆帳目至雲端！", "success");
      } catch (err) {
        triggerFeedback("儲存失敗，請檢查網路連線", "error");
        console.error(err);
      }
    } else {
      const updated = [{ id: newRecordId, ...payload } as BookkeepingRecord, ...records];
      localStorage.setItem(`local_records_${householdId}`, JSON.stringify(updated));
      setRecords(updated);
      triggerFeedback("成功記錄一筆帳目！(儲存於本機)", "success");
    }

    setIsAddModalOpen(false);
  };

  const handleEditRecord = (record: BookkeepingRecord) => {
    setEditingRecord(record);
    setIsAddModalOpen(true);
  };

  const handleUpdateRecordItem = async (id: string, data: {
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
    description: string;
    payerId?: string;
    isSettled?: boolean;
    splitWithIds?: string[];
    splitShares?: { [userId: string]: number };
  }) => {
    const payer = data.payerId ? (members.find(m => m.userId === data.payerId) || null) : null;

    const payload: Partial<BookkeepingRecord> = {
      type: data.type,
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description,
      payerId: data.payerId || null as any,
      payerName: payer ? payer.nickname : '',
      isSettled: data.payerId ? data.isSettled : false,
      splitWithIds: data.splitWithIds && data.splitWithIds.length > 0 ? data.splitWithIds : null as any,
      splitShares: data.splitShares && Object.keys(data.splitShares).length > 0 ? data.splitShares : null as any,
      updatedAt: new Date().toISOString()
    };

    if (isDbOnline && db) {
      try {
        const docRef = doc(db, 'household_ledgers', householdId, 'records', id);
        await setDoc(docRef, payload, { merge: true });
        triggerFeedback("帳目已更新成功！", "success");
      } catch (err) {
        triggerFeedback("更新失敗，請檢查網路連線", "error");
        console.error(err);
      }
    } else {
      const updated = records.map(r => r.id === id ? { ...r, ...payload } : r);
      localStorage.setItem(`local_records_${householdId}`, JSON.stringify(updated));
      setRecords(updated);
      triggerFeedback("帳目已在本機更新成功！", "success");
    }

    setIsAddModalOpen(false);
    setEditingRecord(null);
  };

  const handleBulkSettleMonth = async (month: string) => {
    // Filter records in that specific month that are expenses, have a payer, and are NOT settled
    const targets = records.filter(r => 
      r.date.substring(0, 7) === month && 
      r.type === 'expense' && 
      !!r.payerId && 
      !r.isSettled
    );

    if (targets.length === 0) {
      triggerFeedback("此月份已無待結清的項目", "info");
      return;
    }

    if (isDbOnline && db) {
      try {
        const updatePromises = targets.map(r => {
          const docRef = doc(db, 'household_ledgers', householdId, 'records', r.id);
          return setDoc(docRef, { isSettled: true }, { merge: true });
        });
        await Promise.all(updatePromises);
        triggerFeedback(`已成功結清 ${targets.length} 筆帳目！`, "success");
      } catch (err) {
        triggerFeedback("批次結清失敗", "error");
      }
    } else {
      const updated = records.map(r => 
        (r.date.substring(0, 7) === month && !!r.payerId && !r.isSettled) 
          ? { ...r, isSettled: true } 
          : r
      );
      localStorage.setItem(`local_records_${householdId}`, JSON.stringify(updated));
      setRecords(updated);
      triggerFeedback(`已結清 ${targets.length} 筆帳目 (儲存於本機)`, "success");
    }
  };

  const handleToggleSettled = async (record: BookkeepingRecord) => {
    if (!record.payerId) return;
    const updatedStatus = !record.isSettled;

    if (isDbOnline && db) {
      try {
        const docRef = doc(db, 'household_ledgers', householdId, 'records', record.id);
        await setDoc(docRef, { isSettled: updatedStatus }, { merge: true });
        triggerFeedback(`帳目結清狀態已更新為：${updatedStatus ? '已結清' : '未結清'}`, "success");
      } catch (err) {
        triggerFeedback("狀態更新失敗", "error");
      }
    } else {
      const updated = records.map(r => r.id === record.id ? { ...r, isSettled: updatedStatus } : r);
      localStorage.setItem(`local_records_${householdId}`, JSON.stringify(updated));
      setRecords(updated);
      triggerFeedback("帳目結清狀態已更新！(儲存於本機)", "success");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (isDbOnline && db) {
      try {
        const docRef = doc(db, 'household_ledgers', householdId, 'records', id);
        await deleteDoc(docRef);
        triggerFeedback("已刪除該筆帳單項目", "success");
      } catch (err) {
        triggerFeedback("刪除失敗", "error");
      }
    } else {
      const updated = records.filter(r => r.id !== id);
      localStorage.setItem(`local_records_${householdId}`, JSON.stringify(updated));
      setRecords(updated);
      triggerFeedback("已成功清除該項目 (本機)", "info");
    }
  };

  const handleUpdateLedgerConfig = async (newName: string) => {
    const updatedName = newName.trim();
    if (!updatedName) {
      triggerFeedback("名稱不宜為空！", "error");
      return;
    }

    if (isDbOnline && db) {
      try {
        const ref = doc(db, 'household_ledgers', householdId);
        await setDoc(ref, { id: householdId, name: updatedName, monthlyBudget: 0 }, { merge: true });
        triggerFeedback("基本資料已同步更新至雲端！", "success");
      } catch (err) {
        triggerFeedback("更新失敗", "error");
      }
    } else {
      const updatedObj = { id: householdId, name: updatedName };
      localStorage.setItem(`local_ledger_${householdId}`, JSON.stringify(updatedObj));
      setHouseholdName(updatedName);
      triggerFeedback("已更新帳本名稱！(儲存於本機)", "success");
    }
    setIsConfigModalOpen(false);
  };

  const handleAddSimulatedMember = async (nickname: string, color: string) => {
    const fakeId = 'user_' + Date.now();
    const newMember: LedgerMember = {
      userId: fakeId,
      nickname,
      color,
      lastActive: new Date().toISOString()
    };

    if (isDbOnline && db) {
      try {
        const docRef = doc(db, 'household_ledgers', householdId, 'members', fakeId);
        await setDoc(docRef, newMember);
        triggerFeedback(`成員「${newMember.nickname}」已同步加入群組！`, "success");
      } catch (err) {
        triggerFeedback("新增失敗，請連線重試", "error");
      }
    } else {
      const updated = [...members, newMember];
      localStorage.setItem(`local_members_${householdId}`, JSON.stringify(updated));
      setMembers(updated);
      triggerFeedback(`已成功加入成員：${newMember.nickname}`, "success");
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* HEADER BAR */}
      <Header isDbOnline={isDbOnline} />

      {/* FEEDBACK TOAST NOTIFICATION */}
      <FeedbackToast message={feedbackMsg} onClose={() => setFeedbackMsg(null)} />

      {/* LEDGER TAB SWITCHER */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-md mx-auto flex">
          {LEDGER_TABS.map((tab, idx) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLedgerIdx(idx)}
              className={`flex-1 text-sm font-semibold py-2.5 border-b-2 transition-colors ${
                activeLedgerIdx === idx
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.defaultName}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN SCREEN SECTION */}
      <main id="main-content" className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col gap-4 pb-28">
        
        {/* CURRENT LEDGER HIGHLIGHT CARD */}
        <LedgerHighlightCard
          householdName={householdName}
          monthlyMetrics={monthlyMetrics}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          ledgerMode={ledgerMode}
          splitBalance={splitBalance}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onBulkSettle={() => handleBulkSettleMonth(selectedMonth)}
        />

        {/* ACTIVE TEAM COLLABORATORS AVATAR ROW */}
        <CollaboratorsRow 
          members={members}
          currentMemberId={currentMemberId}
          onSelectMember={(userId, nickname) => {
            setCurrentMemberId(userId);
            triggerFeedback(`已將記帳身分設定為：${nickname}`, "info");
          }}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />

        {/* STATISTICS RECHARTS PANEL — shared mode only */}
        {ledgerMode === 'shared' && (
          <StatisticsPanel
            filteredRecords={filteredRecords}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            currentChartTab={currentChartTab}
            onChangeChartTab={setCurrentChartTab}
            categoryChartData={categoryChartData}
            members={members}
            onBulkSettle={() => handleBulkSettleMonth(selectedMonth)}
            ledgerMode={ledgerMode}
          />
        )}

        {/* FINANCIAL RECONCILIATIONS LIST */}
        <BookkeepingLog
          filteredRecords={allTimeFilteredRecords}
          filterType={filterType}
          filterCategory={filterCategory}
          setFilterType={setFilterType}
          setFilterCategory={setFilterCategory}
          onDeleteRecord={handleDeleteRecord}
          onEditRecord={handleEditRecord}
          onToggleSettled={handleToggleSettled}
          onOpenAddModal={() => {
            setEditingRecord(null);
            setIsAddModalOpen(true);
          }}
          ledgerMode={ledgerMode}
          members={members}
          filterMember={filterMember}
          setFilterMember={setFilterMember}
        />
      </main>

      {/* FOOTER FIXED BOTTOM DENSE MENU */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around gap-3">
          <button 
            type="button"
            id="nav-quick-add"
            onClick={() => {
              setEditingRecord(null);
              setIsAddModalOpen(true);
            }}
            className="btn-primary flex-1 text-xs"
          >
            <Plus className="w-4 h-4 stroke-3" />
            <span>{ledgerMode === 'split' ? '新增支出' : '記一筆公費'}</span>
          </button>

          <button 
            type="button"
            id="nav-config"
            onClick={() => setIsConfigModalOpen(true)}
            className="bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-slate-200 active:scale-95 transition flex items-center gap-1 cursor-pointer"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>帳冊設定</span>
          </button>
        </div>
      </div>

      {/* 1. DIALOG: NEW RECORD FORM POPUP */}
      <RecordFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingRecord(null);
        }}
        members={members}
        initialData={editingRecord}
        ledgerMode={ledgerMode}
        onAddRecord={handleAddRecordItem}
        onUpdateRecord={handleUpdateRecordItem}
      />

      {/* 2. DIALOG: SETTINGS & MEMBER LIST MANAGEMENT POPUP */}
      <SettingsModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        householdName={householdName}
        onUpdateHouseholdName={handleUpdateLedgerConfig}
        onAddMember={handleAddSimulatedMember}
      />

    </div>
  );
}
