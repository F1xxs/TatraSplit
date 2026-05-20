FRONTEND_HOST ?= 0.0.0.0
FRONTEND_PORT ?= 4173

all: run

requirements:
	@echo "Installing requirements..."
	npm install

install: requirements
	@echo "Setup complete"

run:
	@echo "Frontend -> http://$(FRONTEND_HOST):$(FRONTEND_PORT)"
	npm run dev -- --host

run-prod: requirements
	@echo "Frontend -> http://$(FRONTEND_HOST):$(FRONTEND_PORT)"
	npm run build
	npm run preview -- --host "$(FRONTEND_HOST)" --port "$(FRONTEND_PORT)"

format:
	npm run format

clean:
	@echo "Cleaning up..."
	rm -rf node_modules
	@echo "Clean complete"
