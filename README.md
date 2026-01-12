# 🥚 SipSip - Tamagotchi de Tribos

Um Tamagotchi de Tribos com integração Solana. Cuide do seu pet, escolha uma tribo e domine a guerra semanal!

## 🎮 Funcionalidades

- **Pet Virtual**: Crie e cuide do seu pet com 4 barras de status (Fome, Humor, Energia, Reputação)
- **4 Tribos**: FOFO 🧸, CAOS 🔥, CHAD 🗿, CRINGE 🤡
- **Evolução**: Seu pet evolui de EGG → BABY → TEEN → ADULT → LEGENDARY
- **Guerra Semanal**: Tribos competem por pontos em diversas categorias
- **Temporadas Mensais**: Temas únicos e badges exclusivas
- **Social**: Visite pets de outros jogadores e deixe reações
- **Council**: Vote em decisões do jogo usando sua carteira Solana
- **Cards Virais**: Compartilhe momentos especiais do seu pet

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: Prisma
- **Blockchain**: Solana (wallet-adapter, SIWS)
- **Testes**: Vitest

## 📋 Pré-requisitos

- Node.js 18+
- npm ou pnpm
- (Opcional) Docker para PostgreSQL

## 🚀 Instalação

### 1. Clone e instale dependências

```bash
git clone <repo>
cd sipsip
npm install
```

### 2. Configure o ambiente

```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite .env com suas configurações
# Para desenvolvimento, os valores padrão funcionam
```

### 3. Configure o banco de dados

```bash
# Gerar cliente Prisma
npm run db:generate

# Criar tabelas (SQLite)
npm run db:push

# Popular com dados de teste
npm run seed:dev
```

### 4. Inicie o servidor

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🗄️ Usando PostgreSQL (Opcional)

### 1. Suba o container Docker

```bash
docker-compose up -d
```

### 2. Altere as configurações

**No arquivo `.env`:**
```env
DATABASE_URL="postgresql://sipsip:sipsip_dev_password@localhost:5432/sipsip?schema=public"
```

**No arquivo `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"  // Mude de "sqlite" para "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. Reaplique o banco

```bash
npm run db:push
npm run seed:dev
```

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa linter |
| `npm run format` | Formata código |
| `npm run test` | Executa testes |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:push` | Sincroniza schema com banco |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run seed:dev` | Popula banco com dados de teste |
| `npm run compute:week` | Recalcula scores da semana |
| `npm run rollover:week` | Finaliza semana e cria nova |

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Modo watch
npm run test:watch
```

Os testes cobrem:
- ✅ Verificação de assinatura Solana
- ✅ Decaimento on-read de stats do pet
- ✅ Cálculo de score semanal por tribo

## 📁 Estrutura do Projeto

```
sipsip/
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── seed.ts           # Script de seed
├── scripts/
│   ├── compute-week.ts   # Computar scores
│   └── rollover-week.ts  # Finalizar semana
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── app/          # Dashboard do pet
│   │   ├── council/      # Votação
│   │   ├── pet/[id]/     # Perfil do pet
│   │   ├── season/       # Temporada
│   │   ├── tribes/       # Tribos
│   │   └── week/         # Guerra semanal
│   ├── components/       # Componentes React
│   ├── lib/              # Utilitários e lógica
│   └── types/            # TypeScript types
├── tests/                # Testes
└── docker-compose.yml    # PostgreSQL
```

## 🎯 Rotas Principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing page |
| `/app` | Dashboard do seu pet |
| `/pet/[id]` | Perfil público de um pet |
| `/tribes` | Explorar tribos |
| `/week` | Guerra semanal |
| `/season` | Temporada atual |
| `/council` | Votação do Council |

## 🔐 Autenticação

O SipSip usa "Sign-in with Solana" (SIWS):

1. Usuário conecta carteira (Phantom, Solflare, etc.)
2. Backend gera nonce único
3. Usuário assina mensagem com a carteira
4. Backend valida assinatura
5. Sessão criada via cookie httpOnly

## 🏛️ Council

Sistema de governança cultural off-chain:

- Propostas sobre temas, formas de pets, eventos
- 1 carteira = 1 voto
- Voto registrado com assinatura da carteira como prova
- Sem custos de gas (off-chain)

## 📊 Sistema de Pontuação

As tribos ganham pontos em 4 categorias:

| Categoria | Peso | Como ganhar |
|-----------|------|-------------|
| 🎮 Atividade | 30% | Ações dos pets |
| 💬 Social | 25% | Visitas e reações |
| 🔥 Consistência | 25% | Streaks de cuidado |
| ⭐ Eventos | 20% | Evoluções |

## 🎨 Tribos

| Tribo | Emoji | Descrição |
|-------|-------|-----------|
| FOFO | 🧸 | Carinho e amor incondicional |
| CAOS | 🔥 | Destruição criativa |
| CHAD | 🗿 | Sigma grindset |
| CRINGE | 🤡 | Arte do constrangimento |

## ⚠️ Avisos

- Este é um projeto educacional/MVP
- Não há promessas financeiras
- Tokens são apenas para identidade e governança cultural
- Use na devnet da Solana para testes

## 📄 Licença

MIT

---

Feito com 💜 na Solana

