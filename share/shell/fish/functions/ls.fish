# Provide this transparent wrapper to disable the fish-provided ls functionalty.
function ls --description 'List contents of directory'
  command ls $argv
end
