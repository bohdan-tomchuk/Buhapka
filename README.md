# Buhapka

Receipt management application with NestJS backend and Nuxt 4 frontend.

## Architecture

- **Backend**: NestJS (Node.js 20) running on port 3001
- **Frontend**: Nuxt 4 (Vue.js) running on port 3000
- **Database**: PostgreSQL 16 running on port 5432

## Prerequisites

- Docker and Docker Compose
- (Optional) pnpm for local development

## Getting Started

### 1. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` and update the values as needed, especially the JWT secrets for production.

### 2. Start the Application

Build and start all services:

```bash
docker compose up
```

Or run in detached mode:

```bash
docker compose up -d
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### 4. Stop the Application

```bash
docker compose down
```

To remove volumes as well:

```bash
docker compose down -v
```

## Development

The Docker setup includes hot-reload for both frontend and backend:

- Backend changes will automatically restart the NestJS server
- Frontend changes will trigger Nuxt's hot module replacement

## Testing the Setup

After starting the services, verify each component:

1. **PostgreSQL**:
   ```bash
   docker exec buhapka-postgres psql -U postgres -c '\l'
   ```

2. **Backend**:
   ```bash
   curl http://localhost:3001
   ```

3. **Frontend**:
   ```bash
   curl http://localhost:3000
   ```

4. **Volumes**:
   ```bash
   docker volume ls | grep buhapka
   ```

## Project Structure

```
.
├── backend/              # NestJS backend application
│   ├── src/
│   ├── Dockerfile
│   └── .dockerignore
├── frontend/             # Nuxt 4 frontend application
│   ├── pages/
│   ├── Dockerfile
│   └── .dockerignore
├── docker-compose.yml    # Docker Compose configuration
├── .env.example          # Environment variables template
└── README.md
```

## Volumes

- `buhapka-postgres-data`: PostgreSQL database persistence
- `buhapka-uploads`: Backend file uploads (receipts)

## Network

All services run on the `buhapka-network` bridge network for inter-service communication.
