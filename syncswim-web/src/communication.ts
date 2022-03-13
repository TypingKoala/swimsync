import * as React from 'react';

import Pusher, { Channel } from 'pusher-js';

const pusher = new Pusher("b58c86cc70863ba9db82", {
  cluster: 'us3'
})

export const useChannel = (channelName: string) => {
  const [channel, setChannel] = React.useState<Channel>()

  React.useEffect(() => {
    setChannel(pusher.subscribe(channelName))
    
    return () => {
      pusher.unsubscribe(channelName)
    }
  })

  return channel
}