begin
  set -l hterminal_root (dirname (dirname (dirname (status -f))))
  set -g fish_user_paths $hterminal_root/bin $fish_user_paths

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

    # Write actual prompt to stderr to bypass fish's prompt length restrictions.
    htfish_html_printf "<strong>%s</strong>@<strong>%s</strong> <strong>%s</strong> <strong>%s</strong>%s" \
      $USER \
      $htfish_prompt_hostname \
      (date "+%x %I:%M %p") \
      (prompt_pwd) \
      $git_info
  end
end
