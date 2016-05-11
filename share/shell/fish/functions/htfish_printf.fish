function htfish_printf -d "Format a string as HTML. -r = replace, -f replace fixed ID"
  set opcode "0;"
  switch $argv[1]
    case -r
      set opcode "1;"
      set argv $argv[2..-1]
    case -f
      set opcode "2;"$argv[2]";"
      set argv $argv[3..-1]
  end
  set format $argv[1]
  set -e argv[1]
  printf "\e]1866;"$opcode$format"\a" $argv
end
