import { GameState } from '../../game-state'
import { Session } from '../../session'
import { HandlerResult, RequestType } from '../../message-handlers'
import { IncommingMessage } from '../../messages'
import setValue from 'set-value'

export interface ComponentUpdateMessage extends IncommingMessage<'Request'> {
  data: {
    component: {
      type: string
      set: {
        [key: string]: string | number
      }
    }
  }
}

export interface ComponentUpdateResultDetails {
  type: string
  set: {
    [key: string]: string | number
  }
  errors?: { path: string, value: string | number, msg: string }[]
}

const UPDATABLE_PLAYER_PROP_PATHS = ['status']

// TODO maybe consider use the ComponentUpdate request to also change the player rotation. ComponentUpdate
// should be used to modify settings that affect successive requests while requests are executed and they
// don't affect following requests.
export default function update (session: Session, message: ComponentUpdateMessage, state: GameState): HandlerResult {
  // TODO refactor the checks for !gameStarted !playerFound
  if (!state.started) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.ComponentUpdate,
        reason: 'The game has not started'
      },
      state
    }
  }

  const { playerId } = session

  if (!playerId) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.ComponentUpdate,
        reason: 'There is no player registered for this session'
      },
      state
    }
  }

  const player = state.arena.findPlayer(playerId)

  if (!player) {
    return {
      result: {
        session,
        success: false,
        request: RequestType.ComponentUpdate,
        reason: 'The player could not be found'
      },
      state
    }
  }

  const { type: componentType, set: updates } = message.data.component

  let errors: { path: string, value: string | number, msg: string }[] = []
  if (componentType === 'Player') {
    const pathsValues = Object.entries(updates)
    for (const [path, value] of pathsValues) {
      if (UPDATABLE_PLAYER_PROP_PATHS.includes(path)) {
        debugger
        setValue(player, path, value)
      } else {
        errors.push({
          path,
          value,
          msg: `Path "${path}" does not exist on type "${componentType}"`
        })
      }
    }
  }

  const resultDetails: ComponentUpdateResultDetails = {
    type: componentType,
    set: updates
  }

  if (errors.length > 0) {
    resultDetails.errors = errors
  }

  return {
    result: {
      success: true,
      request: RequestType.ComponentUpdate,
      details: resultDetails
    },
    state
  }

  // return {
  //   result: {
  //     success: true,
  //     request: RequestType.DeployMine,
  //     details: {
  //       playerId: player.id,
  //       id: mine.id,
  //       position: mine.position,
  //       remainingMines: player.mines
  //     }
  //   },
  //   state
  // }
}
