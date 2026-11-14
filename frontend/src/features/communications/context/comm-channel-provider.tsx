import { type ReactNode } from 'react'
import { useDemoCommChannel } from '../hooks/use-comm-channel'
import { CommChannelContext } from './comm-channel-context'

// O layout autenticado mantém esta sessão entre rotas e a descarta no logout.
export function CommChannelProvider({ children }: { children: ReactNode }) {
  const channel = useDemoCommChannel()
  return <CommChannelContext value={channel}>{children}</CommChannelContext>
}
