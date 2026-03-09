# AnyForge-AI System Architecture

AnyForge is divided into two major components: a Python/FastAPI microservice backend dedicated to processing highly accurate schema extractions via models like Groq, and a beautiful React/Vite dashboard allowing administrators to easily generate and trace API keys.

## 1. Backend: FastAPI Clean Architecture

The backend implements strict, state-of-the-art Clean Architecture principles, ensuring modularity, scalability, and ease of automated testing.

```mermaid
graph TD
    A[main.py (Application Entrypoint)] --> B[core/config.py]
    A --> C[api/routes]
    C --> D[api/dependencies.py]
    D --> E[services/db_service.py (Supabase DB Layer)]
    C --> F[services/llm_service.py (Groq Engine)]
    F --> G[schemas/extraction.py (Pydantic Models)]
    C --> H[services/privacy_service.py (Presidio PII)]
```

### Separation of Concerns:
- **`core/config.py`**: A single source of truth for loading, validating, and casting environment variables. Uses Pydantic BaseSettings to ensure the system crashes securely on startup if essential variables are missing.
- **`api/routes/`**: Contains only standard HTTP logic (`generator`, `webhooks`, `async`, `admin`). Returns structured HTTP responses. They contain strictly no business logic.
- **`api/dependencies.py`**: Reusable logic wired into FastAPI routes via `Depends()`. Handles API Token validation, Database fetching, and strict Rate Limiting seamlessly without cluttering router endpoints. 
- **`schemas/extraction.py`**: Contains `BaseModel` classes defining Data Transfer Objects (DTOs), specifically request and response shapes, independent of implementation details.
- **`services/`**: Thick integration layers:
  - `llm_service.py`: Leverages Instructor to natively guarantee and enforce JSON mappings using Groq logic.
  - `privacy_service.py`: Microsoft Presidio wrapper to sanitize inputs anonymously.
  - `db_service.py`: Tracks API key validation, client limits, and creates comprehensive billing logic. Uses Supabase's Service Role Keys for backend persistence.

## 2. Frontend: Admin Dashboard

The frontend is a lightweight, fully decoupled graphical interface designed with premium glassmorphic aesthetics to view client telemetry and deploy API keys.

**Stack**:
- React 18 + Vite (TypeScript)
- Tailwind Vanilla CSS
- Framer Motion (Declarative animations & Presence)
- Recharts (Rich line & bar graphs for usage statistics)
- Supabase SDK (Raw Row Level Security mapping against user authentication)

### Auth & Database (Supabase)
The database structure relies gracefully on `public.clients` where the dashboard interface reads raw keys seamlessly based on Postgres Trigger functions. When a new user logs in via Supabase Authentication, a trigger natively fires `gen_random_uuid()` to safely spin up default billing limitations behind the scenes seamlessly securely.
