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
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
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
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
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
      title: 'Pages',
      items: [
        {
          title: 'Auth',
          icon: ShieldCheck,
          items: [
            {
              title: 'Sign In',
              url: '/sign-in',
            },
            {
              title: 'Sign In (2 Col)',
              url: '/sign-in-2',
            },
            {
              title: 'Sign Up',
              url: '/sign-up',
            },
            {
              title: 'Forgot Password',
              url: '/forgot-password',
            },
            {
              title: 'OTP',
              url: '/otp',
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
