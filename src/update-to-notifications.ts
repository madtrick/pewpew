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

// TODO fix the return types
// @ts-ignore TODO remove this ignore
export default function updateToNotifications (update: ComponentUpdate, sessions: (Session | ControlSession)[]): any[] {
  const controlSessions = sessions.filter(isControlSession)
  const playerSessions = sessions.filter(isPlayerSession)

  if (update.type === UpdateType.RemovePlayer) {
    if (update.component.type === ComponentType.Player) {
      return controlSessions.map((controlSession) => ({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'RemovePlayer',
          component: {
            type: 'Player',
            data: {
              // @ts-ignore TODO remove this ignore
              id: update.component.data.id
            }
          }
        }
      }))
    }
  }

  if (update.type === UpdateType.Movement) {
    if (update.component.type === ComponentType.Shot) {
      return controlSessions.map((controlSession) => ({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'Movement',
          component: {
            type: 'Shot',
            data: update.component.data
          }
        }
      }))
    }
  }

  if (update.type === UpdateType.MineHit && update.component.type === ComponentType.Mine) {
    const { component: { data: { playerId, damage, id } } } = update
    const playerSession = playerSessions.find((s) => s.playerId === playerId)
    return [
      ...controlSessions.map((controlSession) => ({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'MineHit',
          component: {
            type: 'Mine',
            data: {
              playerId,
              id,
              damage
            }
          }
        }
      })),
      {
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'MineHit',
          data: {
            damage
          }
        }
      }
    ]
  }

  if (update.type === UpdateType.Hit) {
    if (update.component.type === ComponentType.Wall) {
      return controlSessions.map((controlSession) => ({
        session: controlSession,
        notification: {
          type: 'Notification',
          id: 'Hit',
          component: {
            type: 'Wall',
            data: {
              // @ts-ignore TODO remove this ignore
              shotId: update.component.data.shotId
            }
          }
        }
      }))
    }

    if (update.component.type === ComponentType.Player) {
      // @ts-ignore TODO remove this ignore
      const { component: { data: { id: playerId, damage, shotId } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [
        ...controlSessions.map((controlSession) => ({
          session: controlSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            component: {
              type: 'Player',
              data: {
                shotId,
                id: playerId,
                // TODO include the remaining life
                damage
              }
            }
          }
        })),
        {
          session: playerSession,
          notification: {
            type: 'Notification',
            id: 'Hit',
            data: {
              // TODO remove the damage value from this message? what's the value of including it?
              // TODO include the coordinates of the hit?
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
      const { component: { data: { playerId, players, unknown, shots, mines } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [{
        session: playerSession,
        notification: {
          type: 'Notification',
          id: 'RadarScan',
          data: {
            players,
            unknown,
            shots,
            mines
          }
        }
      }]
    }
  }

  if (update.type === UpdateType.PlayerDestroyed) {
    if (update.component.type === ComponentType.DestroyedPlayer) {
      const { component: { data: { id: playerId } } } = update
      const playerSession = playerSessions.find((s) => s.playerId === playerId)

      return [
        {
          session: playerSession,
          notification: {
            type: 'Notification',
            id: 'Destroyed'
          }
        },
        ...controlSessions.map((controlSession) => ({
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
        }))
      ]
    }
  }
}

