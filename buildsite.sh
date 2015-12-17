#!/bin/bash

find . -type d -print0 | xargs -0 -L1 sh -c 'cd "$0" && pwd && asciidoctor *.adoc'

git checkout gh-pages
git add .
git commit -m "Update docs"
git push origin
git checkout master
