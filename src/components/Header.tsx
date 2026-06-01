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
          <div className="bg-brand-600 text-white p-1.5 rounded-lg shadow-sm">
            <Coins className="w-5 h-5" />
          </div>
          <h1 className="font-bold text-sm tracking-tight text-slate-900">公費記帳!</h1>
        </div>
        
        {isDbOnline ? (
          <div className="badge-status bg-brand-50 text-brand-700 border-brand-200">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            <span>雲端同步中</span>
          </div>
        ) : (
          <div className="badge-status bg-amber-50 text-amber-700 border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>本機離線模式</span>
          </div>
        )}
      </div>
    </header>
  );
}
