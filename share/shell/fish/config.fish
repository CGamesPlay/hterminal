function __htfish_init
  # Add our wrapper functions to the PATH
  set -g fish_user_paths (dirname (dirname (dirname (dirname (status -f)))))/bin $fish_user_paths
  set -g fish_function_path (dirname (status -f))/functions $fish_function_path

  function htfish_status_bar --on-event fish_prompt
    if not set -q -g htfish_prompt_hostname
      set -g htfish_prompt_hostname (hostname|cut -d . -f 1)
    end

    set -l git_info (__fish_git_prompt "%s")
    if not test -z $git_info
      set git_info '<strong><icon id="code-fork" /> '$git_info'</strong>'
    end

    set -l pwd_link '<a href="cmd://open%20.">'(prompt_pwd)'</a>'

    htfish_printf -f hterminal-status '<strong><icon id="user" /> %s</strong> <strong><icon id="television" /> %s</strong> <strong><icon id="folder-o" /> %s</strong> %s' \
      $USER \
      $htfish_prompt_hostname \
      $pwd_link \
      $git_info
  end
end

__htfish_init
