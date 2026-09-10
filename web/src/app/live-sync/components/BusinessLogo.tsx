'use client';

import { LiveBusinessData } from '@/context/LiveSyncContext';

interface BusinessLogoProps {
  business: LiveBusinessData;
  sizeClass?: string;
}

export default function BusinessLogo({ business, sizeClass = 'w-10 h-10' }: BusinessLogoProps) {
  const clean = (business.rawType || business.type || '')
    .replace('ba:businesstype_', '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  let iconSrc = '/images/storeicons/businesstype_fastfoodrestaurant.png';
  if (clean.includes('fastfood')) iconSrc = '/images/storeicons/businesstype_fastfoodrestaurant.png';
  else if (clean.includes('coffee')) iconSrc = '/images/storeicons/businesstype_coffeeshop.png';
  else if (clean.includes('supermarket')) iconSrc = '/images/storeicons/businesstype_supermarket.png';
  else if (clean.includes('electronics')) iconSrc = '/images/storeicons/businesstype_electronicsstore.png';
  else if (clean.includes('clothing')) iconSrc = '/images/storeicons/businesstype_clothingstore.png';
  else if (clean.includes('jewelry')) iconSrc = '/images/storeicons/businesstype_jewelrystore.png';
  else if (clean.includes('liquor')) iconSrc = '/images/storeicons/businesstype_liquorstore.png';
  else if (clean.includes('florist')) iconSrc = '/images/storeicons/businesstype_florist.png';
  else if (clean.includes('bookstore')) iconSrc = '/images/storeicons/businesstype_bookstore.png';
  else if (clean.includes('giftshop')) iconSrc = '/images/storeicons/businesstype_giftshop.png';
  else if (clean.includes('lawfirm')) iconSrc = '/images/storeicons/businesstype_lawfirm.png';
  else if (clean.includes('webdevelopment')) iconSrc = '/images/storeicons/businesstype_webdevelopmentagency.png';
  else if (clean.includes('graphicdesign')) iconSrc = '/images/storeicons/businesstype_graphicdesigner.png';
  else if (clean.includes('cinema')) iconSrc = '/images/storeicons/businesstype_cinema.png';
  else if (clean.includes('gym')) iconSrc = '/images/storeicons/businesstype_gym.png';
  else if (clean.includes('hairdresser')) iconSrc = '/images/storeicons/businesstype_hairdresser.png';
  else if (clean.includes('nightclub')) iconSrc = '/images/storeicons/businesstype_nightclub.png';
  else if (clean.includes('theater')) iconSrc = '/images/storeicons/businesstype_theater.png';
  else if (clean.includes('fruit') || clean.includes('vegetable')) iconSrc = '/images/storeicons/businesstype_fruitandvegetablestore.png';
  else if (clean.includes('eventplanning')) iconSrc = '/images/storeicons/businesstype_eventplanningagency.png';
  else if (clean.includes('travel')) iconSrc = '/images/storeicons/businesstype_travelagency.png';

  if (business.logo?.base64) {
    const bg = business.logo.bgHex || '#1E293B';
    const iconColor = business.logo.iconHex || '#000000';
    return (
      <div
        className={`${sizeClass} rounded-xl border border-[var(--border-base)] p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden`}
        style={{ backgroundColor: bg }}
      >
        <div
          className="w-full h-full"
          style={{
            backgroundColor: iconColor,
            WebkitMaskImage: `url("${business.logo.base64}")`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskImage: `url("${business.logo.base64}")`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center'
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-xl bg-slate-900 border border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden`}>
      <img
        src={iconSrc}
        alt={business.type}
        className="w-full h-full object-contain filter drop-shadow-xs"
      />
    </div>
  );
}
