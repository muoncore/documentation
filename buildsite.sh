#!/bin/bash

MYDIR=`pwd`

TARGET=../doc-gen

echo "Starting in $MYDIR"

rm -rf $TARGET

mkdir $TARGET

git clone -b gh-pages git@gitlab.com:muoncore/documentation.git $TARGET


cd $TARGET
git checkout gh-pages
git remote add github git@github.com:muoncore/documentation.git
cd $MYDIR
pwd

make render

rsync -av --del  --exclude=".git/" _site/ $TARGET

cd $TARGET

pwd
git checkout gh-pages
pwd

git add .
git status
git commit -m "Update docs"
git push origin -f gh-pages
echo "Pushing to github"
git push github -f gh-pages

cd $MYDIR
