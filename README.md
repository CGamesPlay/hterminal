Use Cases
=========

General
-------
Could use something like iTerm shell integration to achieve this.

- Tab completion with a rich input element
- Status bar support showing PWD, git status, etc.
- REPL integration to show input text, result message, throbber, and overall status.
- REPL integration to show alternate screen contents after it's been hidden.

File management
---------------
- It should be easy to open Finder to the directory you're in.
- Directory listings should behave like Finder windows, with drag-n-drop and double clicking to open them.
- cat should work on all file types, including offering a download proxy icon if the file is binary.

Jupyter features
----------------
Jupyter has great table support, as well as images.

Git
---
- Run `git status` and an augmented status page shows up with buttons to stage, unstage, commit, etc files. Typing additional git commands will cause the existing status window to refresh. Git diff will open in a popup. Git commit opens the editor in a popup.

SSH
---
- Tmux would run in a popup, not much fanciness there.

ITerm parity
------------
Shell integration allows you to set marks to jump to output of specific commands, identifies previous directories and allows downloading remote files.

Fish
----
I should have a rich text input to type shell commands, and tab should open a rich completion interface. There are many difficulties with this since fish has a very deep readline integration.

Extensions
----------
ComponentLibrary is just a library, additional commands can easily be added to it via user scripts.

HTML Mode
=========

HTerminal supports displaying HTML data in the terminal. This is accomplished using special escape sequences to instruct HTerminal to switch between "cells". A cell is either text-based or HTML-based.

When HTerminal receives any output from the terminal, it will append it to the bottommost text-based cell, creating a new one at the end if the last one is an HTML-based cell.

The grammar for HTML escape codes follows:

```
wrapped-command = osc "1866;" command terminator
identify = csi "1866n"
osc = "\x1b]"
terminator = "\x07" | "\x1b\\"
csi = "\x1b["

command = insert-html | replace-html
insert-html = "0;" document
replace-html = "1;" id ";" document
```

A description of the effect of the commands follows:

identify
--------
Send version information. HTerminal will respond with CSI "HT " followed by the HTerminal version, followed by "n".

insert-html
-----------
Create a new HTML-based cell at the end and fill it with the HTML document.

replace-html
------------
Replace the contents of the cell identified by id with the HTML document.


Troubleshooting
===============

- HTML prompt not displaying. Fish needs to be at least version 2.2.0 or else it will decide the prompt is too long and not display it.
- Adjusting the content in fixed sections like hterminal-status may cause the window size to change. If responding to the SIGWINCH causes the window size to change again, this may lead to an infinite loop.

Recommended reading
===================

- https://github.com/shockone/black-screen
- https://github.com/unconed/TermKit
- http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
- http://www.asciitable.com/

Distribution
============

There are 4 targets available:

- web / production - optimized socket.io client and matching server
- web / debug - hot-reloading socket.io client and matching server
- app / production - optimized electron app
- app / debug - hot-reloading electron app

CPU Usage in Electron
=====================

I compiled my own version of Electron in order to fix the CPU usage problem. The core of electron gets built normally, the `scripts/create-dist.py` is used to make a zip file.

```bash
cd ~/Projects/hterminal/electron
./scripts/build.py
./scripts/create-dist.py
cp dist/electron-v0.37.8-darwin-x64.zip ~/.electron/
cd ~/Projects/hterminal/hterminal
./script/create-dist.sh
```

This shouldn't be needed for any version after 0.37.8, when the pull was accepted.

Note that `develop-app` still uses about 30% CPU, this seems to be casued by an incompatibility between webpack and electron.
