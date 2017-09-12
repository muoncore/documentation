
LINKS:=guides.git muon-java.git muon-node.git muon-clojure.git muon-amqp.git stack-rpc.git stack-events.git stack-reactive-streams.git newton.git photon.git photonlite.git muon-cli.git


.PHONY = render run prepare

checkout: $(LINKS)

%.git:
	mkdir -p inc
	rm -rf inc/$*
	cd inc; git clone git@github.com:/muoncore/$*


run:
	jekyll clean
	jekyll serve --incremental  --config _versions.yml,_config.yml

clean:
	jekyll clean

render:
	jekyll clean
	jekyll build --config _versions.yml,_config.yml

update:
	git submodule update --remote --merge

setup:
	sudo gem install jekyll jekyll-redirect-from jekyll-paginate jekyll-sitemap jekyll-asciidoc asciidoctor-diagram pygments.rb

prepare:
	#rm -rf /tmp/muon-doc-gen
	#mkdir /tmp/muon-doc-gen
	#git clone -b gh-pages git@gitlab.com:muoncore/documentation.git /tmp/muon-doc-gen
	#$(cd /tmp/muon-doc-gen; git checkout gh-pages)

install: prepare render
	./buildsite.sh

submodules-commit: update
	-git submodule foreach git add .
	-git submodule foreach git commit -m "Update docs in the documentation project"
	-git submodule foreach git push
	-git submodule update --remote --merge
