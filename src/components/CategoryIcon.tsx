/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Coins, Zap, Flame, ShoppingBag, HelpCircle, Droplets, Wifi, UtensilsCrossed, Car, Smile } from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  if (name.includes('公費') || name.includes('撥款')) return <Coins className={className} />;
  if (name.includes('水費') || name.includes('日用品')) return <Droplets className={className} />;
  if (name.includes('電費')) return <Zap className={className} />;
  if (name.includes('網路')) return <Wifi className={className} />;
  if (name.includes('瓦斯') || name.includes('天然氣')) return <Flame className={className} />;
  if (name.includes('雜費') || name.includes('購物')) return <ShoppingBag className={className} />;
  if (name.includes('餐飲')) return <UtensilsCrossed className={className} />;
  if (name.includes('交通')) return <Car className={className} />;
  if (name.includes('娛樂')) return <Smile className={className} />;
  return <HelpCircle className={className} />;
}
