import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { saveMission } from '../data/api'
import { useReopenConfirmation } from './reopen-confirmation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SelectDropdown } from '@/components/select-dropdown'
import { type Task } from '../data/schema'

type TaskMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Task
}

const formSchema = z.object({
  title: z.string().min(1, 'Título obrigatório.'),
  satellite_id: z.string().min(1, 'Selecione um satélite.'),
  status: z.string().min(1, 'Por favor selecione um status.'),
  label: z.string().min(1, 'Por favor selecione um Categoria.'),
  Operador: z.string().min(1, 'Por favor selecione um Operador.'),
  description: z.string().optional(),
  budget: z.string().optional().refine((value) => !value || /^\d{1,10}([,.]\d{1,2})?$/.test(value.trim()), 'Informe um valor positivo com até duas casas decimais.'),
  planned_start_date: z.string().optional(),
  planned_end_date: z.string().optional(),
}).refine((data) => !data.planned_start_date || !data.planned_end_date || data.planned_end_date >= data.planned_start_date, { path: ['planned_end_date'], message: 'O término deve ser igual ou posterior ao início.' })
type TaskForm = z.infer<typeof formSchema>

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
}: TaskMutateDrawerProps) {
  const isUpdate = !!currentRow
  const queryClient = useQueryClient()
  const [norad, setNorad] = useState('')
  const [searchName, setSearchName] = useState('')
  const [debouncedName, setDebouncedName] = useState('')
  const [chosenName, setChosenName] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedName(searchName.trim()), 600)
    return () => window.clearTimeout(timer)
  }, [searchName])
  const search = useQuery({
    queryKey: ['satellite-search', debouncedName],
    queryFn: async ({ signal }) => (await axios.get<{data: {name: string; norad_id: number}[]; truncated: boolean}>('/api/satellites/search', { params: { name: debouncedName }, signal })).data,
    enabled: open && debouncedName.length >= 3 && debouncedName === searchName.trim() && !chosenName,
    staleTime: 15 * 60 * 1000,
    retry: false,
  })
  const { data: satellites = [] } = useQuery({ queryKey: ['satellites'], queryFn: async () => (await axios.get<{id: number; name: string; norad_id: number}[]>('/api/satellites')).data })
  const importSatellite = useMutation({
    mutationFn: async () => (await axios.post<{id: number}>('/api/satellites/import', { norad_id: Number(norad) })).data,
    onSuccess: async (satellite) => { await queryClient.invalidateQueries({ queryKey: ['satellites'] }); form.setValue('satellite_id', String(satellite.id), { shouldValidate: true }); setNorad(''); setChosenName(''); setSearchName(''); toast.success('Satélite encontrado no CelesTrak.') },
    onError: () => toast.error('Satélite não encontrado ou CelesTrak indisponível. Verifique o NORAD e tente novamente.'),
  })
  const { requestConfirmation, dialog } = useReopenConfirmation()

  const form = useForm<TaskForm>({
    resolver: zodResolver(formSchema),
    defaultValues: currentRow ? { ...currentRow, satellite_id: currentRow.satellite_id ? String(currentRow.satellite_id) : '' } : {
      title: '',
      satellite_id: '',
      status: '',
      label: '',
      Operador: '',
      description: '',
      budget: '',
      planned_start_date: '',
      planned_end_date: '',
    },
  })

  const onSubmit = async (data: TaskForm) => {
    let confirmation: string | undefined
    if (currentRow && ['Concluída', 'Abortada'].includes(currentRow.status) && currentRow.status !== data.status) {
      confirmation = await requestConfirmation()
      if (!confirmation) return
    }
    try {
      await saveMission(data, currentRow?.id, confirmation)
      await queryClient.invalidateQueries({ queryKey: ['missions'] })
      toast.success(isUpdate ? 'Missão atualizada.' : 'Missão criada.')
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error('Não foi possível salvar a missão. Verifique o backend.')
    }
  }

  return (
    <>
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        form.reset()
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} missão</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Atualize a missão com as informações necessarias '
              : 'Crie um missão '}
            e clique em salvar.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            id='tasks-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-6 overflow-y-auto px-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='satellite_id'
              render={({ field }) => <FormItem><FormLabel>Satélite *</FormLabel><FormControl><select className='border-input bg-background w-full rounded-md border px-3 py-2' value={field.value} onChange={field.onChange}><option value=''>Selecione um satélite</option>{satellites.map((satellite) => <option key={satellite.id} value={satellite.id}>{satellite.name} (NORAD {satellite.norad_id})</option>)}</select></FormControl><FormMessage /></FormItem>}
            />
            <div className='space-y-2'>
              <label htmlFor='satellite-name-search' className='text-sm font-medium'>Pesquisar satélite por nome</label>
              <Input id='satellite-name-search' value={searchName} maxLength={80} placeholder='Digite pelo menos 3 letras' autoComplete='off' onChange={(event) => { setSearchName(event.target.value); setChosenName(''); setNorad('') }} />
              {searchName.trim().length >= 3 && !chosenName && debouncedName === searchName.trim() && <div className='max-h-40 overflow-y-auto rounded-md border'>
                {search.isFetching && <p className='p-2 text-sm'>Pesquisando no CelesTrak...</p>}
                {search.isError && <p className='p-2 text-sm text-destructive'>Não foi possível pesquisar agora. Tente novamente.</p>}
                {search.isSuccess && search.data.data.length === 0 && <p className='p-2 text-sm'>Nenhum satélite encontrado.</p>}
                {search.data?.data.map((satellite) => <button key={satellite.norad_id} type='button' className='block w-full px-3 py-2 text-left text-sm hover:bg-muted' onClick={() => { setChosenName(satellite.name); setSearchName(satellite.name); setNorad(String(satellite.norad_id)) }}>{satellite.name} <span className='text-muted-foreground'>· NORAD {satellite.norad_id}</span></button>)}
                {search.data?.truncated && <p className='p-2 text-xs text-muted-foreground'>Exibindo os primeiros 30 resultados. Digite mais letras para refinar.</p>}
              </div>}
              {chosenName && <p className='text-sm text-muted-foreground'>Selecionado: {chosenName}. Clique em Buscar para adicioná-lo.</p>}
            </div>
            <div className='space-y-2'><label htmlFor='norad-search' className='text-sm font-medium'>Buscar no CelesTrak por número NORAD</label><div className='flex gap-2'><Input id='norad-search' inputMode='numeric' value={norad} onChange={(event) => setNorad(event.target.value)} placeholder='Ex.: 25544' /><Button type='button' variant='outline' disabled={!/^\d{1,9}$/.test(norad) || importSatellite.isPending} onClick={() => importSatellite.mutate()}>Buscar</Button></div></div>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='budget'
              render={({ field }) => <FormItem><FormLabel>Orçamento (R$)</FormLabel><FormControl><Input type='text' inputMode='decimal' placeholder='Ex.: 15000,00' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>}
            />
            <FormField
              control={form.control}
              name='planned_start_date'
              render={({ field }) => <FormItem><FormLabel>Início planejado</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>}
            />
            <FormField
              control={form.control}
              name='planned_end_date'
              render={({ field }) => <FormItem><FormLabel>Término planejado</FormLabel><FormControl><Input type='date' {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder='Selecione um status'
                    items={[
                      { label: 'Agendada', value: 'Agendada' },
                      { label: 'Ativa', value: 'Ativa' },
                      { label: 'Abortada', value: 'Abortada' },
                      { label: 'Concluída', value: 'Concluída' },
                    ]}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='label'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='AnaliseOrbital' />
                        </FormControl>
                        <FormLabel className='font-normal '>
                          Análise Orbital
                        </FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Comunicacao' />
                        </FormControl>
                        <FormLabel className='font-normal'>Comunicação</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Monitoramento' />
                        </FormControl>
                        <FormLabel className='font-normal'>Monitoramento</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='Operador'
              render={({ field }) => (
                <FormItem className='relative'>
                  <FormLabel>Operador</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className='flex flex-col space-y-1'
                    >
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Gabriel' />
                        </FormControl>
                        <FormLabel className='font-normal'>Gabriel</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Sophia' />
                        </FormControl>
                        <FormLabel className='font-normal'>Sophia</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Isabella' />
                        </FormControl>
                        <FormLabel className='font-normal'>Isabella</FormLabel>
                      </FormItem>
                      <FormItem className='flex items-center'>
                        <FormControl>
                          <RadioGroupItem value='Arthur' />
                        </FormControl>
                        <FormLabel className='font-normal'>Arthur</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Fechar</Button>
          </SheetClose>
          <Button form='tasks-form' type='submit' disabled={form.formState.isSubmitting}>
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
    {dialog}
    </>
  )
}
