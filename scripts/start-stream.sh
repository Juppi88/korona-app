#!/bin/bash

buffer_file="/run/user/1000/camera.ffm"

# Remove previous buffer file.
rm -f $buffer_file

# Start the video server if it's not running.
if ! pgrep -x "ffserver" > /dev/null
then
    ffserver & > /dev/null
fi

# Start recording.
ffmpeg -loglevel panic -i /dev/video0 http://localhost:8090/camera.ffm & > /dev/null
