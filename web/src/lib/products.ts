import rawItems from '@/data/items.json';

export function getCanonicalProductKey(rawName?: string, name?: string): string {
  const candidate = (rawName || name || '').trim();
  const cleaned = candidate
    .toLowerCase()
    .replace(/^ba:itemname_/, '')
    .replace(/^itemname_/, '')
    .replace(/[^a-z0-9]/g, '');
  return cleaned || 'unknown';
}

export function getItemImageSrc(rawItemName: string) {
  const clean = (rawItemName || '')
    .replace('ba:itemname_', '')
    .replace('ba:item_', '')
    .replace('ba:item', '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (clean.includes('burger')) return '/images/items/burger.png';
  if (clean.includes('soda') || clean.includes('can')) return '/images/items/sodacan.png';
  if (clean.includes('fries') || clean.includes('french')) return '/images/items/frenchfries.png';
  if (clean.includes('coffee') || clean.includes('cup')) return '/images/items/cupofcoffee.png';
  if (clean.includes('salad')) return '/images/items/salad.png';
  if (clean.includes('pizza')) return '/images/items/pizza.png';
  if (clean.includes('donut')) return '/images/items/donut.png';
  if (clean.includes('croissant')) return '/images/items/croissant.png';
  if (clean.includes('hotdog')) return '/images/items/hotdog.png';
  if (clean.includes('paperbag') || clean.includes('bag')) return '/images/items/paperbag.png';
  if (clean.includes('icecream') || clean.includes('ice')) return '/images/items/icecream.png';
  if (clean.includes('kabob') || clean.includes('skewer')) return '/images/items/kabob.png';
  if (clean.includes('apple')) return '/images/items/apple.png';
  if (clean.includes('banana')) return '/images/items/banana.png';
  if (clean.includes('carrot')) return '/images/items/carrot.png';
  if (clean.includes('lettuce')) return '/images/items/lettuce.png';
  if (clean.includes('pear')) return '/images/items/pear.png';
  if (clean.includes('tomato')) return '/images/items/tomato.png';
  if (clean.includes('flower') || clean.includes('cheapflower')) return '/images/items/cheapflower.png';
  if (clean.includes('expensiveflower')) return '/images/items/expensiveflower.png';
  if (clean.includes('gift') || clean.includes('box')) return '/images/items/cheapgift.png';
  if (clean.includes('jewelry') || clean.includes('necklace')) return '/images/items/expensivejewelry.png';
  if (clean.includes('beer')) return '/images/items/beer.png';
  if (clean.includes('wine')) return '/images/items/bottleofwine.png';
  if (clean.includes('cigar')) return '/images/items/cigar.png';

  const found = (rawItems as any[]).find(i => {
    const rawIdClean = (i.id || '').replace('ba:item_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameClean = (i.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return rawIdClean === clean || nameClean === clean;
  });

  if (found && found.image) {
    return `/images/items/${found.image}`;
  }

  return '';
}
