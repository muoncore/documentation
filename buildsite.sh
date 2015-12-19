#!/bin/bash

MYDIR=`pwd`

echo "Starting in $MYDIR"

rm -rf /tmp/muon-doc-gen

mkdir /tmp/muon-doc-gen

git clone -b gh-pages git@github.com:microserviceux/documentation.git /tmp/muon-doc-gen

cd /tmp/muon-doc-gen
git checkout gh-pages
cd $MYDIR
pwd

find -iname '*.adoc' -execdir asciidoctor {} \;

rsync -av --exclude=".git/"  --include='*.adoc' . /tmp/muon-doc-gen

cd /tmp/muon-doc-gen

pwd
git checkout gh-pages
pwd
git add .
git status
git commit -m "Update docs"
git push origin -f gh-pages

cd $MYDIR
find -iname '*.html' -execdir rm {} \;
