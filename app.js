const https = require('https');
const fs = require('fs');

const prefix = 'https://api.github.com/';
const repos = 'repos/';
const repositories = 'repositories/';
const postfix = '/releases/latest';

let inputJSON = fs.readFileSync('mods.json');
let modList = JSON.parse(inputJSON);
let result = []

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}

modList.mods.forEach(mod => 
  https.get(`${prefix}${!isNumeric(mod.gitPath) ? repos : repositories}${mod.gitPath}${postfix}`, { headers: { 'User-Agent' : 'DeadlyKitten/MonkeModInfo' ,'Authorization': `Token ${process.env.SECRET}`}},(res) => {
    let body = "";

      res.on("data", (chunk) => {
          body += chunk;
      });

      res.on("end", () => {
          try {
            let json = JSON.parse(body);
            result.push({
              'name': mod.name,
              'author': mod.author,
              'version': json.tag_name.replace(/[^\d\n,.]/g,''),
              'dependencies': mod.dependencies,
              'dependents': mod.dependents,
              'install_location': mod.installPath,
              'git_path': mod.gitPath,
              'group': mod.group,
              'download_url': json.assets[mod.releaseId].browser_download_url
            });
          } catch (error) {
              console.error(mod.gitPath);
              console.error(error.message);
          };
    });
}));

let attempts = 0;
let timeout = 20;
let interval = setInterval(() => {
  if (result.length === modList.mods.length || attempts > timeout) {

    result.sort(function(a,b) {
      if (a.name === b.name) return 0;
      return (a.name > b.name) ? 1 : -1;
    });

    fs.writeFileSync('modinfo.json', JSON.stringify(result, null, 2));

    clearInterval(interval);
  } else {
    attempts++;
  }
}, 100);
