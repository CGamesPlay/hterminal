function htfish_printf -d "Format a string as HTML"
  set format $argv[1]
  set -e argv[1]
  printf "\e]1866;0;"$format"\a" $argv
end
