#!/bin/bash

# ===============================================
# RF-004: Database Health Monitoring Script
# Monitorear salud y rendimiento de base de datos
# ===============================================

set -e

echo "🏥 RF-004: Database Health Monitoring"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

export $(cat .env | grep -v '#' | xargs)

# Function to run SQL query
run_query() {
    psql "$DATABASE_URL" -c "$1"
}

echo -e "${BLUE}📊 DATABASE STATISTICS${NC}"
echo "========================"

# Table sizes
echo ""
echo -e "${YELLOW}📦 Table Sizes:${NC}"
run_query "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Index usage
echo ""
echo -e "${YELLOW}🔍 Index Usage Statistics:${NC}"
run_query "SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC 
LIMIT 20;"

# Slow queries (simple detection)
echo ""
echo -e "${YELLOW}⚡ Slow Queries Detection:${NC}"
run_query "SELECT query, calls, mean_exec_time, max_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Table row counts
echo ""
echo -e "${YELLOW}📈 Row Counts:${NC}"
run_query "SELECT schemaname, tablename, n_live_tup as live_rows 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;"

# Connections
echo ""
echo -e "${YELLOW}🔗 Active Connections:${NC}"
run_query "SELECT datname, usename, state, count(*) 
FROM pg_stat_activity 
GROUP BY datname, usename, state;"

# Foreign key constraints
echo ""
echo -e "${YELLOW}🔐 Foreign Key Constraints:${NC}"
run_query "SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name 
FROM information_schema.key_column_usage 
WHERE table_schema = 'public' AND foreign_table_name IS NOT NULL;"

# Duplicate indexes
echo ""
echo -e "${YELLOW}⚠️  Potential Duplicate Indexes:${NC}"
run_query "SELECT pg_size_pretty(SUM(pg_relation_size(idx))::BIGINT) AS size, 
(array_agg(idx))[1] AS idx1, (array_agg(idx))[2] AS idx2 
FROM (SELECT indexrelname AS idx, (indrelid::text ||E'\n'|| indclass::text ||E'\n'|| indkey::text ||E'\n'|| coalesce(indexprs::text,'')||E'\n' || coalesce(indpred::text,'')) AS key 
FROM pg_index) sub 
GROUP BY key HAVING COUNT(*) > 1 
ORDER BY SUM(pg_relation_size(idx)) DESC;"

echo ""
echo -e "${GREEN}✅ Health check completed!${NC}"

# Recommendations
echo ""
echo -e "${BLUE}💡 RECOMMENDATIONS:${NC}"
echo "==================="
echo "1. Monitor slow queries and optimize them"
echo "2. Remove unused indexes"
echo "3. Analyze query plans with EXPLAIN ANALYZE"
echo "4. Consider partitioning large tables"
echo "5. Review connection limits and pooling settings"
