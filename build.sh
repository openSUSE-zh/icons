#!/bin/bash

gulp

# Compress all svg to svgz
cd dist/plasma
for i in *.svg; do
    gzip -cfq9 $i > "${i}z"
done
