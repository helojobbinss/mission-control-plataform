import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { type Task } from '../data/schema'
import { TasksMutateDrawer } from './tasks-mutate-drawer'

vi.mock('@/lib/show-submitted-data', () => ({ showSubmittedData: vi.fn() }))

const MOCK_TASK = {
  id: 'task-1',
  title: 'Existing task',
  status: 'Agendada',
  label: 'feature',
  Operador: 'medium',
} as const satisfies Task

describe('TasksMutateDrawer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders create title and description', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /Create Task/i,
    })
    const desc = getByText(/Add a new task/i)

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
  })

  it('renders edit title, description, and prefilled title', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} currentRow={MOCK_TASK} />
    )

    const title = getByRole('heading', {
      level: 2,
      name: /Update Task/i,
    })
    const desc = getByText(/Update the task/i)

    const titleInput = getByRole('textbox', { name: /Title/i })
    const statusSelect = getByRole('combobox', { name: /Status/i })
    const labelRadio = getByRole('radio', { name: MOCK_TASK.label })
    const OperadorRadio = getByRole('radio', { name: MOCK_TASK.Operador })

    await expect.element(title).toBeInTheDocument()
    await expect.element(desc).toBeInTheDocument()
    await expect.element(titleInput).toHaveValue(MOCK_TASK.title)
    await expect
      .element(statusSelect)
      .toHaveTextContent(new RegExp(MOCK_TASK.status, 'i'))
    await expect.element(labelRadio).toBeChecked()
    await expect.element(OperadorRadio).toBeChecked()
  })

  it('shows validation messages when submitting an empty form', async () => {
    const { getByRole, getByText } = await render(
      <TasksMutateDrawer open onOpenChange={vi.fn()} />
    )

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    await expect.element(getByText(/Title is required.$/i)).toBeInTheDocument()
    await expect
      .element(getByText(/Please select a status.$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/Please select a label.$/i))
      .toBeInTheDocument()
    await expect
      .element(getByText(/Please choose a Operador.$/i))
      .toBeInTheDocument()
  })

  it('submits create form and shows submitted data', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'New task title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Ativa/i }))

    await userEvent.click(getByRole('radio', { name: /^Bug$/i }))
    await userEvent.click(getByRole('radio', { name: /^Low$/i }))

    const saveButton = getByRole('button', { name: /Save changes/i })
    await userEvent.click(saveButton)

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)

    expect(showSubmittedData).toHaveBeenCalledOnce()
    expect(showSubmittedData).toHaveBeenCalledWith({
      title: 'New task title',
      status: 'Ativa',
      label: 'bug',
      Operador: 'low',
    })
  })

  it('closes when Close is clicked', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <TasksMutateDrawer open onOpenChange={onOpenChange} />
    )

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    expect(closeButtons).toHaveLength(2)
    await userEvent.click(closeButtons[1])

    expect(onOpenChange).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('resets entered values when the sheet is closed and reopened', async () => {
    function Harness() {
      const [open, setOpen] = useState(true)
      return (
        <>
          <button type='button' onClick={() => setOpen(true)}>
            Reopen
          </button>
          <TasksMutateDrawer open={open} onOpenChange={setOpen} />
        </>
      )
    }

    const { getByRole } = await render(<Harness />)

    const titleInput = getByRole('textbox', { name: /Title/i })
    await userEvent.fill(titleInput, 'Draft title')
    await expect.element(titleInput).toHaveValue('Draft title')

    const statusSelect = getByRole('combobox', { name: /Status/i })
    await userEvent.click(statusSelect)
    await userEvent.click(getByRole('option', { name: /Ativa/i }))
    await expect.element(statusSelect).toHaveTextContent(/Ativa/i)

    const labelRadio = getByRole('radio', { name: /^Documentation$/i })
    await userEvent.click(labelRadio)
    await expect.element(labelRadio).toBeChecked()

    const OperadorRadio = getByRole('radio', { name: /^High$/i })
    await userEvent.click(OperadorRadio)
    await expect.element(OperadorRadio).toBeChecked()

    const closeButtons = getByRole('dialog')
      .getByRole('button', {
        name: /Close/i,
      })
      .all()
    await userEvent.click(closeButtons[0])

    const reopenButton = getByRole('button', { name: /Reopen/i })
    await userEvent.click(reopenButton)

    await expect.element(titleInput).toHaveValue('')
    await expect.element(statusSelect).not.toHaveTextContent(/Ativa/i)
    await expect.element(labelRadio).not.toBeChecked()
    await expect.element(OperadorRadio).not.toBeChecked()
  })
})
