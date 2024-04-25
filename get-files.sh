#!/usr/bin/env bash

GITHUB_DIR=~/teaching/csa/github/

dir=$(realpath --relative-to="$GITHUB_DIR" $(pwd))

cd "$GITHUB_DIR"
./repos get-files-by-day.sh main assessments/inheritance-2-mild/answers.json $dir/answers/
