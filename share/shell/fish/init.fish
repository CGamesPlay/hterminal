function __htfish_init
  set -l hterminal_root (dirname (dirname (dirname (dirname (status -f)))))/bin
  set CSI \e\[
  set OSC \e\]

  # Add our wrapper functions to the PATH
  set -g fish_user_paths $hterminal_root $fish_user_paths

  if not ishterminal; return; end

  function htfish_html_printf
    printf "\e]1866;0;"$argv[1]"\a" $argv[2..-1]
  end

  function fish_prompt
    if not set -q -g htfish_prompt_hostname
      set -g htfish_prompt_hostname (hostname|cut -d . -f 1)
    end

    set -l git_info (__fish_git_prompt)
    if not test -z $git_info
      set -l git_info "<strong>"$git_info"</strong>"
    end

    set -l pwd_link '<a href="cmd://open%20.">'(prompt_pwd)'</a>'

    htfish_html_printf "<strong>%s</strong>@<strong>%s</strong> <strong>%s</strong> <strong>%s</strong>%s" \
      $USER \
      $htfish_prompt_hostname \
      (date "+%x %I:%M %p") \
      $pwd_link \
      $git_info
    echo "\$ "
  end
end
# fish_color_unused

__htfish_init
