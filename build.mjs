#! /usr/bin/env node --experimental-modules

import * as path from 'path';

import { $, chalk, fs, question } from 'zx';

import cssnano from 'cssnano';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import sass from 'sass';
import which from 'which';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULTS = {
  GRID_GAP: 16,
  UNITS: 'px',
  COLUMN_WIDTH: 60,
  MAX_COLSPAN: 10,
};

$.verbose = true;

function exitWithError(errorMessage) {
  console.error(`
${chalk.red(errorMessage)}`);
  process.exit(1);
}

async function checkRequiredProgramsExist(programs) {
  try {
    for (let program of programs) {
      await which(program);
    }
  } catch (error) {
    exitWithError(`Error: Required command ${error.message}`);
  }
}

async function readGridScss(directory, filename) {
  const gridScssPath = `${directory}/${filename}`;

  return await fs.readFile(gridScssPath);
}

async function createAndWriteGrid(directory, contents) {
  const filepath = `${directory}/fluid-grid.css`;

  await fs.writeFile(filepath, contents);
}

function replaceTexts(text, pairs) {
  return pairs.reduce((changedText, pair) => {
    return changedText.replace(pair[0], pair[1]);
  }, text);
}

await checkRequiredProgramsExist(['node', 'npx']);

const targetDirectory = path.resolve(__dirname, 'src/scss');

if (!(await fs.pathExists(targetDirectory))) {
  exitWithError(`Error: Grid directory '${targetDirectory}' does not exist`);
}

const gridScssContent = await readGridScss(targetDirectory, 'grid.scss');
const gridScssText = gridScssContent.toString();

console.log(
  chalk.green.underline(`
WELCOME TO FULID-GRID BUILD TOOL
`)
);

/* const units = await question(chalk.yellow(`What css units do you want to use (rem, px, em)?`), {
	choices: ['rem', 'px']
}); */

const units = 'px';
const columnWidth = await question(
  `1) What is minimal ${chalk.yellow(
    'width of one column'
  )} in pixels? ${chalk.magentaBright.italic('(Recommended 60)')}
   `
);

const gapWidth = await question(
  `
2) What is base ${chalk.yellow(
    'width of grid gap'
  )} in pixels? ${chalk.magentaBright.italic('(Recommended 16)')}
   `
);

const maxCollspan = await question(
  `
3) Across how many columns spans the widest element in the grid? ${chalk.magentaBright.italic(
    '(Recommended 10)'
  )}
   `
);

const gridScssContentReplaced = replaceTexts(gridScssText, [
  [
    '--grid-gap: 16px;',
    `--grid-gap: ${parseInt(gapWidth) || DEFAULTS.GRID_GAP}${
      units || DEFAULTS.UNITS
    };`,
  ],
  [
    '$max-colspan: 10;',
    `$max-colspan: ${parseInt(maxCollspan) || DEFAULTS.MAX_COLSPAN};`,
  ],
  [
    '$grid-col-width: 60px;',
    `$grid-col-width: ${parseInt(columnWidth) || COLUMN_WIDTH}${
      units || DEFAULTS.UNITS
    };`,
  ],
]);

console.log(
  chalk.green.underline(`
BUILDING ...
`)
);

const compiledCss = sass.compileString(gridScssContentReplaced);

console.log(
  chalk.green.underline(`OPTIMIZING ...
`)
);

const postprocessedCss = await postcss([cssnano]).process(compiledCss.css, {
  from: undefined,
  to: undefined,
});

createAndWriteGrid(path.resolve(''), postprocessedCss.css);

console.log(`DONE :) Find your file in ${path.resolve('')}/${chalk.yellow(
  `fluid-grid.css`
)}
`);

await $`exit 0`;
