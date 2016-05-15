# Security in HTerminal

:warning: This document is written in the present tense, but many of these features are not fully implemented in early versions of HTerminal.

There are several malicious reasons to compromise the terminal.

1. Run some command in an unintended context, e.g. inject an additional command into a call to `sudo`.
2. Run code in the context of the terminal computer, e.g. install a trojan when the user `ssh` into a malicious server.
3. Learn information from the terminal's scrollback, e.g. server secrets.
4. Learn information about the terminal computer, e.g. insert tracking pixel to learn real source IP.

To prevent against these threats, several steps have been taken.

1. **Only parseable HTML is accepted.** This is the primary mechanism by which untrusted JavaScript is prevented from getting into the terminal. All tags must be from the approved list of HTML and HTerminal components, and all attributes are screened against the approved list of attributes. If an attribute or tag cannot be parsed, it is not put into the terminal DOM.

2. **The terminal has no access to external resources.** The terminal window cannot access any resources other than those bundled with the program. All network requests are forbidden by the host program.

3. **Insecure terminal reports are not acknowledged.** Terminal escape codes like DECRQCRA and window title reporting can cause the terminal to send sensitive information and/or attacker-controlled strings as input to other programs. These escape codes are ignored by HTerminal.

4. **The terminal is isolated from the host system.** The terminal window does not have any special access to the host system beyond its communication channel with the shell. Electron-specific features are not exposed to the terminal window.
