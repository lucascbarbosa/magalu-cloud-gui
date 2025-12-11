# Magalu Cloud GUI

Interface gráfica moderna para gerenciamento da Magalu Cloud (MGC), construída com Next.js 15 e React 18.

## 🚀 Funcionalidades

- **Kubernetes**: Gerenciamento completo de clusters (criar, listar, deletar, baixar kubeconfig)
- **Container Registry**: Visualização de repositórios Docker e tags
- **Autenticação**: Gerenciamento de credenciais e configuração de acesso
- **Dashboard**: Visão geral da infraestrutura com estatísticas em tempo real

## 📋 Pré-requisitos

- Node.js 20 ou superior
- npm ou yarn
- API Key da Magalu Cloud
- Tenant ID da Magalu Cloud
- (Opcional) CLI `mgc` para descoberta automática do Tenant ID

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <repository-url>
cd magalu-cloud-gui
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as credenciais

Execute o script de setup:

```bash
export MGC_API_KEY='sua-api-key-aqui'
bash setup-mgc.sh
```

O script irá:
- Validar a API Key
- Tentar obter o Tenant ID automaticamente via CLI `mgc` (se disponível)
- Solicitar o Tenant ID manualmente se necessário
- Gerar o arquivo `.env.local` com as configurações

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

## 🐳 Docker

### Build da imagem

```bash
docker build -t magalu-cloud-gui .
```

### Executar container

```bash
docker run -p 3000:3000 \
  -e MGC_API_KEY='sua-api-key' \
  -e MGC_TENANT_ID='seu-tenant-id' \
  -e NEXT_PUBLIC_MGC_REGION='br-se1' \
  magalu-cloud-gui
```

## 📁 Estrutura do Projeto

```
magalu-cloud-gui/
├── app/                    # App Router do Next.js
│   ├── kubernetes/         # Módulo Kubernetes
│   ├── registry/          # Módulo Container Registry
│   ├── auth/               # Módulo de Autenticação
│   └── api/                # API Routes
├── components/             # Componentes React
│   ├── ui/                 # Componentes UI base (shadcn/ui)
│   ├── mgc/                # Componentes específicos MGC
│   └── shell.tsx           # Layout principal
├── lib/                     # Utilitários e clientes
│   ├── mgc-client.ts       # Cliente HTTP para API MGC
│   ├── types.ts            # Definições TypeScript
│   └── utils.ts            # Funções utilitárias
├── scripts/                # Scripts de automação
├── setup-mgc.sh            # Script de configuração inicial
└── middleware.ts           # Middleware de proteção de rotas
```

## 🔐 Segurança

- **API Keys nunca são expostas ao cliente**: Todo o código que acessa a API MGC é executado no servidor (Server Components e Server Actions)
- **Variáveis de ambiente**: Credenciais sensíveis são armazenadas em `.env.local` (nunca commitadas)
- **Middleware de proteção**: Rotas protegidas verificam a presença de credenciais antes de permitir acesso

## 🌍 Regiões Suportadas

- `br-se1` - Sudeste (padrão)
- `br-ne1` - Nordeste

A região pode ser alterada através do seletor na sidebar ou via variável de ambiente `NEXT_PUBLIC_MGC_REGION`.

## 🚢 Deploy na Magalu Cloud

A ironia final: você pode rodar esta GUI dentro de um cluster Kubernetes da própria MGC!

Veja o exemplo de deployment em `k8s/deployment.yaml` (criar se necessário).

## 📝 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `MGC_API_KEY` | API Key da Magalu Cloud | Sim |
| `MGC_TENANT_ID` | UUID do Tenant | Sim |
| `NEXT_PUBLIC_MGC_REGION` | Região ativa (br-se1, br-ne1) | Não (padrão: br-se1) |

## 🛠️ Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linter
- `npm run setup` - Executa script de configuração

## 📚 Tecnologias

- **Next.js 15** - Framework React com App Router
- **React 18** - Biblioteca UI com Server Components
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **shadcn/ui** - Componentes UI acessíveis
- **Radix UI** - Primitivos UI acessíveis

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença especificada no arquivo `LICENSE`.

## ⚠️ Aviso

**Credenciais de nuvem (API Keys) possuem poder administrativo total**. Garanta que o ambiente de execução (seja local ou cluster K8s) esteja devidamente protegido e auditado.

As URLs da API MGC estão sujeitas a alterações pelo provedor; recomenda-se consultar a documentação oficial para atualizações nos endpoints.

