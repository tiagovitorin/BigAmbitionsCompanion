const fs = require('fs');
const html = fs.readFileSync('C:/Users/tiago/.gemini/antigravity-cli/brain/3189093f-6f1a-4155-a96a-698173975fab/.system_generated/steps/2257/content.md', 'utf8');

const cards = html.split('<div class="store-card">').slice(1);
console.log('Total store cards found:', cards.length);

const businessHours = {};

cards.forEach(card => {
  const nameMatch = card.match(/<h2>(.*?)<\/h2>/);
  if (!nameMatch) return;
  const name = nameMatch[1].trim();
  
  const scheduleMatch = card.match(/<table class="schedule-table">[\s\S]*?<\/table>/);
  if (scheduleMatch) {
    const table = scheduleMatch[0];
    const dayRows = table.match(/<tr><td>(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)<\/td>[\s\S]*?<\/tr>/g) || [];
    
    const weekSchedule = {};
    dayRows.forEach(row => {
      const dayMatch = row.match(/<tr><td>(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)<\/td>/);
      const day = dayMatch ? dayMatch[1] : '';
      
      const cells = row.match(/<td class="hour-cell[^"]*">/g) || [];
      const hours = cells.map(c => c.includes('open'));
      
      weekSchedule[day] = hours;
    });
    
    businessHours[name] = weekSchedule;
  }
});

console.log('Parsed businesses with schedule:', Object.keys(businessHours).length);
console.log('Gym Schedule:');
Object.entries(businessHours['Gym'] || {}).forEach(([day, hours]) => {
  const openHours = hours.map((o, h) => o ? h : null).filter(h => h !== null);
  console.log(day, 'Open count:', openHours.length, 'Range:', openHours.length > 0 ? (openHours[0] + ':00 - ' + (openHours[openHours.length-1]+1) + ':00') : 'Closed');
});

fs.writeFileSync('C:/Users/tiago/Desktop/CODING PROJECTS/BigAmbitionsTool/web/src/data/business_schedules.json', JSON.stringify(businessHours, null, 2));
