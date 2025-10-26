# BookRank

BookRank is "Beli for books", a full-stack web app for book discovery and personal library management. It uses a comparative ranking system to help users intuitively rank their books and provided AI-powered recommendations using Pinecone. The architecture consists of a Django, React frontend SPA, deployed on Digital Ocean via Docker with Nginx/Gunicorn, and integrates with AWS OpenSearch for full-text book search. The data comes from UCSD's [Goodreads Book Graph Datasets](https://cseweb.ucsd.edu/~jmcauley/datasets/goodreads.html).

BookRank was previously accessible at [bookrank.ai](https://bookrank.ai), but has since been shut down. I stopped working on it because acquiring up-to-date book data would have been prohibitively expensive, and I wanted to pursue other projects.

<div align="center">
    <img src="homepage.png" alt="homepage" width="60%">
    <br/>
</div>

# Architecture

## 1. Frontend Layer (React SPA)

React-based single-page application built with Vite and TypeScript. The client uses Axios for API calls with React Query for data fetching, caching, and state management.

```
react-app/src/
├── pages/                   # Route components (mounted by React Router)
│   ├── Homepage.tsx              # Landing page
│   ├── Login.tsx                 # Authentication form
│   ├── Dashboard.tsx             # User dashboard with stats, charts, recommendations
│   ├── MyBooks.tsx               # Personal library view (filtered by status)
│   ├── ...
│
├── components/              # Reusable React components
│   ├── ui/                       # shadcn/ui base components (button, card, dialog, etc.)
│   ├── Header.tsx                # Navigation header
│   ├── BookRow.tsx               # Single book list item
│   ├── CompareModal.tsx          # Pairwise comparison interface
│   ├── ...
│   └── [Stats components]        # NumBooks, NumRecs, TopRecommendation, etc.
│
├── hooks/                   # Custom React hooks
│   └── useBookComparison.ts      # Book comparison logic
│
├── types/                   # TypeScript type definitions
│   └── types.ts                  # ApiResponse, Book, UserBook, UserAccount interfaces
│
├── axiosConfig.ts           # HTTP client configuration
│
├── App.tsx                  # Root component (routing, QueryClientProvider)
└── index.tsx                # Entry point (React DOM mount)
```


## 2. Backend Layer (Django)

Django-based REST API server that handles business logic, authentication, and database operations. The backend follows a **layered architecture** where views handle HTTP endpoints, models define data structures and business logic via managers, and services integrate with external APIs.

- **Views:** REST endpoints that validate requests, call model managers for business logic, and return responses
- **Models:** Data entities with custom managers that encapsulate business logic and database operations (RLS-like filtering via user context)
- **Services:** Classes for external API integration (OpenSearch for keyword search, Pinecone for vector similarity)
- **Tasks:** Celery async tasks for long-running operations (CSV import)

```
djangoapp/
├── djangoapp/               # Main Django application
│   ├── settings.py               # Django settings (database, Celery, CORS, sessions)
│   ├── urls.py                   # URL routing configuration
│   ├── wsgi.py                   # WSGI application entry point
│   ├── celery.py                 # Celery task queue setup (Redis broker)
│   │
│   ├── models.py                 # Data models with custom managers
│   │   ├── UserAccount               # Custom user model (rankings counts)
│   │   ├── Book                      # Book catalog (work_id, title, author, etc.)
│   │   ├── UserBook                  # User's personal library with Glicko ratings
│   │   ├── ...
│   │
│   ├── views.py                  # REST API endpoints (~565 lines)
│   │   ├── LoginView                 # POST /api/login/
│   │   ├── UserBooksViewSet          # CRUD for /api/userbooks/
│   │   ├── SearchView                # GET /api/search/ (OpenSearch integration)
│   │   ├── CompareBookView           # POST/PATCH /api/compare-book/
│   │   ├── RecommendationView        # CRUD /api/recommendations/ (Pinecone)
│   │   ├── ...
│   │   └── GoodreadsImportView       # POST /api/goodreads-import/ (triggers Celery)
│   │
│   ├── serializers.py            # DRF serializers for request/response validation
│   │
│   ├── services.py               # External service integrations
│   │   ├── OpenSearchService         # AWS OpenSearch client (full-text search)
│   │   └── PineconeService           # Pinecone vector database client
│   │
│   ├── tasks.py                  # Celery async tasks
│   │
│   ├── middleware.py             # Custom middleware
│
├── api/                     # API tests
│
└── manage.py                # Django management CLI
```


## 3. Data Layer (PostgreSQL)

PostgreSQL database with Django ORM for persistence. Core entities:

- **UserAccount** - User profiles with ranking counts (fiction/nonfiction/childrens/total)
- **Book** - Book catalog from Goodreads (work_id, title, author, description, image_url, ratings, etc.)
- **UserBook** - User's personal library
  - Status: read, currently_reading, to_be_read
  - Bucket: high, medium, low (for ranked books, mirroring Beli)
  - Glicko rating fields: elo_rating, RD (rating deviation), is_ranked
  - Timestamps: date_added, date_finished
- **UserRecommendation** - AI recommendations per user (reference_book, viewed, score, outcome)


## 4. Task Queue (Celery + Redis)

Celery workers handle asynchronous background tasks using Redis as both broker and result backend. Used for users importing data from Goodreads, which requires using OpenSearch because our dataset isn't complete.

**Tasks:**
- **`process_csv(file_path, user_id)`** - Goodreads CSV import
  - Reads uploaded CSV file
  - Searches for each book via OpenSearch
  - Creates UserBook entries if confidence score > 20%
  - Cleans up file after completion

**Execution:**
- Started in container via `entrypoint.sh`
- Command: `celery -A djangoapp worker --loglevel=info -P solo --without-gossip --concurrency 1`


## 5. AWS OpenSearch

AWS-hosted OpenSearch domain used for full-text book search with fuzzy matching. Used when trying to find a book that you've read or want to read. Allows for fuzziness and uses a balanced ranking between search query relevance and book popularity (based on number of goodreads ratings).

**Integration Files:**
- `djangoapp/djangoapp/services.py` - OpenSearchService class
- `djangoapp/djangoapp/views.py` - SearchView uses OpenSearchService.search()
- `djangoapp/djangoapp/tasks.py` - process_csv uses search for import matching


## 6. Pinecone Vector Database

Pinecone vector database provides book embeddings for similarity-based recommendations via cosine similarity; when a user rates a book in the "high" bucket, books with similar descriptions will be added to their recommendations feed.

**Integration Files:**
- `djangoapp/djangoapp/services.py` - PineconeService class
- `djangoapp/djangoapp/models.py` - UserRecommendationManager.add_recommendations_from_seed()
- `djangoapp/djangoapp/views.py` - RecommendationView (POST for adding, DELETE for dismissing)

**Operations:**
- **fetch_vector(work_id)** - Retrieve vector embedding for a single book
- **query_similar(vector, k=10)** - Find k most similar books by cosine similarity
- **get_books_from_pinecone(work_id)** - Get top recommendations for seed book
- **get_work_to_remove(all_work_ids, bad_work_id)** - Find most similar unwanted recommendation to remove


## 7. Deployment Infrastructure

This project was deployed on a Digital Ocean droplet; the Postgres database was also hosted on Digital Ocean.

**Docker Multi-Stage Build:**
1. **Stage 1 (React Build):** Node 20 base image

2. **Stage 2 (Django + Services):** Python 3.10.12 base image
   - Installs: Nginx, Redis server, Python dependencies
   - Copies Django app and React build to `/djangoapp/static/`
   - Configures Gunicorn systemd service
   - Configures Nginx reverse proxy
   - Executes entrypoint.sh on startup

**Container Startup** (`entrypoint.sh`):
1. Start Redis server
2. Start Celery worker (solo mode, concurrency=1)
3. Start Gunicorn (5 workers)
4. Start Nginx (daemon off for container foreground)

**Deployment Script** (`deploy.sh`):
- Target: DigitalOcean Droplet (138.197.107.114)
- Uses rsync to sync code files
- SSH commands to build Docker image and restart container
- Maps ports 80 and 443
