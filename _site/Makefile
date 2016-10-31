
render:
	jekyll build

prepare:
	rm -rf /tmp/muon-doc-gen
	mkdir /tmp/muon-doc-gen
	git clone -b gh-pages git@github.com:microserviceux/documentation.git /tmp/muon-doc-gen
	$(cd /tmp/muon-doc-gen; git checkout gh-pages)

install: prepare render
	rsync -av --del  --exclude=".git/" _site/ /tmp/muon-doc-gen

	cd /tmp/muon-doc-gen

	pwd
	git checkout gh-pages
	pwd


