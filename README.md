# 🚀 Mission Control Platform

<div align="center">

### Plataforma Web para Monitoramento Inteligente de Satélites em Tempo Real

Sistema desenvolvido para centralizar, monitorar e gerenciar informações provenientes de satélites artificiais utilizando dados orbitais reais, dashboards interativos e monitoramento em tempo real.

![Laravel](https://img.shields.io/badge/Laravel-12-red?logo=laravel)
![React](https://img.shields.io/badge/React-TypeScript-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-Database-blue?logo=mysql)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-black?logo=socketdotio)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)

</div>

---

# 📖 Sobre o Projeto

O **Mission Control Platform** é uma plataforma web desenvolvida para centralizar, monitorar e gerenciar informações provenientes de satélites artificiais em órbita terrestre.

Inspirado em centros de controle de missões espaciais, como NASA e ESA, o sistema reúne em um único ambiente informações operacionais, telemetria, localização orbital, eventos críticos e indicadores de desempenho dos satélites.

Diferentemente de um sistema apenas demonstrativo, o projeto utiliza **APIs públicas de monitoramento espacial**, permitindo acompanhar satélites reais em órbita terrestre e visualizar suas posições e parâmetros em tempo real.

Além disso, a plataforma possui um módulo de simulação responsável por gerar informações operacionais complementares, permitindo representar um ambiente completo de Centro de Controle de Missões.

---

# 🎯 Objetivo

Desenvolver uma plataforma web capaz de monitorar satélites em tempo real, centralizar informações operacionais e auxiliar operadores e engenheiros espaciais na tomada de decisões durante missões.

---

# ❗ Problema

As informações referentes ao monitoramento de satélites normalmente encontram-se distribuídas entre diferentes sistemas e fontes de dados.

Essa descentralização dificulta:

- acompanhamento em tempo real;
- resposta rápida a incidentes;
- análise histórica;
- gerenciamento das missões;
- visualização integrada das operações.

O Mission Control Platform busca solucionar esse problema por meio de uma plataforma única, moderna e intuitiva.

---

# ✨ Principais Funcionalidades

## 🌍 Monitoramento Orbital

- Visualização de satélites em tempo real
- Localização orbital
- Latitude
- Longitude
- Altitude
- Velocidade orbital
- Tipo de órbita
- Atualização em tempo real

---

## 📡 Telemetria

- Temperatura
- Consumo energético
- Estado operacional
- Integridade dos sistemas
- Sensores embarcados
- Histórico de telemetria

Parte desses dados será obtida através de APIs públicas e parte será gerada pelo simulador interno da plataforma.

---

## 🚨 Sistema de Alertas

- Eventos críticos
- Alterações de órbita
- Falhas operacionais
- Perda de comunicação
- Alertas personalizados

---

## 📊 Dashboard

- KPIs
- Indicadores operacionais
- Missões ativas
- Satélites monitorados
- Eventos recentes
- Gráficos estatísticos
- Mapa orbital interativo

---

## 📁 Gerenciamento

Cadastro completo de:

- Satélites
- Missões
- Operadores
- Sensores
- Estações terrestres

---

## 📄 Relatórios

- Missões
- Eventos
- Histórico operacional
- Telemetria
- Satélites

---

# 🛰 Arquitetura do Sistema

```
                     APIs Espaciais
               (NASA • CelesTrak • N2YO)
                        │
                        │
                        ▼
                 Backend Laravel API
                        │
        ┌───────────────┼───────────────┐
        │                               │
   Banco MySQL                  Socket.IO Server
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
              Frontend React + TypeScript
                        │
                        ▼
                  Dashboard Web
```

---

# 🔌 Integração com APIs

O sistema utilizará APIs públicas para obtenção de informações reais sobre satélites artificiais.

Entre os dados obtidos estão:

- Nome do satélite
- Número NORAD
- Posição orbital
- Latitude
- Longitude
- Altitude
- Velocidade orbital
- Inclinação
- Tipo de órbita
- Última atualização

As APIs inicialmente previstas são:

- NASA Open APIs
- CelesTrak
- N2YO API

Novas integrações poderão ser adicionadas futuramente.

---

# ⚙ Tecnologias

## Front-end

- React
- TypeScript
- Tailwind CSS
- Recharts
- Leaflet
- Axios

---

## Back-end

- Laravel 12
- PHP 8.4
- REST API
- Socket.IO

---

## Banco de Dados

- MySQL

---

## Versionamento

- Git
- GitHub

---

# 📂 Estrutura do Projeto

```
mission-control-platform/

backend/
│
├── app/
├── database/
├── routes/
├── config/
└── ...

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── layouts/
│   └── assets/
│
└── ...

docs/

README.md
LICENSE
```

---

# 👥 Stakeholders

| Stakeholder | Responsabilidade |
|-------------|-----------------|
| Agência Espacial Internacional | Cliente |
| Administrador | Administração do sistema |
| Operador de Missão | Monitoramento das missões |
| Engenheiro Espacial | Análise da telemetria |
| Equipe de Desenvolvimento | Evolução da plataforma |

---

# 👨‍💻 Equipe

| Integrante | Responsabilidade |
|------------|-----------------|
| **William Galvão** | Scrum Master |
| **Maria Dalapria** | Scrum Master Assistente • Documentação |
| **Heloisa Jobbins Scheffer** | Backend |
| **Rafael Krachinski Seixas** | Backend • QA |
| **Iryane Karolyne Ienke** | Frontend |
| **Thauany Favarin Mainardes** | Frontend • QA |

---

# 🚀 Instalação

## Clonar o repositório

```bash
git clone https://github.com/seu-usuario/mission-control-platform.git
```

## Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📌 Roadmap

## MVP

- [ ] Sistema de autenticação
- [ ] Cadastro de satélites
- [ ] Cadastro de missões
- [ ] Cadastro de operadores
- [ ] Dashboard principal
- [ ] Integração com APIs
- [ ] Visualização orbital
- [ ] Histórico
- [ ] Sistema de alertas

## Futuras versões

- [ ] Múltiplas estações terrestres
- [ ] Simulador avançado de telemetria
- [ ] Replay de missões
- [ ] Controle de permissões
- [ ] Exportação de relatórios
- [ ] Tema escuro/claro
- [ ] PWA
- [ ] Internacionalização

---

# 🚫 Fora do Escopo

- Aplicativo Mobile
- Inteligência Artificial para previsão de falhas
- Comunicação direta com hardware espacial
- Controle de satélites reais

> **Observação:** embora o sistema utilize dados reais de satélites através de APIs públicas, ele não envia comandos nem realiza qualquer tipo de controle sobre esses equipamentos.

---

# 📚 Referências

- NASA Open APIs — https://api.nasa.gov
- CelesTrak — https://celestrak.org
- N2YO API — https://www.n2yo.com/api/

Norma utilizada:

**ABNT NBR 6023:2018**

---

# 📄 Licença

Projeto desenvolvido para fins acadêmicos na disciplina de Engenharia de Software.

---

<div align="center">

## 🌎 Mission Control Platform

*"Centralizando informações espaciais para apoiar decisões críticas em tempo real."*

</div>