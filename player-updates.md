```json
{
  type: 'Notification',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Player',
    }
    updates: [
    	{ updateType: 'PropertyUpdate', property: 'boosts', old: 2, new: 3 },
  		{ updateType: 'PropertyUpdate', property: 'boostEnabled', old: true, new: false }
    ]
}
{
  type: 'Notification',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Radar',
    }
    updates: [
    	{ updateType: 'PropertyUpdate', property: 'mode', old: 'long', new: 'short' },
    ]
}

{
  type: 'Request',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Radar',
    }
    updates: [
    	{ updateType: 'PropertyUpdate', property: 'mode', value: 'long' }
    ]
}

{
  type: 'Request',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Player',
    }
    updates: [
    	{ updateType: 'PropertyUpdate', property: 'boostEnabled', value: true }
    ]
}

{
  type: 'Request',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Player',
      set: {
        boostEnabled: true
      }
    }
    updates: [
    	{ updateType: 'PropertyUpdate', property: 'boostEnabled', value: true }
    ]
}

{
  type: 'Response',
  id: 'ComponentUpdate',
  success: true,
  data: {
    component: {
      type: 'Player',
      set: {
        boostEnabled: true,
        boosts: 2
      }
    }
}
  
{
  type: 'Response',
  id: 'ComponentUpdate',
  success: true,
  data: {
    component: {
      type: 'Player',
      set: {
        status: 'A fuejo'
			},
			errors: [
        { property: 'foo', msg: 'Property does not exist' },
        { property: 'boostEnabled', msg: 'Not boosts left' }
      ]
    }
}

{
  type: 'Notification',
  id: 'ComponentUpdate',
  data: {
    component: {
      type: 'Player',
      set: {
        boostEnabled: false,
        boosts: 3
      }
    }
}
```

