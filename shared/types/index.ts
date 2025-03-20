import type { users, shifts } from './prisma';

export type User = Omit<users, 'password'>;
export type Shift = shifts;

export interface AuthResponse {
  token: string;
}

export interface ErrorResponse {
  message: string;
}