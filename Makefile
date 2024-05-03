# Remove make's default rules.
.SUFFIXES:

SHELL := bash -O globstar

all: db.db

db.db: schema.sql make-db.js
	node make-db.js

pretty:
	prettier -w **/*.js *.sql public/**/*.css

serve:
	npx nodemon --watch . -e js,mjs,json,njk,html index.js

.PHONY: pretty serve


clean:
	rm -f db.db*
