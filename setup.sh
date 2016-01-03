# set up dist directory structure
dirs=( dist dist/html dist/data dist/data/network dist/data/wiggle dist/data/expression dist/data/bed dist/data/upload )
for dir in "${dirs[@]}"
do
  if [ ! -d $dir ]; then
    mkdir $dir
  fi
done

# download bigWigToWig for testing
curl -o test/bigWigToWig http://hgdownload.cse.ucsc.edu/admin/exe/linux.x86_64/bigWigToWig