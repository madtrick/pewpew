export interface Player {
  id: string
}

export interface GameState {
  players: Player[]
}

export interface IncommingMessage {
  data: { id: string }
  sys: {
    type: 'Request'
    id: 'RegisterPlayer'
  }
}

function createPlayer (data: { id: string }): Player {
  return { id: data.id }
}

enum GameStateUpdateResult {
  Success,
  Failure
}

interface GameStateUpdate {
  result: GameStateUpdateResult
  reason?: string
  state: GameState
}

function registerPlayer (state: GameState, message: IncommingMessage): GameStateUpdate {
  const playerExists = state.players.find((player) => player.id === message.data.id)

  if (playerExists) {
    return { result: GameStateUpdateResult.Failure, reason: `Player already registered with id ${message.data.id}`, state }
  }

  const player = createPlayer(message.data)

  state.players.push(player)

  return {
    result: GameStateUpdateResult.Success,
    state
  }
}

/*
 * Notes:
 *
 * - Messages are validated in another layer, before being passed to the loop
 */
export default function gameLoop (state: GameState, messages: IncommingMessage[]): Promise<GameState> {
  return new Promise((resolve) => {
    messages.forEach((message) => {
      if (message.sys.type === 'Request') {
        if (message.sys.id === 'RegisterPlayer') {
          const gameStateUpdate = registerPlayer(state, message)

          resolve(gameStateUpdate.state)
        }
      }
    })
  })
}
