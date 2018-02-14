#!/bin/bash

# Copy Plasma theme icons
# Make sure you are using default theme
mkdir -p ~/.local/share/plasma/desktoptheme/default/icons/
cp ./dist/plasma/*.svgz ~/.local/share/plasma/desktoptheme/default/icons/

# Stop Plasma workspace
kquitapp5 plasmashell &>/dev/null

# Clear svg cache
rm ~/.cache/*svg* ~/.cache/*.kcache

# Restart Plasma workspace
kstart5 plasmashell &>/dev/null
