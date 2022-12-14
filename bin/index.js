#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')
const { readFileSync } = require('fs');
const { exec } = require('child_process');

const argv = yargs(hideBin(process.argv)).argv;

let level;

if (argv.p || argv.patch) {
  level = 2;
} else if (argv.m || argv.minor) {
  level = 1;
} else if (argv.M || argv.Major) {
  level = 0;
}


// switch (argv.level) {
//   case 'patch':
//     level = 2;
//     break;
//   case 'minor':
//     level = 1
//     break;
//   case 'major':
//     level = 0;
//     break;
// }

const newStage = argv?.stage || argv?.s

const package = JSON.parse(readFileSync(process.cwd().replace(/\\/g, '/') + '/package.json').toString());

const arr = package.version.split(/[\.-]/g);

if(arr.length === 3) {
  arr[3] = null;
}
if (argv.rc) {
  let num = arr[arr.length - 1]? +arr[arr.length - 1].replace(/[a-zA-Z]/g, '') : 0;
  arr[arr.length - 1] = 'rc' + (++num);
} else {
  for (let i = arr.length -2 ; i >= 0; i--) {
    if (level !== i) {
      arr[i] = 0;
    } else {
      ++arr[i]
      break;
    }
  }
}

const newVersion = argv.rc ? `${arr[0]}.${arr[1]}.${arr[2]}-${arr[3]}` : `${arr[0]}.${arr[1]}.${arr[2]}${newStage ? '-' + newStage : ''}`
exec(`yarn version --new-version ${newVersion}`, (error, stdout, stderr) => {
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

