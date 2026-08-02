/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';

/**
 * 鎖定背景捲動（modal 開啟期間）。
 *
 * iOS Safari 只加 `overflow: hidden` 無效，仍會捲動背景，且關閉 modal 後
 * 會停在錯誤的位置。標準解法是把 body 固定住並以負的 top 保留原捲動位置，
 * 關閉時再還原並捲回原處。
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const scrollY = window.scrollY;
    const { body } = document;
    const original = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.width = original.width;
      body.style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
