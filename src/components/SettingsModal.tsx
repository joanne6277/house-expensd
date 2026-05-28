/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdName: string;
  onUpdateHouseholdName: (newName: string) => Promise<void> | void;
  onAddMember: (nickname: string, color: string) => Promise<void> | void;
}

export function SettingsModal({
  isOpen,
  onClose,
  householdName,
  onUpdateHouseholdName,
  onAddMember,
}: SettingsModalProps) {
  const [newHouseholdNameInput, setNewHouseholdNameInput] = useState(householdName);
  const [newSimulatedMemberName, setNewSimulatedMemberName] = useState('');
  const [newSimulatedMemberColor, setNewSimulatedMemberColor] = useState('sky');

  // Synchronize name selection options
  useEffect(() => {
    if (isOpen) {
      setNewHouseholdNameInput(householdName);
    }
  }, [isOpen, householdName]);

  const handleUpdateName = () => {
    onUpdateHouseholdName(newHouseholdNameInput);
  };

  const handleCreateMember = () => {
    if (!newSimulatedMemberName.trim()) return;
    onAddMember(newSimulatedMemberName.trim(), newSimulatedMemberColor);
    setNewSimulatedMemberName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="settings-collaboration-modal-overlay" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div 
            id="settings-collaboration-modal"
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white rounded-t-2xl sm:rounded-xl w-full max-w-sm overflow-hidden max-h-[92vh] flex flex-col"
          >
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-800">共同協作與基本設定</h3>
              <button 
                type="button"
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                關閉
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex flex-col gap-4">
              
              {/* Ledger metadata title modifier */}
              <div className="flex flex-col gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">設定家庭帳簿基本名稱</h4>
                
                <div className="flex flex-col gap-1">
                  <input
                    type="text"
                    placeholder="修改後的家庭名稱"
                    value={newHouseholdNameInput}
                    onChange={(e) => setNewHouseholdNameInput(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUpdateName}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  隨時確認修改
                </button>
              </div>

              {/* Collaboration Member Management */}
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">新增其他的協作家庭成員</h4>
                
                <div className="flex flex-col gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input
                    type="text"
                    placeholder="新成員稱呼 e.g. 阿嬤"
                    value={newSimulatedMemberName}
                    onChange={(e) => setNewSimulatedMemberName(e.target.value)}
                    className="w-full bg-white border border-slate-200 card-inner rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                  />
                  
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 font-semibold uppercase">專屬主題色:</span>
                    <select
                      value={newSimulatedMemberColor}
                      onChange={(e) => setNewSimulatedMemberColor(e.target.value)}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700"
                    >
                      <option value="sky">晴空藍</option>
                      <option value="coral">珊瑚橘</option>
                      <option value="lavender">薰衣草</option>
                      <option value="mint">湖水綠</option>
                      <option value="yellow">向日葵</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateMember}
                    className="bg-slate-900 hover:bg-slate-800 text-white w-full py-1.5 rounded text-xs font-bold cursor-pointer mt-1"
                  >
                    確認加入群組
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-slate-100 text-slate-600 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                關閉配置頁
              </button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
