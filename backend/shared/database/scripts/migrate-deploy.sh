#!/bin/bash

# ===============================================
# RF-004: Migrate Deploy Script
# Aplicar migraciones de Prisma a Supabase
# ===============================================

set -e

echo "🔄 RF-004: Database Migration Deploy Script"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env with DATABASE_URL and DIRECT_URL"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '#' | xargs)

# Verify environment variables
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL or DIRECT_URL not set${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Checking migration status...${NC}"
npx prisma migrate status

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏭️  Deployment cancelled${NC}"
    exit 0
fi

echo -e "${YELLOW}🚀 Deploying migrations...${NC}"
npx prisma migrate deploy

echo -e "${GREEN}✅ Migration deployment completed successfully!${NC}"

# Run seed if requested
read -p "Run seed script? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌱 Running seed...${NC}"
    npx ts-node prisma/seed.ts
    echo -e "${GREEN}✅ Seed completed!${NC}"
fi

# Generate types
echo -e "${YELLOW}📦 Generating Prisma types...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Types generated!${NC}"

echo ""
echo -e "${GREEN}🎉 All done! Database is ready.${NC}"
