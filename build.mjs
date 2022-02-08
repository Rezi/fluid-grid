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
  MAX_ROWSPAN: 5,
  MAX_CONTAINER_WIDTH: 0,
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
  )} in pixels? ${chalk.magentaBright.italic(
    `(Recommended ${DEFAULTS.COLUMN_WIDTH})`
  )}
   `
);

const gapWidth = await question(
  `
2) What is base ${chalk.yellow(
    'width of grid gap'
  )} in pixels? (default gap is 0 * gapWidth) ${chalk.magentaBright.italic(
    `(Recommended ${DEFAULTS.GRID_GAP})`
  )}
   `
);

const maxCollspan = await question(
  `
3) Across how many columns spans the widest element in the grid? ${chalk.magentaBright.italic(
    `(Recommended ${DEFAULTS.MAX_COLSPAN})`
  )}
   `
);

const maxRowspan = await question(
  `
4) Across how many rows spans the highest element in the grid? ${chalk.magentaBright.italic(
    `(Recommended ${DEFAULTS.MAX_ROWSPAN})`
  )}
   `
);

const useSolidN = await question(
  `
5) Do you want to use .f-grid-soli-N classes? ${chalk.magentaBright.italic(
    'y/n'
  )}
   ${chalk.blueBright.italic(
     'Beware this will significantly increase size of generated CSS (5-15 times)'
   )}
  `
);

let maxContainerSize = DEFAULTS.MAX_CONTAINER_WIDTH;

if (useSolidN === 'y') {
  const responseMaxWidth = await question(
    `
  5) What will be maximum ${chalk.yellow(
    'width in px'
  )}  of the widest ${chalk.yellow(
      '.f-grid-solid-N'
    )} grid? ${chalk.magentaBright.italic('(Recommended 1280)')}
    `
  );

  maxContainerSize = parseInt(responseMaxWidth);
}

const replacePairs = [
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
    '$max-rowspan: 5;',
    `$max-rowspan: ${parseInt(maxRowspan) || DEFAULTS.MAX_ROWSPAN};`,
  ],
  [
    '$minimal-column-width: 60px;',
    `$minimal-column-width: ${parseInt(columnWidth) || COLUMN_WIDTH}${
      units || DEFAULTS.UNITS
    };`,
  ],
  ['$widest-grid-element: 1280;', `$widest-grid-element: ${maxContainerSize};`],
];

const gridScssContentReplaced = replaceTexts(gridScssText, replacePairs);

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
