# MedProd — Controle de Produção Médica

PWA para registro diário de produção médica com controle de pagamentos.

## Stack
- React 18 + Vite 5
- Supabase (Auth + PostgreSQL)
- Tesseract.js (OCR local, sem custo)
- jsPDF + jspdf-autotable (exportação PDF)
- SheetJS/xlsx (exportação Excel)
- vite-plugin-pwa (PWA instalável)

---

## Setup passo a passo

### 1. Criar projeto no Supabase
1. Acesse https://supabase.com e crie uma conta (plano Free)
2. Clique em "New project" — escolha nome e senha
3. Vá em **Settings → API** e copie:
   - Project URL
   - anon public key

### 2. Criar as tabelas
1. No Supabase, vá em **SQL Editor → New Query**
2. Cole e execute o SQL que está em `src/lib/supabase.js` (nas linhas comentadas)

### 3. Configurar o projeto
```bash
# Clone / copie os arquivos para sua máquina
cd medprod

# Instale as dependências
npm install

# Copie o .env.example e preencha com suas credenciais
cp .env.example .env
# Edite .env com seu editor favorito
```

### 4. Rodar em desenvolvimento
```bash
npm run dev
```
Abra http://localhost:5173 no Chrome do celular (mesma rede Wi-Fi) para testar.

### 5. Build para produção (PWA)
```bash
npm run build
npm run preview
```

### 6. Deploy gratuito (Vercel)
1. Suba o código para um repositório GitHub
2. Acesse https://vercel.com → Import project
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy! O Vercel gera um link HTTPS — só em HTTPS o PWA funciona no celular.

### 7. Instalar como app no celular
**Android (Chrome):** Menu → "Adicionar à tela inicial"  
**iOS (Safari):** Botão compartilhar → "Adicionar à tela de início"

---

## Funcionalidades

- **Login/cadastro** com email e senha
- **Dashboard** com resumo mensal (atendimentos, recebido, a receber)
- **Registro diário** com:
  - 13 tipos de produção (consulta, interconsulta, hemodiálise, biópsia, etc.)
  - OCR de foto do prontuário (extrai nome e data de nascimento)
  - Geolocalização opcional
  - Convênio: SUS, Particular, Unimed, Outros
  - 6 locais pré-definidos + campo livre
  - Valor (opcional)
  - Toggle pago/pendente
- **Checklist de pagamentos** com filtros e navegação por mês
- **Relatórios** com export PDF e Excel por mês

---

## Supabase — plano gratuito (suficiente para uso pessoal e comercial inicial)
- 500 MB de banco de dados
- 1 GB de storage
- 50.000 usuários autenticados
- 2 GB de transferência/mês
- Projetos ficam em pause após 1 semana sem atividade (basta acessar para reativar)
  → Para evitar: habilite "Pause prevention" nas configurações do projeto

## Para comercializar depois
- Supabase Pro: US$25/mês (projetos sempre ativos, sem pause)
- Adicione planos no app: Free (N registros/mês) vs Pro (ilimitado)
- Integre Stripe para cobrança

---

## Estrutura de arquivos
```
src/
  lib/
    supabase.js     — client Supabase + SQL comentado
    constants.js    — tipos de produção, convênios, locais
  hooks/
    useAuth.js      — hook de autenticação
    useToast.js     — notificações toast
  pages/
    LoginPage.jsx   — login e cadastro
    DashboardPage.jsx  — tela inicial com registros do mês
    RegistroPage.jsx   — cadastro/edição de registro (com OCR)
    ChecklistPage.jsx  — checklist de pagamentos
    RelatoriosPage.jsx — relatórios + export PDF/Excel
  App.jsx           — roteamento e shell
  index.css         — design system dark
  main.jsx          — entry point
```
