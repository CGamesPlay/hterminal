#!/bin/bash

set -e

root=$(dirname $0)

# We need to get the OS X window ID of the terminal process in order to take a
# screenshot automatically. Normal applescript methods don't seem to work for
# Electron apps, so I built this quickie program to do it.
[ -f $root/fgwinid ] || clang -framework cocoa $root/fgwinid.m -o $root/fgwinid

screenshot() {
  screencapture -l$($root/fgwinid) "$@"
}

# Wait for the terminal to be completely caught up with us
sync_hterminal() {
  saved_stty=$(stty -g)
  stty -echo -icanon raw
  echo -n '[5n'
  read -n 4
  stty "$saved_stty"
  sleep 0.1
}

fake_command() {
  echo -n -e "\r"
  echo -n -e "\x1b]133;A\a"
  echo "$" "$@"
  echo -n -e "\x1b]133;C;\a"
  "$@"
  echo -n -e "\x1b]133;D;$status\a"
  echo -n -e "\x1b]133;A\a"
  echo -n "$ "
  sync_hterminal
}

clear() {
  for i in $(seq 1 $(tput lines)); do
    echo
  done
}

set_title() {
  echo -n -e "\x1b]0;"
  echo -n "$@"
  echo -n -e "\a"
}

set_title "fish $(pwd)"

clear
fake_command git st
fake_command cat /Library/Developer/CommandLineTools/usr/share/gitweb/static/git-logo.png
fake_command ls
screenshot share/res/typical.png
