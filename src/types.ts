import { Session } from './session'

export enum EventType {
  SessionClose,
  SessionOpen
}

export interface Event {
  type: EventType
  data: any
}

export interface SessionCloseEvent extends Event {
  type: EventType.SessionClose
  data: Session
}

export interface Logger {
  info: (data: object) => void
  debug: (data: object) => void
}

export type Rotation = number
export type Speed = number
export type Position = { x: number, y: number }

export enum ComponentType {
  Player = 'Player',
  DestroyedPlayer = 'DestroyedPlayer',
  Shot = 'Shot',
  Wall = 'Wall',
  Radar = 'Radar',
  Mine = 'Mine'
}

export enum UpdateType {
  Movement = 'Movement',
  Hit = 'Hit',
  Scan = 'Scan',
  PlayerDestroyed = 'PlayerDestroyed',
  RemovePlayer = 'RemovePlayer'
}

