import { Session } from './session'

export enum EventType {
  SessionClose
}

export interface Event {
  type: EventType
  data: any
}

export interface SessionCloseEvent extends Event {
  type: EventType.SessionClose
  data: Session
}

export interface ILogger {
  info: (data: object) => void
}

export type Rotation = number
export type Speed = number
export type Position = { x: number, y: number }
