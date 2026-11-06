import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
type SearchResults = { data: { name: string; norad_id: number }[]; truncated: boolean }

export function AddSatellite({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState('')
  const [delayed, setDelayed] = useState('')
  const [chosen, setChosen] = useState<{ name: string; norad_id: number } | null>(null)
  const [norad, setNorad] = useState('')
  const client = useQueryClient()
  useEffect(() => { const timer = window.setTimeout(() => setDelayed(name.trim()), 600); return () => window.clearTimeout(timer) }, [name])
  const search = useQuery({
    queryKey: ['satellite-search', delayed],
    queryFn: async ({ signal }) => (await axios.get<SearchResults>('/api/satellites/search', { params: { name: delayed }, signal })).data,
    enabled: open && delayed.length >= 3 && delayed === name.trim() && !chosen,
    staleTime: 15 * 60 * 1000, retry: false,
  })
  const add = useMutation({
    mutationFn: async () => axios.post('/api/satellites/import', { norad_id: Number(norad) }),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: ['satellites'] }); toast.success('Satélite adicionado.'); setName(''); setNorad(''); setChosen(null); onOpenChange(false) },
    onError: () => toast.error('Não foi possível adicionar. Verifique o NORAD ou tente mais tarde.'),
  })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className='max-h-[85vh] overflow-y-auto'><DialogHeader><DialogTitle>Adicionar satélite</DialogTitle><DialogDescription>Pesquise no catálogo público CelesTrak e selecione o satélite desejado.</DialogDescription></DialogHeader>
    <div className='space-y-3'><label htmlFor='monitor-satellite-name' className='text-sm font-medium'>Pesquisar por nome</label><Input id='monitor-satellite-name' placeholder='Digite pelo menos 3 letras' maxLength={80} value={name} onChange={(event) => { setName(event.target.value); setChosen(null); setNorad('') }} />
      {name.trim().length >= 3 && !chosen && delayed === name.trim() && <div className='max-h-52 overflow-y-auto rounded-md border'>
        {search.isFetching && <p className='p-3 text-sm'>Pesquisando...</p>}
        {search.isError && <p className='p-3 text-sm text-destructive'>Não foi possível consultar o catálogo.</p>}
        {search.isSuccess && search.data.data.length === 0 && <p className='p-3 text-sm'>Nenhum satélite encontrado.</p>}
        {search.data?.data.map((item) => <button type='button' key={item.norad_id} className='block w-full px-3 py-2 text-left text-sm hover:bg-muted' onClick={() => { setChosen(item); setName(item.name); setNorad(String(item.norad_id)) }}>{item.name} <span className='text-muted-foreground'>· NORAD {item.norad_id}</span></button>)}
        {search.data?.truncated && <p className='p-3 text-xs text-muted-foreground'>Primeiros 30 resultados. Digite mais letras para refinar.</p>}
      </div>}
      <label htmlFor='monitor-satellite-norad' className='text-sm font-medium'>Número NORAD</label><Input id='monitor-satellite-norad' inputMode='numeric' value={norad} onChange={(event) => { setNorad(event.target.value); setChosen(null) }} placeholder='Ex.: 25544' />
      <Button type='button' disabled={!/^\d{1,9}$/.test(norad) || add.isPending} onClick={() => add.mutate()}>{add.isPending ? 'Buscando...' : 'Adicionar satélite'}</Button>
    </div></DialogContent></Dialog>
}

