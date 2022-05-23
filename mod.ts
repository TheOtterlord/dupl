import {
  copy,
  emptyDir,
  ensureDir,
  ensureFile,
  globToRegExp,
  parse,
  resolve,
  walk,
} from './deps.ts';

async function main(args: string[]) {
  const {
    help,
    ignore,
    gitignore = 'true',
    force,
    _: [src, out],
  }: { [key: string]: string } = parse(args, {
    alias: {
      h: 'help',
      i: 'ignore',
      f: 'force',
    },
  });

  if (help) {
    return console.log(`
Usage:
  $ dupl <src> <out> [flags]

Args:
  src: The directory/file to copy from.
  out: The directory/file to copy to.

Flags:
  -h, --help: Show this help message
  -i, --ignore: Ignore files/directories that match the given glob.
  --gitignore: Use the .gitignore file in the src directory. (default: true)
  -f, --force: Overwrite files/directories that already exist and ignore any prompts.
`);
  }

  if (!src || !out) {
    console.error('Please provide a source and destination.');
    Deno.exit(1);
  }

  // check if out is empty, ask to overwrite if not
  await ensureDir(out);
  for await (const file of walk(out)) {
    if (file.isFile) {
      if (
        !force &&
        !confirm(
          `Overwrite existing files in ${out} (this will delete the entire folder before the operation)`,
        )
      ) {
        Deno.exit(0);
      }
      await emptyDir(out);
      break;
    }
  }

  // @ts-expect-error --ignore is treated as the boolean `true`. This is not an expected input and so we handle it by ignoring it
  let ignoreGlobs: string[] = (ignore && ignore !== true)
    ? ignore.toString().split(',')
    : [];

  if (gitignore !== 'false') {
    const files = Deno.readFileSync(`${src}/.gitignore`);
    ignoreGlobs.push(
      ...new TextDecoder().decode(files).split('\n').filter((f) =>
        !f.startsWith('#') && f.trim().length > 0
      ),
    );
  }
  ignoreGlobs = ignoreGlobs.map((f) =>
    resolve(src, f.startsWith('/') ? f.substr(1) : f)
  );

  const ignoreRegex: RegExp[] = ignoreGlobs.map((g) => globToRegExp(g));

  const toCopy: string[][] = [];

  for await (const entry of walk(resolve(src), { skip: ignoreRegex })) {
    if (entry.isDirectory) continue;
    toCopy.push([entry.path, entry.name]);
  }

  console.log(`Copying ${toCopy.length} files from ${src} to ${out}`);

  if (
    (!force) && !confirm(`Copy ${toCopy.length} files from ${src} to ${out}`)
  ) {
    Deno.exit(0);
  }

  const startTime = performance.now();

  let progress = 0;
  const copyStringLength = toCopy.length.toString().length;
  for (const file of toCopy) {
    Deno.stdout.writeSync(
      new TextEncoder().encode(
        `\x1b[1K\r[${
          ' '.repeat(copyStringLength - progress.toString().length)
        }${progress}/${toCopy.length}] Copying ${file[0]}`,
      ),
    );
    const fileOut = resolve(out, file[0].substring(resolve(src).length + 1));
    await ensureFile(fileOut);
    await copy(file[0], fileOut, { overwrite: true, preserveTimestamps: true });
    progress++;
  }
  Deno.stdout.writeSync(
    new TextEncoder().encode(
      `\x1b[1K\r[${toCopy.length}/${toCopy.length}] Operation completed in ${
        (performance.now() - startTime) / 1000
      }s\n`,
    ),
  );
}

main(Deno.args);
