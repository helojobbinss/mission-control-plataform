import {
  LayoutDashboard,
  Monitor,
  Rocket,
  Bell,
  Radar,
  Palette,
  Settings,
  Users,
  Wrench,
  UserCog,
  RadioTower,
  TriangleAlert,
  ShieldCheck,
  Command,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'missionControlPlatform@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'MCP',
      logo: Command,
      plan: 'Mission Control Platform',
    },
  ],
  navGroups: [
    {
      title: 'Geral',
      items: [
        {
          title: 'Painel Geral',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Missões',
          url: '/tasks',
          icon: Rocket,
        },
        {
          title: 'Monitoramento',
          url: '',
          icon: Radar,
        },
        {
          title: 'Alertas e Manutenção',
          url: '/users',
          badge: '3',
          icon: TriangleAlert,
        },
        {
          title: 'Comunicações',
          url: '',
          icon: RadioTower,
        },
        {
          title: 'Gestão e dados',
          url: '/userscopy',
          icon: Users,
        },

      ],
    },
    {
      title: 'Login',
      items: [
        {
          title: 'Autenticação',
          icon: ShieldCheck,
          items: [
            {
              title: 'Login',
              url: '/sign-in',
            },
            {
              title: 'Cadastro',
              url: '/sign-up',
            },
            {
              title: 'Esqueci a Senha',
              url: '/forgot-password',
            },
          ],
        },
      ],
    },
    {
      title: 'Outros',
      items: [
        {
          title: 'Configurações',
          icon: Settings,
          items: [
            {
              title: 'Perfil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Conta',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Aparência',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notificações',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Display',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
      ],
    },
  ],
}
