# HTerminal Protocol

## HTML Mode

HTerminal supports displaying HTML data in the terminal. This is accomplished using special escape sequences to instruct HTerminal to switch between "sections". A section is either text-based or HTML-based.

When HTerminal receives any output from the terminal, it will append it to the bottommost text-based section, creating a new one at the end if the last one is an HTML-based section.

The grammar for HTML escape codes follows:

```
wrapped-command = osc "1866;" command terminator
identify = csi "1866n"
osc = "\x1b]"
terminator = "\x07" | "\x1b\\"
csi = "\x1b["

command = insert-html | replace-html | replace-fixed-html
insert-html = "0;" document
replace-html = "1;" document
replace-fixed-html = "2;" id ";" document
```

A description of the effect of the commands follows:

### identify
Send version information. HTerminal will respond with CSI "HT " followed by the HTerminal version, followed by "n".

### insert-html
Create a new HTML-based section at the end and fill it with the HTML document.

### replace-html
If the bottommost section is HTML-based, replace its contents with the HTML document. Otherwise, behaves identically to insert-html. If the document is empty, remove the section (allowing you to continue writing to the previous text-based section).

### replace-fixed-html
Replace the contents of the fixed section named id with the HTML document.

## REPL Integration

HTerminal sections are divided into groups. Using special escape codes, sections can be marked as prompts or command output in a typical REPL loop. These escape codes are shared with [iTerm2 Shell Integration](https://www.iterm2.com/shell_integration.html).

The grammar for REPL escape codes follows:

```
wrapped-command = osc "133;" command terminator
osc = "\x1b]"
terminator = "\x07" | "\x1b\\"

command = repl-prompt | repl-output | repl-end
repl-prompt = "A"
repl-output = "C"
repl-end = "D;" status
```

A description of the effect of the commands follows:

### repl-prompt
If the current group has any sections marked as output, place the next output in a new section marked as the prompt in a new group.

### repl-output
Place the next output in a new section marked as output.

### repl-end
If the current group has any sections marked as output, mark the current group as having completed with status and place the next output in a new section in a new group.
