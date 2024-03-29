Messages

### Notifications

Missing

- a way for control channels to know about players which registered before the game started
- A notification to signal that a player just shot
- A notification to signal that a player was removed from the game
  - For example when it disconnected
- Add version to the reply from RegisterPlayer
- Maybe include the rotation in the successful `Response` `RotatePlayer` message
- Replace `details` with `data` in responses and notifications
  - `RegisterPlayer `  failure and success
  - `MovePlayer` failure and success
  - `StartGame` failure
  - `Shoot` failure
  - `RotatePlayer` failure

?

* The `id` of the notification for when a player has moved is " id: 'Movement'," but I was expecting `id: 'MovePlayer'`
* Clarify when occurs a hit
* Should I remove the `shotId` from the hit wall and hit player notifications and then send a shot destroyed notification?

```json
{
  type: 'Notification',
  id: 'Movement',
  component: {
    type: 'Shot',
    data: {
      id: <string>,
      position: {
      	x: <number>,
      	y: <number>
    	}
    }
  }
}
```

```json
{
  type: 'Notification',
  id: 'Hit',
  component: {
    type: 'Wall',
    data: {
      shotId: <string>
    }
  }
}
```

```json
// Notification sent to the control channel
{
  type: 'Notification',
  id: 'Hit',
  component: {
    type: 'Player',
    data: {
      id: <string>,
      damage: <number>,
      shotId: <string>
    }
  }
}
```

```json
// Notification sent to the hit player
{
  type: 'Notification',
  id: 'Hit',
  data: {
    damage: <number>
  }
}
```

```json
// Notification sent to each player
{
  type: 'Notification',
  id: 'RadarScan',
  data: {
    players: {
      id: <string>,
      rotation: <number>,
      position: { x: <number>, y: <number>}
  	}[],
    unknown: {
      position: { x: <number>, y: <number> }
    }[],
    shots: {
      rotation: <number>,
      position: { x: <number>, y: <number> }
    }[]
  }
}
```

```json
// Notification sent to the player
{
	type: 'Notification',
	id: 'Destroyed'
}
```

```json
// Notification sent to the control channel
{
  type: 'Notification',
  id: 'PlayerDestroyed',
  component: {
    type: 'Player',
    data: {
      id: <string>
    }
  }
}
```



### Commands

#### StartGameCommand

```json
{
  type: 'Command',
  id: 'StartGame'
}
```

```json
{
  type: 'Response',
  id: 'StartGame',
  success: true
}
```

```json
{
  type: 'Response',
  id: 'StartGame',
  success: false,
  details: {
    msg: <string>
  }
}
```



```json
// To each player
{
  type: 'Notification',
  id: 'StartGame'
}
```



### Requests

#### ShootRequest

```json
{
  type: 'Request',
  id: 'Shoot'
}
```

```json
{
  type: 'Response',
  id: 'Shoot',
  success: true,
  data: {
    component: {
      details: {
        tokens: <number>
      }
    },
    request: {
      cost: <number>
    }
  }
}
```

```json
{
  type: 'Response',
  id: 'Shoot',
  success: false,
  details: {
    msg: <string>
  }
}
```

#### MovePlayerRequest

```json
{
  type: 'Request',
  id: 'MovePlayer',
  data: {
    movement: {
      direction: <'forward'|'backward'>,
      withTurbo: <boolean>
    }
  }
}
```

```json
{
  type: 'Response',
  id: 'MovePlayer',
  success: true,
  data: {
    component: {
      details: {
        position: { x: <number>, y: <number> },
        tokens: <number>
      }
    },
    request: {
      cost: <number>
      withTurbo: <boolean>
    }
  }
}
```

```json
{
  type: 'Response',
  id: 'MovePlayer',
  success: false,
  details: {
    msg: <string>
  }
}
```

```json
{
  type: 'Notification',
  id: 'Movement',
  component: {
    type: 'Player',
    data: {
      id: <string>,
      position: {
     		x: <number>,
      	y: <number>
    	}
  }
}
```



####  RotatePlayerRequest

```json
{
  type: 'Request',
  id: 'RotatePlayer',
  data: {
    rotation: <number>
  }
}
```

```json
{
  type: 'Response',
  id: 'RotatePlayer',
  success: false,
  details: {
    msg: <tring>
  }
}
```

```json
{
  type: 'Response',
  id: 'RotatePlayer',
  success: true,
  data: {
    component: {
      details: {
      	rotation: <number>,
      	tokens: <number>
    	}
    },
    request: {
      cost: <number>
    }
  }
}
```

```json
// Message sent to control channel
{
  type: 'Notification',
  id: 'ComponentUpdate', // this has to be fixed
  component: {
    type: 'Player',
    data: {
      id: <string>,
      rotation
    }
  }
}
```



#### RegisterPlayerRequest

```json
{
  type: 'Request',
  id: 'RegisterPlayer',
  data: {
    id: <string>
  }
}
```

```json
{
  type: 'Response',
  id: 'RegisterPlayer',
  success: true,
  details: {
    position: {
      x: <number>,
      y: <number>
    },
    rotation: <number>
  }
}
```

```json
{
  type: 'Response',
  id: 'RegisterPlayer',
  success: false,
  details: {
  	msg: <string>
  }
}
```

```json
{
	type: 'Notification',
	id: 'RegisterPlayer',
  success: true,
  component: {
  	type: 'Player',
    data: {
      id: <string>,
      position: {
        x: <number>,
        y: <number>
      },
    	rotation: <number>
    }
  }
}
```

#### DeployMineRequest

```json
{
  type: 'Request',
  id: 'DeployMine'
}
```



```json
{
  type: 'Response',
  id: 'DeployMine',
  success: false,
  details: {
  	msg: <string>
  }
}
```

```json
{
  type: 'Response',
  id: 'DeployMine',
  success: true,
  data: {
    component: {
      details: {
        tokens: <number>
      }
    },
    request: {
      cost: <number>
    }
  }
}
```

```json
{
  type: 'Notification',
  id: 'DeployMine',
  component: {
    type: 'Mine',
    data: {
      playerId: <string>,
      id: <string>,
      position: { x: <number>, y: <number> }
    }
  }
}
```

