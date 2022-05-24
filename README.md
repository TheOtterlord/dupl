# Dupl

A simple, yet powerful tool for duplicating files. Think `cp`, but more epic.

## Install

You can install dupl using `deno install` or by downloading the portable binaries from the [latest release](https://github.com/TheOtterlord/dupl/releases/latest) page. Binaries are provided for Linux, Windows, and MacOS.

```bash
deno install --allow-read --allow-write --unstable --name dupl https://raw.githubusercontent.com/TheOtterlord/dupl/main/mod.ts
```

## Usage

Use `--help` to read about the options.

```
dupl --help
```

Dupl requires two main arguments. A source directory, and an output
directory. The source directory is where it copies from, and the output
directory is where it writes the copy.

If the output directory already exists, you'll be asked if you want to overwrite
the directory. **Doing this will DELETE all files in the directory**.

```bash
# backup the current directory (e.g. `my_git_repo`)
dupl . ../my_git_repo_2
```

### Flags

- `-h, --help` - Show the help message
- `-i, --ignore` - Add additional globs to ignore
- `--gitignore=true|false` - Ignore files in the .gitignore (default: true)
- `-f, --force` - Ignore any prompts, including warnings about overwriting
  existing files/directories
- `-v, --verbose` - Show all files before prompt.
