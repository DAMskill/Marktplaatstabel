#!/bin/bash

cp -r "../../../WWW"      "../Package folder/Contents/Resources"
cp -r "../Node.js"        "../Package scripts"
cp -r "../../../Examples" "../Package scripts"

pkgbuild --root "../Package folder" --scripts "../Package scripts" --version 2.4.5 --install-location /Applications/Marktplaatstabel.app Marktplaatstabel-2.4.5.pkg --identifier nl.marktplaatstabel

rm -r "../Package folder/Contents/Resources/WWW"
rm -r "../Package scripts/Node.js"
rm -r "../Package scripts/Examples"

