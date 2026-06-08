import {
  CLI_COMMANDS,
  CLI_COMPLETION_PACKAGE_MANAGERS,
  CLI_FAMILIES,
  CLI_OPTIONS,
  CLI_PRESETS,
} from './cli-constants'

function words(values: readonly string[]): string {
  return values.join(' ')
}

export function renderBashCompletion(): string {
  return `# bash completion for arche
_arche_completion() {
  local cur prev
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  case "$prev" in
    completion)
      COMPREPLY=( $(compgen -W "bash zsh" -- "$cur") )
      return 0
      ;;
  esac

  case "$cur" in
    --family=*)
      COMPREPLY=( $(compgen -W "${words(CLI_FAMILIES)}" -- "\${cur#--family=}") )
      return 0
      ;;
    --preset=*)
      COMPREPLY=( $(compgen -W "${words(CLI_PRESETS)}" -- "\${cur#--preset=}") )
      return 0
      ;;
    --pm=*|--package-manager=*)
      COMPREPLY=( $(compgen -W "${words(CLI_COMPLETION_PACKAGE_MANAGERS)}" -- "\${cur#*=}") )
      return 0
      ;;
    --*)
      COMPREPLY=( $(compgen -W "${words(CLI_OPTIONS)}" -- "$cur") )
      return 0
      ;;
  esac

  COMPREPLY=( $(compgen -W "${words([...CLI_COMMANDS, ...CLI_FAMILIES])}" -- "$cur") )
}

complete -F _arche_completion arche create-arche
`
}

export function renderZshCompletion(): string {
  return `#compdef arche create-arche

local -a commands families presets package_managers options
commands=(${CLI_COMMANDS.map((value) => `"${value}"`).join(' ')})
families=(${CLI_FAMILIES.map((value) => `"${value}"`).join(' ')})
presets=(${CLI_PRESETS.map((value) => `"${value}"`).join(' ')})
package_managers=(${CLI_COMPLETION_PACKAGE_MANAGERS.map((value) => `"${value}"`).join(' ')})
options=(${CLI_OPTIONS.map((value) => `"${value}"`).join(' ')})

case "$words[2]" in
  completion)
    _describe 'shell' '("bash" "zsh")'
    return
    ;;
esac

case "$PREFIX" in
  --family=*)
    _values 'family' $families
    ;;
  --preset=*)
    _values 'preset' $presets
    ;;
  --pm=*|--package-manager=*)
    _values 'package manager' $package_managers
    ;;
  --*)
    _describe 'option' options
    ;;
  *)
    _describe 'command' commands
    _describe 'family' families
    ;;
esac
`
}

export function renderCompletion(shell: 'bash' | 'zsh'): string {
  return shell === 'bash' ? renderBashCompletion() : renderZshCompletion()
}
