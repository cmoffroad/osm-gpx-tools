for f in *.MP4; do; D="./${f%%.*}"; rm -df $D; mkdir $D; ffmpeg -i $f -r 1 -q:v 2 ${D}/${D}_%04d.jpg; done