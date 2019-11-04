Messages

### Notifications

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
    type: 'Wall'
  }
}
```

```json
{
  type: 'Notification',
  id: 'Hit',
  component: {
    type: 'Player',
    data: {
      id: <string>,
      damage: <number>
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
    players: { position: { x: <number>, y: <number> } }[],
    unknown: { position: { x: <number>, y: <number> } }[],
    shots: { position: { x: <number>, y: <number> } }[]
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
      // TODO remove this hardcoded value
      position: {
        x: <number>,
        y: <number>
      }
    }
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
  sys: {
    type: 'Command',
    id: 'StartGame'
  }
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



Request

#### ShootRequest

```json
{
  sys: {
    type: 'Request',
    id: 'Shoot'
  }
}
```

```json
{
  type: 'Response',
  id: 'Shoot',
  success: true
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
  sys: {
    type: 'Request',
    id: 'MovePlayer',
  },
  data: {
    movement: {
      direction: <'forward'|'backward'>
    }
  }
}
```

```json
{
  type: 'Response',
  id: 'MovePlayer',
  success: true,
  details: {
    position: {
      x: <number>,
      y: <number>
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
    msg: <tring>
  }
}
```

#### RotatePlayerRequest

```json
{
  sys: {
    type: 'Request',
    id: 'RotatePlayer'
  },
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
  success: true
}
```



#### RegisterPlayerRequest

```json
{
  sys: {
    type: 'Request',
    id: 'RegisterPlayer'
  },
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
    }
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



