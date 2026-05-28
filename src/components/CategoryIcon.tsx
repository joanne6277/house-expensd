/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Zap, Flame, ShoppingBag, Apple, Wrench, HelpCircle } from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  if (name.includes('公費') || name.includes('撥款')) return <Coins className={className} />;
  if (name.includes('水電') || name.includes('網路')) return <Zap className={className} />;
  if (name.includes('瓦斯') || name.includes('天然氣')) return <Flame className={className} />;
  if (name.includes('雜費')) return <ShoppingBag className={className} />;
  if (name.includes('生鮮') || name.includes('食材')) return <Apple className={className} />;
  if (name.includes('修補') || name.includes('公物') || name.includes('修繕')) return <Wrench className={className} />;
  return <HelpCircle className={className} />;
}
