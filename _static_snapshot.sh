mv public/robots.txt public/robots.x

rm -r localhost\:3000

wget --html-extension -p -k http://localhost:3000/
wget --html-extension -p -k http://localhost:3000/filter/SectorCategory
wget --html-extension -p -k http://localhost:3000/activities?SectorCategory=311
wget --html-extension -p -k http://localhost:3000/activity/GB-CHC-285776-ZIM349

mv localhost\:3000/index.html localhost\:3000/home.html

rm -r localhost\:3000/images

cp -r public/images localhost\:3000/images

# update stylesheets to use relative images
find localhost\:3000/stylesheets/*.css -exec sed -i remove 's/http:\/\/localhost:3000/../g' {} \;

rm localhost\:3000/stylesheets/*.cssremove

rm localhost\:3000/stylesheets/robots.txt


mv public/robots.x public/robots.txt