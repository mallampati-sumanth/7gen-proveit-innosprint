.PHONY: dev test test-backend dev-backend dev-frontend clean

dev:
	docker compose up --build

test:
	pytest backend/tests

test-backend:
	pytest backend/tests -v

dev-backend:
	uvicorn backend.app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

clean:
	rm -rf __pycache__ .pytest_cache proveit.db
