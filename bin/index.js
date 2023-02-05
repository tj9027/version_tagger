#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const { readFileSync } = require('fs');
const { exec } = require('child_process');

const argv = yargs(hideBin(process.argv)).options({
  'patch': {
    alias: 'p',
    describe: 'apply a patch increment to the current version'
  },
  'minor': {
    alias: 'm',
    describe: 'apply a minor increment to the current version'
  },
  'Major': {
    alias: 'M',
    describe: 'apply a Major increment to the current version'
  },
  'stage': {
    alias: 's',
    describe: 'define the stage of the new version',
    choices: ['production', 'prod', 'development', 'dev', 'staging', 'stag']
  },
  'release': {
    alias: 'r',
    describe: 'flag as release or candidate',
    choices: ['release', 'r', 'release-candidate', 'rc']
  },
  'preserve': {
    alias: ['load', 'pre'],
    describe: 'preserve stage'
  },
  'message': {
    describe: 'message to attach to git tag (must not contain pending "-" in between or end of words)'
  }
}).conflicts({
  preserve: 'stage',
  stage: 'preserve',
  release: 'preserve',
  preserve: 'release',
  p: 'release',
  m: 'release',
  M: 'release'
}).argv;

let level;
if (argv.patch) {
  level = 2;
} else if (argv.minor) {
  level = 1;
} else if (argv.Major) {
  level = 0;
}

let package = null;

try {
  package = JSON.parse(readFileSync(process.cwd().replace(/\\/g, '/') + '/package.json').toString());

  const arr = package.version.split(/[\.-]/g);

  const currentStage = arr.splice(3)

  if (arr.length === 3) {
    arr[3] = null;
  }
  let release;
  switch (argv.release) {
    case "release":
    case 'r':
      release = 'release'
      break;
    case 'rc':
    case 'release-candidate':
      release = 'rc'
      break;
  }

  if (release === 'rc') {
    let num = currentStage.find((el)=>el.includes('rc')).replace(/[a-zA-Z]/g, '') || 0;

    arr[arr.length - 1] = 'rc' + (++num);
  } else {
    for (let i = arr.length - 2; i >= 0; i--) {
      if (level !== i) {
        arr[i] = 0;
      } else {
        ++arr[i]
        break;
      }
    }
  }
  const baseNewVersion = `${arr[0]}.${arr[1]}.${arr[2]}`;

  let newVersion = baseNewVersion

  if (argv.stage) {
    newVersion += `-${argv.stage}`
  }

  if (argv.release) {
    newVersion += `-${release === 'rc' ? arr[3] : release}`
  }

  if (!argv.stage && !argv.release && argv.preserve && currentStage.length > 0) {
    newVersion += `-${currentStage.join('-')}`;
  }

  exec(`yarn version --new-version ${newVersion} ${argv.message ? `--message '${argv.message.split(' ').join('-')}'` : ''}`, (error, stdout, stderr) => {
    if (error) {
      console.log(error);
      return;
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`)
      return;
    }

    console.log(`stdout: ${stdout}`);

    if (argv.push) {
      exec(`git push`, (error, out, err) => {
        if (error) {
          console.log(error)
        }
        if (err) {
          console.log(`stderr: ${err}`)
          return;
        }
        console.log(`stdout: ${out}`)
      })
    }
  })
} catch (err) {
  console.log(err);
  // console.error('No package.json found.')
}
