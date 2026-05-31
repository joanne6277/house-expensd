/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Zap, Flame, ShoppingBag, HelpCircle, Droplets, Wifi } from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  if (name.includes('公費') || name.includes('撥款')) return <Coins className={className} />;
  if (name.includes('水費')) return <Droplets className={className} />;
  if (name.includes('電費')) return <Zap className={className} />;
  if (name.includes('網路')) return <Wifi className={className} />;
  if (name.includes('瓦斯') || name.includes('天然氣')) return <Flame className={className} />;
  if (name.includes('雜費')) return <ShoppingBag className={className} />;
  return <HelpCircle className={className} />;
}
