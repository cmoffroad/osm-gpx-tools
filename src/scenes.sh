#D=./scenes; rm -f $D; mkdir $D; for f in *.MP4; do; ffmpeg -i $f -r 1 -q:v 2 scenes/${f}_%04d.jpg; done
for f in *.MP4; do; D="./${f%%.*}"; rm -df $D; mkdir $D; ffmpeg -i $f -r 1 -q:v 2 ${D}/${D}_%04d.jpg; done