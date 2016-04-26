HTML Mode
=========

HTerminal supports displaying HTML data in the terminal. This is accomplished using special escape sequences to instruct HTerminal to switch between "cells". A cell is either text-based or HTML-based.

When HTerminal receives any output from the terminal, it will append it to the bottommost text-based cell, creating a new one at the end if the last one is an HTML-based cell.

The grammar for HTML escape codes follows:

```
wrapped-command = osc "1866;" command terminator
osc = "\x1b]"
terminator = "\x07" | "\x1b\\"

command = insert-html
insert-html = "0;" document
```

A description of the effect of the commands follows:

insert-html
-----------

Create a new HTML-based cell at the end and fill it with the HTML document.
