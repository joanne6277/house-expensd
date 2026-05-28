/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Users, Plus, Check } from 'lucide-react';
import { LedgerMember, MEMBER_COLORS } from '../types';

interface CollaboratorsRowProps {
  members: LedgerMember[];
  currentMemberId: string;
  onSelectMember: (userId: string, nickname: string) => void;
  onOpenConfig: () => void;
}

export function CollaboratorsRow({
  members,
  currentMemberId,
  onSelectMember,
  onOpenConfig,
}: CollaboratorsRowProps) {
  return (
    <section id="collaborators-section" className="bg-white rounded-xl p-4 border border-slate-200 shadow-3xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[10px] font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>點選切換目前記帳身分:</span>
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {members.map((member) => {
          const isActiveSim = currentMemberId === member.userId;
          const colorInfo = MEMBER_COLORS.find(c => c.value === member.color) || MEMBER_COLORS[0];
          
          return (
            <button
              key={member.userId}
              onClick={() => onSelectMember(member.userId, member.nickname)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition cursor-pointer font-medium ${
                isActiveSim 
                  ? 'bg-slate-900 text-white font-semibold shadow-xs scale-102' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${colorInfo.bgClass}`}></span>
              <span>{member.nickname}</span>
              {isActiveSim && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          );
        })}
        
        <button
          id="invite-btn"
          onClick={onOpenConfig}
          className="w-7 h-7 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center cursor-pointer transition"
          title="新增家庭成員"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
