import { IncommingMessages } from './messages'

export interface MessagingHub {
  pull: () => IncommingMessages[]
}

