function __htfish_init
  # Add our wrapper functions to the PATH
  set -g fish_user_paths (dirname (dirname (dirname (dirname (status -f)))))/bin $fish_user_paths
  autoload (dirname (status -f))/functions

  function htfish_status_bar --on-event fish_prompt
    if not set -q -g htfish_prompt_hostname
      set -g htfish_prompt_hostname (hostname|cut -d . -f 1)
    end

    set -l git_info (__fish_git_prompt)
    if not test -z $git_info
      set -l git_info "<strong>"$git_info"</strong>"
    end

    set -l pwd_link '<a href="cmd://open%20.">'(prompt_pwd)'</a>'

    htfish_printf -r hterminal-status '<strong>%s</strong>@<strong>%s</strong> <strong>%s</strong> <strong>%s</strong>%s' \
      $USER \
      $htfish_prompt_hostname \
      (date "+%x %I:%M %p") \
      $pwd_link \
      $git_info
  end
end

__htfish_init
