#!/bin/bash

find -iname '*.adoc' -execdir asciidoctor -a stylesheet="`pwd`/css/doc.css" {} \;
