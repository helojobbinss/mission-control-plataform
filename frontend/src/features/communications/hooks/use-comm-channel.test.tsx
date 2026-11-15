import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { CommChannelProvider } from '../context/comm-channel-provider'
import { useCommChannel } from './use-comm-channel'

async function advance(milliseconds: number) {
  // vitest-browser-react limita a flag de act ao seu próprio render/unmount.
  const flag = 'IS_REACT_ACT_ENVIRONMENT'
  const previous = Reflect.get(globalThis, flag)
  Reflect.set(globalThis, flag, true)
  try {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds)
    })
  } finally {
    Reflect.set(globalThis, flag, previous)
  }
}

function ChannelProbe() {
  const channel = useCommChannel()
  const command = (satelliteId: string) =>
    channel.sendCommand({
      satelliteId,
      code: 'PING',
      params: 'test',
      operator: 'Test operator',
      priority: 'NORMAL',
    })
  const ownCommands = channel.messages.filter(
    (message) =>
      message.direction === 'UP' && message.operator === 'Test operator'
  )
  return (
    <>
      <button onClick={() => command('SAT-001')}>Online</button>
      <button onClick={() => command('SAT-005')}>Offline</button>
      <button onClick={() => command('SAT-004')}>Weak signal</button>
      <button
        onClick={() =>
          channel.addNote('SAT-001', 'Local test note', 'Test operator')
        }
      >
        Note
      </button>
      <button
        onClick={() =>
          channel.retry(channel.messages[channel.messages.length - 1])
        }
      >
        Retry
      </button>
      <button onClick={() => channel.setBeaconsEnabled(false)}>
        Pause beacons
      </button>
      <output aria-label='Messages'>{JSON.stringify(channel.messages)}</output>
      <output aria-label='Command status'>
        {ownCommands[ownCommands.length - 1]?.status ?? ''}
      </output>
    </>
  )
}

describe('Local communications simulator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('simulates PENDENTE, ENVIADO and ACK with a local reply', async () => {
    const screen = await render(
      <CommChannelProvider>
        <ChannelProbe />
      </CommChannelProvider>
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Online', exact: true })
    )
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^PENDENTE$/)
    await advance(900)
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^ENVIADO$/)
    await advance(2500)
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^ACK$/)
    await expect
      .element(screen.getByRole('status', { name: 'Messages' }))
      .toHaveTextContent('PING → PONG')
    await screen.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('queues offline commands without pretending to send them', async () => {
    const screen = await render(
      <CommChannelProvider>
        <ChannelProbe />
      </CommChannelProvider>
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Offline', exact: true })
    )
    await advance(5000)
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^ENFILEIRADO$/)
    await screen.unmount()
  })

  it('supports a failed command, retry and an operator note', async () => {
    const screen = await render(
      <CommChannelProvider>
        <ChannelProbe />
      </CommChannelProvider>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Weak signal' }))
    await advance(3000)
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^FALHA$/)
    await userEvent.click(
      screen.getByRole('button', { name: 'Retry', exact: true })
    )
    await expect
      .element(screen.getByRole('status', { name: 'Command status' }))
      .toHaveTextContent(/^PENDENTE$/)
    await userEvent.click(
      screen.getByRole('button', { name: 'Note', exact: true })
    )
    await expect
      .element(screen.getByRole('status', { name: 'Messages' }))
      .toHaveTextContent('Local test note')
    await screen.unmount()
  })

  it('can pause automatic beacons and releases the interval', async () => {
    const screen = await render(
      <CommChannelProvider>
        <ChannelProbe />
      </CommChannelProvider>
    )
    expect(vi.getTimerCount()).toBe(1)
    await userEvent.click(screen.getByRole('button', { name: 'Pause beacons' }))
    expect(vi.getTimerCount()).toBe(0)
    await screen.unmount()
  })
})
