export interface Dealership {
  id: string;
  name: string;
  district: string;
  address: string;
  specialty: string;
  inventoryVehicleIds: string[];
}

export const DEALERSHIPS_DB: Dealership[] = [
  {
    id: 'citycars',
    name: 'City Cars',
    district: 'Garment District',
    address: '76 3rd St',
    specialty: 'Entry-level compact commuters, classic sedans, and light utility pickups.',
    inventoryVehicleIds: ['honzamimic', 'vordtiaravic', 'vordv150']
  },
  {
    id: 'generalustrucks',
    name: 'General US Trucks',
    district: 'Industry City',
    address: '1 7th Ave',
    specialty: 'Heavy commercial logistics freight trucks, delivery vans, and pickup haulers.',
    inventoryVehicleIds: ['freighttruckt1', 'deliverytruck', 'mersaididash', 'umcdesert']
  },
  {
    id: 'manhattanluxury',
    name: 'Manhattan Luxury Cars',
    district: 'Murray Hill',
    address: '15 Broadway',
    specialty: 'High-performance sports coupes, prestige executive sedans, and luxury SUVs.',
    inventoryVehicleIds: ['petrollsfanton', 'anselmoaf90', 'mersaidimgagt', 'vordpony', 'missamvillian', 'ferdinand112', 'mersaidis500', 'bima320', 'umcnunavut']
  },
  {
    id: 'hamptonsaxis',
    name: 'The Hamptons Axis',
    district: 'The Hamptons',
    address: '12 7th Ave',
    specialty: 'Elite luxury automotive showroom for exotic performance cars and grand tourers.',
    inventoryVehicleIds: ['petrollsfanton', 'anselmoaf90', 'mersaidimgagt', 'vordpony', 'missamvillian', 'ferdinand112', 'mersaidis500', 'bima320', 'umcnunavut']
  },
  {
    id: 'onyxchauffeurs',
    name: 'Onyx Luxury Chauffeurs',
    district: 'The Hamptons',
    address: '10 7th Ave',
    specialty: 'Executive private driver services and executive limousine sales.',
    inventoryVehicleIds: ['limo']
  }
];
