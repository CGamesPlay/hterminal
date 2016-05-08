export function inputFromEvent(event, keypadMode) {
  var prefix = keypadMode ? "\x1bO" : "\x1b[";
  let input = "";
  if (event.metaKey) {
    // Don't process OS shortcuts
    return "";
  }
  if (event.type == "keypress") {
    let charCode = event.keyCode;
    if (charCode < 16 || charCode == 27) {
      // Pass direct for NL, BS, etc
    } else if (charCode >= 64 && charCode < 91) {
      if (!event.shiftKey) {
        charCode += 32;
      }
      if (event.ctrlKey) {
        charCode -= 96;
      }
    }
    input = String.fromCharCode(charCode);
  } else if (event.type == "keydown") {
    if (event.code == "Backspace" || event.code == "Delete") {
      input = String.fromCharCode(127);
    } else if (event.code == "ArrowUp") {
      input = prefix + "A";
    } else if (event.code == "ArrowDown") {
      input = prefix + "B";
    } else if (event.code == "ArrowRight") {
      input = prefix + "C";
    } else if (event.code == "ArrowLeft") {
      input = prefix + "D";
    } else if (event.keyCode < 16 || event.keyCode == 27) {
      // Control characters on a keyboard. Pass through.
      input = String.fromCharCode(event.keyCode);
    }
    if (event.altKey && input.length > 0) {
      input = String.fromCharCode(27) + input;
    }
  }
  return input;
}
