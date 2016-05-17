#!/bin/bash

time {
  for i in `seq 1 10`; do
    man bash | grep --line-buffered '^'
  done
  echo -e '\x1b[5n'
  read -n 4
}
