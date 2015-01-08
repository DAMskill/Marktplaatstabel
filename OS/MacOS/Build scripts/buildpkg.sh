#!/bin/bash
cp -r ../../../www "../Package folder/Contents/Resources"
pkgbuild --root "../Package folder" --scripts "../Package scripts" --version 2.4.0 --install-location /Applications/Marktplaatstabel.app Marktplaatstabel-2.4.0.pkg --identifier nl.marktplaatstabel
rm -r "../Package folder/Contents/Resources/www"

