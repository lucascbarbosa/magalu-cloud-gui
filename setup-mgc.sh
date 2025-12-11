#!/bin/bash
# setup-mgc.sh
# Propósito: Validar credenciais MGC e configurar o ambiente local para a GUI.
# Requisitos: jq instalado e CLI 'mgc' opcional mas recomendada.

set -e

# Função para verificar se uma string é UUID válido
is_valid_uuid() {
    local uuid="$1"
    if [[ "$uuid" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
        return 0
    fi
    return 1
}

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}>>> Iniciando configuração do ambiente MGC GUI...${NC}"

# 1. Validação da API Key
if [ -z "$MGC_API_KEY" ]; then
    echo -e "${RED}Erro: A variável de ambiente MGC_API_KEY não está definida.${NC}"
    echo "Por favor, exporte sua chave API obtida no portal Magalu Cloud."
    echo "Exemplo: export MGC_API_KEY='sua-chave-aqui'"
    exit 1
fi

# 2. Descoberta do Tenant ID
# Tenta usar a CLI oficial 'mgc' se instalada
TENANT_ID=""

if command -v mgc &> /dev/null; then
    echo "CLI 'mgc' detectada. Tentando obter Tenant ID..."
    
    # Tenta obter o ID do tenant atual com diferentes formatos
    set +e  # Desabilita exit on error temporariamente
    MGC_OUTPUT=$(mgc auth tenant current --api-key "$MGC_API_KEY" 2>&1)
    MGC_EXIT_CODE=$?
    set -e  # Reabilita exit on error
    
    if [ $MGC_EXIT_CODE -eq 0 ]; then
        # Verifica se o output contém JSON válido
        if echo "$MGC_OUTPUT" | jq . >/dev/null 2>&1; then
            # Tenta extrair de JSON
            TENANT_ID=$(echo "$MGC_OUTPUT" | jq -r '.id // .uuid // .tenant_id // empty' 2>/dev/null || echo "")
        else
            # Tenta extrair UUID do output (formato texto)
            TENANT_ID=$(echo "$MGC_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1 || echo "")
        fi
        
        # Valida se é UUID válido
        if [ -n "$TENANT_ID" ] && ! is_valid_uuid "$TENANT_ID"; then
            TENANT_ID=""
        fi
    fi
    
    # Se ainda não encontrou, tenta sem --api-key (pode estar configurado globalmente)
    if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" == "null" ]; then
        set +e
        MGC_OUTPUT=$(mgc auth tenant current 2>&1)
        MGC_EXIT_CODE=$?
        set -e
        
        if [ $MGC_EXIT_CODE -eq 0 ]; then
            if echo "$MGC_OUTPUT" | jq . >/dev/null 2>&1; then
                TENANT_ID=$(echo "$MGC_OUTPUT" | jq -r '.id // .uuid // .tenant_id // empty' 2>/dev/null || echo "")
            else
                TENANT_ID=$(echo "$MGC_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1 || echo "")
            fi
            
            # Valida se é UUID válido
            if [ -n "$TENANT_ID" ] && ! is_valid_uuid "$TENANT_ID"; then
                TENANT_ID=""
            fi
        fi
    fi
fi

# Fallback: Se a CLI falhar ou não existir, pede input manual
if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" == "null" ] || [ "$TENANT_ID" == "" ]; then
    echo -e "${YELLOW}Aviso: Não foi possível detectar o Tenant ID automaticamente.${NC}"
    echo "Por favor, insira seu Tenant ID (UUID) manualmente."
    echo "Dica: Você pode encontrá-lo no portal MGC ou executar 'mgc auth tenant current'"
    while [ -z "$TENANT_ID" ] || ! is_valid_uuid "$TENANT_ID"; do
        read -p "Tenant ID (UUID): " TENANT_ID
        if [ -z "$TENANT_ID" ]; then
            echo -e "${RED}Erro: Tenant ID não pode estar vazio.${NC}"
        elif ! is_valid_uuid "$TENANT_ID"; then
            echo -e "${RED}Erro: Tenant ID deve ser um UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).${NC}"
            TENANT_ID=""
        fi
    done
fi

if [ -z "$TENANT_ID" ] || ! is_valid_uuid "$TENANT_ID"; then
    echo -e "${RED}Erro: Tenant ID é obrigatório e deve ser um UUID válido.${NC}"
    exit 1
fi

# 3. Configuração de Região
# Padrão para br-se1 (Sudeste)
REGION=${MGC_REGION:-"br-se1"}

# 4. Geração do arquivo .env.local para Next.js
echo -e "${GREEN}>>> Gerando configuração segura em .env.local...${NC}"

cat <<EOF > .env.local
# Configuração Gerada Automaticamente para MGC GUI
# Data: $(date)

# Segredos de Servidor (NUNCA expor com NEXT_PUBLIC)
MGC_API_KEY="$MGC_API_KEY"
MGC_TENANT_ID="$TENANT_ID"

# Configurações Públicas
NEXT_PUBLIC_MGC_REGION="$REGION"
NEXT_PUBLIC_APP_NAME="MGC Dashboard 2025"
EOF

echo -e "${GREEN}✅ Configuração concluída! Arquivo .env.local criado.${NC}"
echo "Tenant ID configurado: $TENANT_ID"
echo "Região: $REGION"

