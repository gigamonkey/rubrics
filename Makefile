# Remove make's default rules.
.SUFFIXES:

.PHONY: load

SHELL := bash -O globstar

all: load

db.db: schema.sql make-db.js
	node make-db.js

load: db.db
	node load-data assignments/itp/hofs-1
	node load-data assignments/csa/inheritance-2-spicy


pretty:
	prettier -w **/*.js *.sql public/**/*.css

serve:
	npx nodemon --watch . -e js,mjs,json,njk,html index.js

.PHONY: pretty serve


clean:
	rm -f db.db*
