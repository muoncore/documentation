
.PHONY: test

install:

test:
	npm test

node_modules:
	npm install

docker-release: node_modules
	docker build -t simplicityitself-muon-image.jfrog.io/aether-password:latest .
	docker push simplicityitself-muon-image.jfrog.io/aether-password:latest
