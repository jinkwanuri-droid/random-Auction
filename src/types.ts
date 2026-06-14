export type Role = 'TOP' | 'JGL' | 'MID' | 'BOT' | 'SUP';

export interface Player {
  id: string;
  name: string;
  role: Role;
  currentTier: string;
  peakTier: string;
  bidPrice?: number;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  players: Player[];
}
