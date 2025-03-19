export type Rank = 'warrior' | 'knight' | 'goddess' | 'warGod' | 'emperor';
export type UserRole = 'user' | 'moderator' | 'admin';

export interface Player {
  id: number;
  userId: number;
  characterId: string;
  nickname: string;
  server?: string;
  alliance?: string;
  level?: number;
  powerNow?: number;
  powerMax?: number;
  hiddenPower?: number;
  rank?: Rank;
  hidden?: boolean;
}

export interface Alliance {
  id: number;
  name: string;
  server: string;
  memberCount: number;
  totalPower: number;
  averagePower?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role?: UserRole;
}
