# Nhonga-Flutterwave Automation System

Sistema de automação que monitora confirmações SMS da API Nhonga e automaticamente executa transferências de dinheiro via API Flutterwave para números de telefone do Ruanda.

## 🚀 Funcionalidades

- **Monitoramento SMS**: Recebe webhooks da API Nhonga com confirmações SMS
- **Extração de Telefone**: Extrai automaticamente números de telefone ruandeses do conteúdo SMS
- **Transferência Automática**: Executa transferências via Flutterwave API em Francos Ruandeses (RWF)
- **Sistema de Filas**: Usa BullMQ + Redis para processamento assíncrono
- **Retry Logic**: Lógica de retry automática para transferências falhadas
- **Logs Estruturados**: Sistema completo de logging para auditoria
- **Validação**: Validação rigorosa de números de telefone e dados

## 📦 Instalação

1. **Instalar dependências**:
   ```bash
   npm install express nhonga-api node-fetch bullmq ioredis dotenv
   ```

2. **Configurar ambiente**:
   ```bash
   cp .env.example .env
   # Editar .env com suas credenciais reais
   ```

3. **Instalar e iniciar Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis-server
   
   # macOS
   brew install redis
   brew services start redis
   
   # Windows
   # Baixar Redis do site oficial ou usar Docker
   ```

## ⚙️ Configuração

### Arquivo .env

```env
PORT=3000

# Credenciais Nhonga API
NHONGA_API_KEY=sua_chave_api_nhonga
NHONGA_SECRET_KEY=sua_chave_secreta_nhonga

# Credenciais Flutterwave
FLW_SECRET_KEY=sua_chave_secreta_flutterwave
FLW_BASE_URL=https://api.flutterwave.com

# Configuração Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Configuração de transferência
DEFAULT_TRANSFER_AMOUNT=1000
TRANSFER_CURRENCY=RWF
```

## 🚀 Uso

### Iniciar o servidor

```bash
# Produção
npm start

# Desenvolvimento (com auto-restart)
npm run dev
```

### Testar o sistema

```bash
npm test
```

## 📡 Endpoints da API

### Webhook Nhonga
```
POST /webhook/nhonga
```
Recebe confirmações SMS da Nhonga e dispara transferências automáticas.

### Trigger Manual
```
POST /trigger/manual
```
Dispara transferência manual para testes.

**Exemplo de payload**:
```json
{
  "phoneNumber": "+250788123456",
  "amount": 1000,
  "transactionId": "MANUAL-TEST-001"
}
```

### Health Check
```
GET /health
```
Verifica status do sistema e conectividade das APIs.

### Estatísticas da Fila
```
GET /queue/stats
```
Mostra estatísticas da fila de processamento.

## 🔄 Fluxo de Automação

1. **Recebimento SMS**: Nhonga envia webhook com confirmação SMS
2. **Extração de Dados**: Sistema extrai número de telefone e valor
3. **Validação**: Valida formato do número ruandês
4. **Conversão de Moeda**: Converte MZN para RWF
5. **Enfileiramento**: Adiciona job na fila BullMQ
6. **Processamento**: Worker processa transferência via Flutterwave
7. **Retry**: Em caso de falha, retry automático com backoff

## 📱 Formatos de Telefone Suportados

O sistema aceita e processa vários formatos de números ruandeses:

- `+250788123456` (formato internacional)
- `250788123456` (sem +)
- `0788123456` (formato local)
- `788123456` (sem código do país)

Todos são normalizados para o formato internacional: `+250788123456`

## 🛡️ Segurança

- **Verificação de Assinatura**: Webhooks são verificados com chave secreta
- **Validação de Entrada**: Todos os inputs são validados
- **Mascaramento de Dados**: Números de telefone são mascarados nos logs
- **Rate Limiting**: Proteção contra abuso de API

## 🔧 Monitoramento

### Logs
O sistema gera logs estruturados para:
- Recebimento de webhooks
- Processamento de jobs
- Transferências executadas
- Erros e falhas

### Métricas
- Número de transferências processadas
- Taxa de sucesso
- Jobs na fila
- Tempo de processamento

## 🧪 Testes

### Teste Manual
```bash
curl -X POST http://localhost:3000/trigger/manual \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+250788123456",
    "amount": 1000,
    "transactionId": "TEST-001"
  }'
```

### Verificar Health
```bash
curl http://localhost:3000/health
```

### Estatísticas da Fila
```bash
curl http://localhost:3000/queue/stats
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Redis não conecta**:
   - Verificar se Redis está rodando: `redis-cli ping`
   - Verificar configurações de host/porta no .env

2. **Webhook não recebe dados**:
   - Verificar configuração do webhook na Nhonga
   - Verificar se servidor está acessível externamente

3. **Transferências Flutterwave falham**:
   - Verificar credenciais da API
   - Verificar saldo da conta
   - Verificar formato do número de telefone

### Debug

Para debug detalhado, adicione logs extras nos serviços:

```javascript
console.log('Debug info:', { variable: value });
```

## 📋 Estrutura do Projeto

```
backend/
├── server.js              # Servidor principal Express
├── package.json           # Dependências e scripts
├── .env                   # Variáveis de ambiente
├── jobs/
│   └── payoutJob.js       # Worker BullMQ para transferências
├── services/
│   ├── nhongaService.js   # Integração Nhonga API
│   ├── flutterwaveService.js # Integração Flutterwave API
│   └── currencyService.js # Conversão de moedas
└── README.md              # Esta documentação
```

## 🔄 Próximos Passos

1. **Configurar Webhook**: Configure o webhook da Nhonga para apontar para seu servidor
2. **Testar Integração**: Use o endpoint de teste manual para verificar funcionamento
3. **Monitorar Logs**: Acompanhe os logs para verificar processamento
4. **Configurar Produção**: Configure SSL e domínio para produção

Este sistema está pronto para produção com tratamento robusto de erros, sistema de filas, e monitoramento completo.