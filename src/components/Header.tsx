/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins } from 'lucide-react';

interface HeaderProps {
  isDbOnline: boolean;
}

export function Header({ isDbOnline }: HeaderProps) {
  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900">家庭公費記帳簿</h1>
            <span className="text-[10px] text-slate-500 font-medium font-sans">多人即時協作帳冊</span>
          </div>
        </div>
        
        {isDbOnline ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>雲端同步中</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-550"></span>
            <span>本機離線模式</span>
          </div>
        )}
      </div>
    </header>
  );
}
