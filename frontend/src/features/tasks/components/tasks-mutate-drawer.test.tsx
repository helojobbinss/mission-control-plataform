import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { saveMission } from '../data/api'
import { type Task } from '../data/schema'
import { TasksMutateDrawer } from './tasks-mutate-drawer'

// CT-030: formulário isolado; persistência real verificada no CT-010.
vi.mock('../data/api', () => ({ saveMission: vi.fn().mockResolvedValue(undefined) }))
vi.mock('@/features/monitoring/data/api', () => ({
  listSatellites: vi.fn().mockResolvedValue([
    { id: 1, name: 'QA Manual', norad_id: null, source: 'manual', status: 'active', missions: [], orbit: null },
  ]),
}))
const MOCK_TASK = {
  id: '1', satellite_id: 1, title: 'Missão fictícia existente',
  status: 'Agendada', label: 'Monitoramento', Operador: 'Gabriel',
} satisfies Task

async function renderIsolated(element: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>)
}

describe('CT-030: formulário de missão', () => {
  beforeEach(() => vi.clearAllMocks())

  it('apresenta título e descrição de criação', async () => {
    const screen = await renderIsolated(<TasksMutateDrawer open onOpenChange={vi.fn()} />)
    await expect.element(screen.getByRole('heading', { name: 'Create missão' })).toBeInTheDocument()
    await expect.element(screen.getByText(/Crie um missão/)).toBeInTheDocument()
  })

  it('apresenta edição com os valores recebidos', async () => {
    const screen = await renderIsolated(<TasksMutateDrawer open onOpenChange={vi.fn()} currentRow={MOCK_TASK} />)
    await expect.element(screen.getByRole('heading', { name: 'Update missão' })).toBeInTheDocument()
    await expect.element(screen.getByLabelText('Título', { exact: true })).toHaveValue(MOCK_TASK.title)
    await expect.element(screen.getByLabelText('Satélite *', { exact: true })).toHaveValue('1')
    await expect.element(screen.getByRole('radio', { name: 'Monitoramento', exact: true })).toBeChecked()
    await expect.element(screen.getByRole('radio', { name: 'Gabriel', exact: true })).toBeChecked()
  })

  it('rejeita os campos obrigatórios vazios sem salvar', async () => {
    const screen = await renderIsolated(<TasksMutateDrawer open onOpenChange={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Salvar', exact: true }))
    for (const text of ['Título obrigatório.', 'Selecione um satélite.', 'Por favor selecione um status.', 'Por favor selecione um Categoria.', 'Por favor selecione um Operador.']) {
      await expect.element(screen.getByText(text, { exact: true })).toBeInTheDocument()
    }
    expect(saveMission).not.toHaveBeenCalled()
  })

  it('envia a missão válida e fecha após a confirmação do serviço', async () => {
    const onOpenChange = vi.fn()
    const screen = await renderIsolated(<TasksMutateDrawer open onOpenChange={onOpenChange} />)
    await userEvent.fill(screen.getByLabelText('Título', { exact: true }), 'Missão QA')
    await screen.getByLabelText('Satélite *', { exact: true }).selectOptions('1')
    await userEvent.click(screen.getByRole('combobox').filter({ hasText: 'Selecione um status' }))
    await userEvent.click(screen.getByRole('option', { name: 'Agendada', exact: true }))
    await userEvent.click(screen.getByRole('radio', { name: 'Monitoramento', exact: true }))
    await userEvent.click(screen.getByRole('radio', { name: 'Gabriel', exact: true }))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar', exact: true }))
    await vi.waitFor(() => expect(saveMission).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Missão QA', satellite_id: '1', status: 'Agendada', label: 'Monitoramento', Operador: 'Gabriel',
    }), undefined, undefined))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('fecha pelo botão Fechar', async () => {
    const onOpenChange = vi.fn()
    const screen = await renderIsolated(<TasksMutateDrawer open onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar', exact: true }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('limpa o título de rascunho ao fechar e reabrir', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return <><button onClick={() => setOpen(true)}>Reabrir</button><TasksMutateDrawer open={open} onOpenChange={setOpen} /></>
    }
    const screen = await renderIsolated(<Harness />)
    await userEvent.fill(screen.getByLabelText('Título', { exact: true }), 'Rascunho QA')
    await userEvent.click(screen.getByRole('button', { name: 'Fechar', exact: true }))
    await userEvent.click(screen.getByRole('button', { name: 'Reabrir', exact: true }))
    await expect.element(screen.getByLabelText('Título', { exact: true })).toHaveValue('')
  })
})
