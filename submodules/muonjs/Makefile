
all: run

build:
	npm install

clean: build
	rm -rf dist
	rm -f test/server/muon.js
	rm -f src/muon.js
	rm -f src/muon.min.js

muonjs: clean
	mkdir dist
	./node_modules/browserify/bin/cmd.js -r muon-core -r jquery -r json-markup -r ./src/index.js:muonjs > ./dist/muon.js
	#./node_modules/minifier/index.js --output ./dist/muon.min.js ./dist/muon.js
	cp dist/muon.js test/server/muon.min.js

run: muonjs
	npm run dev

publish:
ifndef VERSION
	$(error VERSION is undefined for NPM release)
endif
	npm install
	npm version --no-git-tag-version $(VERSION)
	npm publish
