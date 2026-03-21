# Task Management with Priority & Deadlines

Full-stack CRUD task management app with:
- Django REST backend
- React (Create React App) frontend
- Tailwind CSS UI

## Features
- Create projects
- Add tasks to projects
- Assign priority levels (`LOW`, `MEDIUM`, `HIGH`)
- Update task status (`TODO`, `IN_PROGRESS`, `DONE`)
- Filter tasks by deadline (`deadline_lte` query param)
- Deadline validation (backend blocks past dates on creation/update)
- Overdue calculation endpoint (`/api/tasks/overdue/`)

## Backend Setup
1. Create and activate virtual environment:
   - `python -m venv .venv`
   - `.\.venv\Scripts\Activate.ps1`
2. Install backend dependencies:
   - `pip install -r backend/requirements.txt`
3. Run migrations:
   - `python backend/manage.py migrate`
4. Start backend:
   - `python backend/manage.py runserver`

Backend runs at `http://localhost:8000`.

## Frontend Setup
1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Start frontend:
   - `npm start`

Frontend runs at `http://localhost:3000`.

## API Endpoints
- `GET/POST /api/projects/`
- `GET/POST /api/tasks/`
- `GET/PATCH/PUT/DELETE /api/tasks/:id/`
- `GET /api/tasks/?deadline_lte=YYYY-MM-DD`
- `GET /api/tasks/overdue/`

## Notes
- CORS is configured for `http://localhost:3000`.
- `frontend/.npmrc` sets `script-shell=powershell.exe` to avoid Windows path parsing issues in directories with `&`.
