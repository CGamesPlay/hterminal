# What is HTerminal?

HTerminal is a new kind of terminal program. It works with all your existing programs and workflows, but can be extended to provide rich user experiences using HTML and CSS.

:warning: **Warning:** HTerminal is not ready for public consumption yet. You are welcome to download a copy to try out, but many features you expect from a terminal program are not yet implemented.

![](share/res/typical.png)

## Archived

I haven't worked on this project in a long time. The main reason is that while I think this sort of interface makes things generally nicer, it's a huge amount of work for what ultimately boils down to a rather limited gain. If I was going to restart this project, I think the most important factor would be to decide exactly what shell commands benefit from rich interfaces and how they could be implemented.

## Features

- Fully compatible with all existing terminal programs and shells. HTerminal enhances existing programs instead of replacing them.
- No learning curve. HTerminal automatically extends programs you already know how to use, but makes them work better.
- *Planned* - Customizable. You can install your own CSS stylesheets to change both the terminal as well as the HTML components from programs.
- *Planned* - Extendable. You can install packages to add new features.

## Compatibility

HTerminal aims to be compatible with most existing terminal programs without any modification. This allows you to start using HTerminal without fully changing around your workflow. Some programs that HTerminal currently works with are:

**Basic programs**

All normal terminal programs programs like ps, top, kill, ls, cd, etc. are all fully supported by HTerminal. HTerminal primarily works by providing transparent wrappers around exisiting commands to give them enhanced functionality (which can be disabled if needed).

- *Planned* - terminal styles like colors and bold are not currently implemented.

**Environment configurations**

Programs like rvm and virtualenv work just fine in HTerminal, because HTerminal is not a shell.

**Fish**

Fish is the preferred shell of HTerminal and all features of fish are supported and improved upon.

- *Planned* - Input interface utilizing all of the fish completions, but presented using a rich typeahead control.

**Vim**

Vim currently is partially supported. It works for basic editing, for example a git commit message editor.

**SSH**

All HTerminal features work over SSH, because HTerminal does not need special software to communicate with programs. Note that tmux and mosh do not understand the HTerminal communication protocol. These programs work in HTerminal, but do not gain any of HTerminal's enhanced features.

**General REPL interface**

- Easily copy command output to the clipboard.
- Hide the output from an individual command.
- *Planned* - Review what the alternate screen was showing previously.
- *Planned* - Show run time and throbber.

**File management**

- It should be easy to open Finder to the directory you're in.
- Directory listings should behave like Finder windows, with drag-n-drop and double clicking to open them.
- cat should work on all file types, including offering a download proxy icon if the file is binary.

**Jupyter**

*Planned* - `jupyter console` should render HTML like `jupyter notebook` does.

**Git**

*Planned* - Run `git status` and an augmented status page shows up with buttons to stage, unstage, commit, etc files. Typing additional git commands will cause the existing status window to refresh. Git diff will open in a popup. Git commit opens the editor in a popup.

**iTerm 2**

- Shell integration allows you to set marks to jump to output of specific commands, identifies previous directories and allows downloading remote files.

Installation
============

**End-user installation**

The easiest way to try HTerminal is to use a prebuilt binary. HTerminal is not ready for widespread use, so the binary is unversioned but is kept up to date with the `master` branch of this repository.

:warning: **Warning:** HTerminal is not ready for public consumption yet. You are welcome to download a copy to try out, but many features you expect from a terminal program are not yet implemented.

1. [Download HTerminal](https://www.dropbox.com/s/cvq559t1ala32y8/HTerminal.zip?dl=0) and extract it to `~/Applications/`.
2. [Download and install Fish](https://fishshell.com) if you don't already use it. HTerminal supports all shells, but Fish has an out-of-the-box configuration already made.
3. Add the following to `~/.config/fish/init.fish`, or some other initialization file for Fish.
4. Launch HTerminal and type `ls`.

```fish
# Load hterminal shell integration
if [ ! -z $HTERMINAL_ROOT ]
  source $HTERMINAL_ROOT/share/shell/fish/init.fish
end
```

**Developer installation**

If you want to contribute to HTerminal, follow these steps:

1. Clone the repository.
2. `yarn`
3. Use `yarn run develop` launch a live-reloading HTerminal.
4. Use `yarn run package` to create a standalone app in `HTerminal-darwin-x64`.

Note that `develop` still uses about 30% CPU; this seems to be caused by an incompatibility between webpack and electron. When you build a standalone app using `create-dist` the CPU usage for HTerminal is minimal.

Troubleshooting
===============

- Adjusting the content in fixed sections like hterminal-status may cause the window size to change. If responding to the SIGWINCH causes the window size to change again, this may lead to an infinite loop.

Recommended reading
===================

- The documentation written in [share/doc/](share/doc/)
- https://github.com/shockone/black-screen
- https://github.com/unconed/TermKit
- http://invisible-island.net/xterm/ctlseqs/ctlseqs.html
- http://www.asciitable.com/
- http://vt100.net/emu/dec_ansi_parser

Thoughts on completions
=======================

In order to get full control of reading lines with fish, a script is used to read lines and evaluate them. There are some problems:

- `fish --no-execute -c ")"` returns shell true despite being an invalid command.
- `commandline -f execute` redraws the command line before executing
- `eval`: `set -l` doesn't work and history isn't added.

I could have htfish_read_command output an escape start before returning, and an escape terminator in the preexec hook. I could also have the fish prompt be completely empty. If the prompt contains DSR, input will have to be consumed in a preexec hook.
