import { Player, Team } from './types';

export const INITIAL_TEAMS: Team[] = [
  { id: 't1', name: '팀 A', budget: 1000, players: [] },
  { id: 't2', name: '팀 B', budget: 1000, players: [] },
  { id: 't3', name: '팀 C', budget: 1000, players: [] },
  { id: 't4', name: '팀 D', budget: 1000, players: [] },
  { id: 't5', name: '팀 E', budget: 1000, players: [] },
  { id: 't6', name: '팀 F', budget: 1000, players: [] },
];

export const MOCK_PLAYERS: Player[] = [
  { id: 'p1', name: '눈길', role: 'TOP', currentTier: 'D1', peakTier: 'C734' },
  { id: 'p2', name: '(주)박사장$', role: 'TOP', currentTier: 'E1', peakTier: 'M89' },
  { id: 'p3', name: '마두', role: 'TOP', currentTier: 'M17', peakTier: 'M17' },
  { id: 'p4', name: '꿀탱탱', role: 'TOP', currentTier: 'M71', peakTier: 'GM678' },
  { id: 'p5', name: '한포비', role: 'TOP', currentTier: 'D1', peakTier: 'M165' },
  { id: 'p6', name: '꿀템은죽었다', role: 'TOP', currentTier: 'M46', peakTier: 'M274' },

  { id: 'p7', name: '이상호', role: 'JGL', currentTier: 'M334', peakTier: 'GM653' },
  { id: 'p8', name: '아뚱.', role: 'JGL', currentTier: 'D1', peakTier: 'GM703' },
  { id: 'p9', name: '옥맨', role: 'JGL', currentTier: 'M496', peakTier: 'M550' },
  { id: 'p10', name: '호진LEE', role: 'JGL', currentTier: 'M138', peakTier: 'GM674' },
  { id: 'p11', name: '라파엘ㅋ', role: 'JGL', currentTier: 'M643', peakTier: 'M755' },
  { id: 'p12', name: '구스범스', role: 'JGL', currentTier: 'M100', peakTier: 'M333' },

  { id: 'p13', name: '김민교.', role: 'MID', currentTier: 'M137', peakTier: 'M647' },
  { id: 'p14', name: '서건우', role: 'MID', currentTier: 'D2', peakTier: 'M214' },
  { id: 'p15', name: '야옹민지', role: 'MID', currentTier: 'M258', peakTier: 'M664' },
  { id: 'p16', name: '#민찬기', role: 'MID', currentTier: 'E4', peakTier: 'D1' },
  { id: 'p17', name: '쪼이.', role: 'MID', currentTier: 'D1', peakTier: 'M249' },
  { id: 'p18', name: '김진솔', role: 'MID', currentTier: 'UNRANKED', peakTier: 'M347' },

  { id: 'p19', name: '깐숙', role: 'BOT', currentTier: 'M54', peakTier: 'M426' },
  { id: 'p20', name: '이경민+_+.', role: 'BOT', currentTier: 'D4', peakTier: 'M26' },
  { id: 'p21', name: '엽동이', role: 'BOT', currentTier: 'D2', peakTier: 'M111' },
  { id: 'p22', name: '한남맛종욱', role: 'BOT', currentTier: 'E3', peakTier: 'D4' },
  { id: 'p23', name: '종탁이', role: 'BOT', currentTier: 'M274', peakTier: 'C572' },
  { id: 'p24', name: '감블러', role: 'BOT', currentTier: 'D1', peakTier: 'M146' },

  { id: 'p25', name: '김유나_', role: 'SUP', currentTier: 'D2', peakTier: 'M116' },
  { id: 'p26', name: '한아밍', role: 'SUP', currentTier: 'D3', peakTier: 'M84' },
  { id: 'p27', name: '히엉^^7', role: 'SUP', currentTier: 'E2', peakTier: 'M222' },
  { id: 'p28', name: '뿌리.', role: 'SUP', currentTier: 'D2', peakTier: 'M119' },
  { id: 'p29', name: '안녕수야', role: 'SUP', currentTier: 'E2', peakTier: 'M229' },
  { id: 'p30', name: '희진이라구', role: 'SUP', currentTier: 'M302', peakTier: 'M498' },
];
