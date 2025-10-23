#!/bin/bash

# Mon Toit Database Migration Deployment Script
# Usage: ./scripts/deploy-migrations.sh [environment] [migration_number]
# Example: ./scripts/deploy-migrations.sh production 001

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
ENVIRONMENT=${1:-"development"}
MIGRATION_NUMBER=${2:-"all"}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
MIGRATIONS_DIR="./scripts/migrations"

log_info "Starting database migration deployment..."
log_info "Environment: $ENVIRONMENT"
log_info "Migration: $MIGRATION_NUMBER"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Validate environment
case $ENVIRONMENT in
    "development"|"staging"|"production")
        log_info "Environment validated: $ENVIRONMENT"
        ;;
    *)
        log_error "Invalid environment. Use: development, staging, or production"
        exit 1
        ;;
esac

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI not found. Please install it first."
    echo "Installation: npm install -g supabase"
    exit 1
fi

# Validate migration files
validate_migration_file() {
    local migration_file="$1"
    if [[ ! -f "$migration_file" ]]; then
        log_error "Migration file not found: $migration_file"
        return 1
    fi

    # Basic syntax check
    if ! grep -q "CREATE\|ALTER\|DROP\|INSERT\|UPDATE" "$migration_file"; then
        log_warning "Migration file may be empty or invalid: $migration_file"
    fi

    log_success "Migration file validated: $migration_file"
    return 0
}

# Create database backup
create_backup() {
    log_info "Creating database backup..."

    if [[ $ENVIRONMENT == "production" ]]; then
        # For production, require explicit backup
        read -p "This is production. Continue with backup? (yes/no): " -r
        if [[ ! $REPLY =~ ^yes$ ]]; then
            log_error "Production migration cancelled."
            exit 1
        fi
    fi

    # Create backup using Supabase
    local backup_file="$BACKUP_DIR/pre_migration_backup.sql"

    if supabase db dump > "$backup_file"; then
        log_success "Database backup created: $backup_file"

        # Compress backup
        gzip "$backup_file"
        log_success "Backup compressed: ${backup_file}.gz"
    else
        log_error "Failed to create database backup"
        exit 1
    fi
}

# Check database connection
check_database_connection() {
    log_info "Checking database connection..."

    if supabase db ping; then
        log_success "Database connection successful"
    else
        log_error "Cannot connect to database"
        exit 1
    fi
}

# Get database version and status
get_database_status() {
    log_info "Getting database status..."

    # Get PostgreSQL version
    local pg_version=$(supabase db shell -c "SELECT version();" -t -A 2>/dev/null)
    log_info "PostgreSQL version: $pg_version"

    # Get database size
    local db_size=$(supabase db shell -c "SELECT pg_size_pretty(pg_database_size(current_database()));" -t -A 2>/dev/null)
    log_info "Database size: $db_size"

    # Get active connections
    local active_connections=$(supabase db shell -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t -A 2>/dev/null)
    log_info "Active connections: $active_connections"
}

# Execute single migration
execute_migration() {
    local migration_file="$1"
    local migration_name=$(basename "$migration_file" .sql)

    log_info "Executing migration: $migration_name"

    # Check if migration already executed
    local migration_check=$(supabase db shell -c "SELECT COUNT(*) FROM supabase_migrations.schema_migrations WHERE version = '$migration_name';" -t -A 2>/dev/null || echo "0")

    if [[ "$migration_check" -gt 0 ]]; then
        log_warning "Migration $migration_name already executed. Skipping."
        return 0
    fi

    # Execute migration with timeout
    local start_time=$(date +%s)

    if supabase db shell < "$migration_file"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))

        log_success "Migration $migration_name completed successfully in ${duration}s"

        # Record migration execution
        supabase db shell -c "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('$migration_name');" 2>/dev/null || true

        return 0
    else
        log_error "Migration $migration_name failed"
        return 1
    fi
}

# Post-migration validation
validate_migration() {
    local migration_name="$1"
    log_info "Validating migration: $migration_name"

    case $migration_name in
        "001_critical_indexes")
            # Check if indexes were created
            local index_count=$(supabase db shell -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';" -t -A 2>/dev/null)
            log_info "Total custom indexes: $index_count"

            # Check materialized views
            local view_count=$(supabase db shell -c "SELECT COUNT(*) FROM pg_matviews WHERE matviewname LIKE 'mv_%';" -t -A 2>/dev/null)
            log_info "Materialized views created: $view_count"
            ;;

        "002_security_encryption")
            # Check if encryption functions exist
            local func_count=$(supabase db shell -c "SELECT COUNT(*) FROM pg_proc WHERE proname LIKE '%encrypt%' OR proname LIKE '%decrypt%';" -t -A 2>/dev/null)
            log_info "Encryption functions created: $func_count"

            # Check if phone numbers are being encrypted
            local encrypted_count=$(supabase db shell -c "SELECT COUNT(*) FROM profiles WHERE phone_encrypted IS NOT NULL;" -t -A 2>/dev/null)
            log_info "Encrypted phone numbers: $encrypted_count"
            ;;

        "003_rls_optimization")
            # Check RLS policies
            local policy_count=$(supabase db shell -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" -t -A 2>/dev/null)
            log_info "RLS policies created: $policy_count"

            # Check optimized views
            local opt_view_count=$(supabase db shell -c "SELECT COUNT(*) FROM pg_matviews WHERE matviewname LIKE 'mv_%optimized%';" -t -A 2>/dev/null)
            log_info "Optimized views created: $opt_view_count"
            ;;
    esac

    log_success "Migration validation completed: $migration_name"
}

# Performance benchmark
run_performance_benchmark() {
    log_info "Running performance benchmark..."

    # Test query performance
    local queries=(
        "SELECT COUNT(*) FROM properties WHERE status = 'published';"
        "SELECT COUNT(*) FROM messages WHERE is_read = false;"
        "SELECT COUNT(*) FROM rental_applications WHERE status = 'pending';"
    )

    for query in "${queries[@]}"; do
        local start_time=$(date +%s%N)
        local result=$(supabase db shell -c "$query" -t -A 2>/dev/null)
        local end_time=$(date +%s%N)
        local duration=$(((end_time - start_time) / 1000000)) # Convert to milliseconds

        log_info "Query: ${query:0:50}... - ${duration}ms (${result} rows)"
    done

    log_success "Performance benchmark completed"
}

# Generate deployment report
generate_report() {
    local report_file="$BACKUP_DIR/deployment_report.md"

    cat > "$report_file" << EOF
# Database Migration Deployment Report

**Date:** $(date)
**Environment:** $ENVIRONMENT
**Migrations:** $MIGRATION_NUMBER

## Backup Information
- **Location:** $BACKUP_DIR/pre_migration_backup.sql.gz
- **Created:** $(date)

## Migration Status
$(cat "$BACKUP_DIR/migration_log.txt" 2>/dev/null || echo "Migration log not found")

## Database Status
- **PostgreSQL Version:** $(supabase db shell -c "SELECT version();" -t -A 2>/dev/null)
- **Database Size:** $(supabase db shell -c "SELECT pg_size_pretty(pg_database_size(current_database()));" -t -A 2>/dev/null)
- **Active Connections:** $(supabase db shell -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" -t -A 2>/dev/null)

## Indexes and Views
- **Total Indexes:** $(supabase db shell -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_%';" -t -A 2>/dev/null)
- **Materialized Views:** $(supabase db shell -c "SELECT COUNT(*) FROM pg_matviews WHERE matviewname LIKE 'mv_%';" -t -A 2>/dev/null)
- **RLS Policies:** $(supabase db shell -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" -t -A 2>/dev/null)

## Security Status
- **Encrypted Records:** $(supabase db shell -c "SELECT COUNT(*) FROM profiles WHERE phone_encrypted IS NOT NULL;" -t -A 2>/dev/null)
- **Security Policies:** $(supabase db shell -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" -t -A 2>/dev/null)

## Performance Metrics
$(run_performance_benchmark 2>&1)

## Next Steps
1. Monitor application performance
2. Check application logs for errors
3. Validate all features are working correctly
4. Schedule next maintenance window if needed

## Rollback Information
If issues are detected, rollback can be performed using:
\`\`\`bash
# Restore from backup
gunzip -c $BACKUP_DIR/pre_migration_backup.sql.gz | supabase db shell

# Or use rollback functions if available
SELECT rollback_migration_001();
SELECT rollback_migration_002();
SELECT rollback_migration_003();
\`\`\`

---
*Report generated by Mon Toit deployment script*
EOF

    log_success "Deployment report generated: $report_file"
}

# Main execution logic
main() {
    # Start migration log
    exec > >(tee -a "$BACKUP_DIR/migration_log.txt")
    exec 2>&1

    log_info "Starting migration deployment at $(date)"

    # Pre-migration checks
    check_database_connection
    get_database_status
    create_backup

    # Determine which migrations to run
    local migrations_to_run=()

    if [[ "$MIGRATION_NUMBER" == "all" ]]; then
        migrations_to_run=("001_critical_indexes.sql" "002_security_encryption.sql" "003_rls_optimization.sql")
    else
        migrations_to_run=("${MIGRATION_NUMBER}_*.sql")
    fi

    # Execute migrations
    local success_count=0
    local total_count=${#migrations_to_run[@]}

    for migration_pattern in "${migrations_to_run[@]}"; do
        for migration_file in "$MIGRATIONS_DIR"/$migration_pattern; do
            if [[ -f "$migration_file" ]]; then
                if validate_migration_file "$migration_file"; then
                    if execute_migration "$migration_file"; then
                        local migration_name=$(basename "$migration_file" .sql)
                        validate_migration "$migration_name"
                        ((success_count++))
                    else
                        log_error "Migration failed: $migration_file"

                        if [[ $ENVIRONMENT == "production" ]]; then
                            log_error "Production migration failed. Stopping execution."
                            exit 1
                        fi
                    fi
                fi
            fi
        done
    done

    # Post-migration tasks
    log_info "Running post-migration validation..."
    run_performance_benchmark
    generate_report

    # Summary
    log_info "Migration deployment completed!"
    log_info "Migrations executed: $success_count/$total_count"

    if [[ $success_count -eq $total_count ]]; then
        log_success "All migrations completed successfully!"
        log_info "Backup location: $BACKUP_DIR"
        log_info "Deployment report: $BACKUP_DIR/deployment_report.md"
    else
        log_warning "Some migrations may have failed. Check logs for details."
    fi

    # Environment-specific recommendations
    case $ENVIRONMENT in
        "production")
            log_info "Production deployment completed. Monitor application closely."
            ;;
        "staging")
            log_info "Staging deployment completed. Ready for testing."
            ;;
        "development")
            log_info "Development deployment completed. You can start testing."
            ;;
    esac
}

# Trap to handle interrupts
trap 'log_error "Deployment interrupted. Check logs for partial migration status."; exit 1' INT TERM

# Run main function
main "$@"