import { createContext } from 'react'
import { type useDemoCommChannel } from '../hooks/use-comm-channel'

export const CommChannelContext = createContext<ReturnType<
  typeof useDemoCommChannel
> | null>(null)
