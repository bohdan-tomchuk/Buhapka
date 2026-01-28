.PHONY: help dev prod build stop clean logs backup restore test

# Default target
help:
	@echo "Buhapka - Expense Tracker"
	@echo ""
	@echo "Available targets:"
	@echo "  make dev         - Start development environment"
	@echo "  make prod        - Start production environment"
	@echo "  make build       - Build production Docker images"
	@echo "  make stop        - Stop all containers"
	@echo "  make clean       - Stop and remove containers, volumes"
	@echo "  make logs        - Show logs from all services"
	@echo "  make backup      - Run backup script"
	@echo "  make restore     - Run restore script (interactive)"
	@echo "  make test        - Run tests"

# Development environment
dev:
	docker-compose up

# Production environment
prod:
	docker-compose -f docker-compose.prod.yml up -d

# Build production images
build:
	docker-compose -f docker-compose.prod.yml build

# Stop containers
stop:
	docker-compose down
	docker-compose -f docker-compose.prod.yml down

# Clean up everything
clean:
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	@echo "Cleaned up containers and volumes"

# Show logs
logs:
	docker-compose logs -f

# Backup database and uploads
backup:
	@if [ -f ./scripts/backup.sh ]; then \
		./scripts/backup.sh; \
	else \
		echo "Error: backup.sh not found in ./scripts/"; \
		exit 1; \
	fi

# Restore database and uploads
restore:
	@if [ -f ./scripts/restore.sh ]; then \
		./scripts/restore.sh --list; \
	else \
		echo "Error: restore.sh not found in ./scripts/"; \
		exit 1; \
	fi

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && pnpm test
	@echo "Running frontend tests..."
	cd frontend && pnpm test
