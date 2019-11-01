import {
  Session,
  ControlSession,
  isPlayerSession,
  isControlSession
} from './session'
import { UpdateType, ComponentType, Foo } from './components/arena'

// TODO move this type out of this file
export interface ComponentUpdate {
  type: UpdateType,
  component: Foo
}

export default function updateToNotifications (update: ComponentUpdate, sessions: (Session | ControlSession)[]): any[] {
  // NOTE I'm assuming here that there's only one control session
  const controlSession = sessions.find(isControlSession)
  const playerSessions = sessions.filter(isPlayerSession)

  if (update.type === UpdateType.Movement) {
    if (update.component.type === ComponentType.Shot) {
      return [{
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'Movement',
          component: {
            type: 'Shot',
            data: update.component.data
          }
        }
      }]
    }
  }

  if (update.type === UpdateType.Hit) {
    if (update.component.type === ComponentType.Wall) {
      return [
        {
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Wall'
            }
          }
        }
      ]
    }
    if (update.component.type === ComponentType.Player) {
      const { component: { data: { id: playerId, damage } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId )
      return [
        {
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Player',
              data: {
                id: playerId,
                damage
              }
            }
          }
        },
        {
          session: playerSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            data: {
              damage
            }
          }
        }
      ]
    }
  }

  if (update.type === UpdateType.Scan) {
    // This double is required because the type of component is not related to the value
    // of the update.type (this is :poop:)
    if (update.component.type === ComponentType.Radar) {
      const { component: { data: { playerId, players, unknown, shots } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [{
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'RadarScan',
          data: {
            players,
            unknown,
            shots
          }
        }
      }]
    }
  }

  if (update.type === UpdateType.PlayerDestroyed) {
    if (update.component.type === ComponentType.DestroyedPlayer) {
      const { component: { data: { id: playerId } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId )

      return [{
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'Destroyed',
        }
      },
      {
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'PlayerDestroyed',
          component: {
            type: 'Player',
            data: {
              id: playerId
            }
          }
        }
      }]
    }
  }
}

