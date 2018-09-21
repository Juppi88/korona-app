#!/bin/bash

player_red="$1"
player_yellow="$2"
player_green="$3"
player_blue="$4"

buffer_file="/run/user/1000/camera.ffm"

font="/usr/share/fonts/truetype/piboto/PibotoCondensed-Regular.ttf"
font_italic="/usr/share/fonts/truetype/piboto/PibotoCondensed-Italic.ttf"
font_size=25
box_border=3


# Remove previous buffer file.
rm -f $buffer_file

# Start the video server if it's not running.
#if ! pgrep -x "ffserver" > /dev/null
#then
#    ffserver & > /dev/null
#fi

####################################################################################################

font_params="fontfile=$font: fontsize=$font_size: box=1: boxcolor=white@0.7: boxborderw=$box_border"
params=""
has_players=0

if [ ! -z "$player_red" ]
then
	# If this isn't the first player added to the list, append a comma.
	[ $has_players == 1 ] && params="$params," || params=$params

	# Append the text parameters to the parameter list.
	params="$params drawtext='text=$player_red: fontcolor=red: x=(w-text_w)/2: y=(text_h)/2: $font_params'"

	# We've now processed at least one player.
	has_players=1
fi

# Add yellow player.
if [ ! -z "$player_yellow" ]
then
	[ $has_players == 1 ] && params="$params," || params=$params
	params="$params drawtext='text=$player_yellow: fontcolor=yellow: x=5: y=(h-text_h)/2: $font_params'"
	has_players=1
fi

# Add green player.
if [ ! -z "$player_green" ]
then
	[ $has_players == 1 ] && params="$params," || params=$params
	params="$params drawtext='text=$player_green: fontcolor=green: x=(w-text_w)/2: y=(h-text_h)-5: $font_params'"
	has_players=1
fi

# Add blue player.
if [ ! -z "$player_blue" ]
then
	[ $has_players == 1 ] && params="$params," || params=$params
	params="$params drawtext='text=$player_blue: fontcolor=blue: x=(w-text_w)-5: y=(h-text_h)/2: $font_params'"
	has_players=1
fi

####################################################################################################

# Start recording.
ffmpeg -thread_queue_size 1024 -i /dev/video0 -f lavfi -i anullsrc=channel_layout=mono:sample_rate=44100 -acodec aac -b:a 128k -vf "[in] \
	$params \
	[out]" -s 640x360 -r 30 -threads 4 -c:v h264_omx -b:v 750k -bufsize 1500k -g 60 -f flv rtmp://a.rtmp.youtube.com/live2/bmga-agch-38hy-6zsf
