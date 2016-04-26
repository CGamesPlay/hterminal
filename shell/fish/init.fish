begin
  set -l hterminal_root (dirname (dirname (dirname (status -f))))
  set CSI \e\[
  set OSC \e\]

  # Add our wrapper functions to the PATH
  set -g fish_user_paths $hterminal_root/bin $fish_user_paths

  function htfish_html_printf
    printf $OSC"1866;0;"$argv[1]"\a" $argv[2..-1]
  end

  function fish_prompt
    if not set -q -g htfish_prompt_hostname
      set -g htfish_prompt_hostname (hostname|cut -d . -f 1)
    end

    set -l git_info (__fish_git_prompt)
    if not test -z $git_info
      set -l git_info "<strong>"$git_info"</strong>"
    end

    htfish_html_printf "<strong>%s</strong>@<strong>%s</strong> <strong>%s</strong> <strong>%s</strong>%s" \
      $USER \
      $htfish_prompt_hostname \
      (date "+%x %I:%M %p") \
      (prompt_pwd) \
      $git_info
    # We write a device status report escape to cause the terminal to respond
    # with CSI 0 n. This will be used as a binding to break out of Fish's
    # readline function.
    echo -n $CSI"5n"
  end

  function htfish_read_line
    head -n 1 | read newcommand
    commandline -r $newcommand
    commandline -f execute
  end

  function fish_user_key_bindings
    bind $CSI"0n" htfish_read_line
  end
end
