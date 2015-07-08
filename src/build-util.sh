#!/bin/bash

SOURCE_FILE="main.js"
DEST_FILE="main.build.js"
PROJECT_FILE="projects.txt"

# write information to 'main.build.js'
echo "/*" > $DEST_FILE # '>' to overwrite file
echo "== Google Script Util Library ==" >> $DEST_FILE  # '>>' to append 
echo "THIS FILE IS PULLED FROM VERSION CONTROL. DO NOT EDIT IT HERE." >> $DEST_FILE
echo "Open the 'google-script-util' repo and edit 'src/main.js/'" >> $DEST_FILE
echo "Run 'build-util.sh' to log edits, then copy into 'util.gs' in your project" >> $DEST_FILE
echo >> $DEST_FILE
echo "Projects using some version of this library:" >> $DEST_FILE
cat $PROJECT_FILE >> $DEST_FILE
echo >> $DEST_FILE
echo >> $DEST_FILE
echo "== BUILD INFO ==" >> $DEST_FILE
node -e "var now = new Date(); console.log('utc: '+now.getTime()+'\n'+'utc_print: '+now.toString())" >> $DEST_FILE
echo "branch: $(git symbolic-ref --short HEAD)" >> $DEST_FILE
echo "rev: $(git rev-parse HEAD)" >> $DEST_FILE
echo "uname: $(whoami)" >> $DEST_FILE
echo "*/" >> $DEST_FILE
echo >> $DEST_FILE
cat $SOURCE_FILE >> $DEST_FILE