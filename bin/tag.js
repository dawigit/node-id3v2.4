#! /usr/bin/env node
//const nodeID3v2 = require('node-id3v2.4');
const nodeID3v2 = require('../index.js');
const os = require('os');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const util = require('util');
const home = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
var path = require('path');
const ndir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + path.normalize('/.nodeID3v2/');
if(!fs.existsSync(ndir))fs.mkdirSync(ndir);
const status = fs.existsSync(`${ndir}.config.json`)?JSON.parse(fs.readFileSync(`${ndir}.config.json`, 'utf-8')):{};

var options = {};

options.filename = "";
options.extractpictures = 0;
options.convertpictures = 0;
options.backupheader = 0;
options.targetversion = 0;  // id3v2.(3/4) 0=don't touch
options.encoding = 3; // utf-8
options.noencodingoverride = 1; // keep encoding from frame
options.opa = [];

aaargh = {
    "-d": ["enable debug",["debug",1]],
    "-1": ["read 1 file, then exit (used with options '-lp'/'-c')",["testsingle",1]],
    "-l": ["list tag frames",["list",1]],
    "-lp": ["-lp <'path'> : read all files (recursive) from path (uses 'find')",["lp",1]],
    "-log": ["log output",["log",1]],
    "-c": ["continue from last read file (uses with option '-lp')",["continue",1]],
    "-u": ["update/write tag in file",["update",1]],
    "-xp": ["-xp [<'path'>] : extract pictures from tag (to 'path')",["extractpictures",1],["opa",["pxpath"]]],
    "-cp": ["-cp [<'destination type'>] : convert pictures from tag (e.g. -cp 'png'), needs 'imagemagic'",["convertpictures",1],["opa",["pdest"]]],
    "-fp": ["try to fix pictures in tag",["fixpicture"],1],
    "-tv3": ["ID3 target version : ID3v2.3",["targetversion",3]],
    "-tv4": ["ID3 target version : ID3v2.4",["targetversion",4]],
    "-bu": ["-bu [<'tagfile'>] : backup tag (to 'tagfile'.hbin)",["backuptag",1],["opa",["butagfile"]]],
    "-re": ["-re [<'tagfile'>] : restore tag (from 'tagfile'.hbin)",["restoretag",1]],
    "-RT": ["completely remove ID3 tag", ["removetag",1]],
    "-neo": ["keep encoding of text in frames as it is (default)",["noencodingoverride",1]],
    "-te": ["-te <(0|1|2|3)>: target encoding ['ISO-8859-1','UTF-16','UTF-16BE','UTF-8'(default)]",["opa",["encoding"]]],
    "-tag": ["-tag <'tagfile'> : add a tag from 'tagfile'", ["addtag",1],["opa",["tagfile"]]],
    "-ct": ["-ct [<version>,<flags>] : create a new tag", ["createtag",1],["opa",["version"]],["opa",["flags"]]],
    "-af": ["-af <'framename',data<,data>...> : add a frame to tag (e.g. -af title,'some title')",["addframe",1],["opaa",1],["opa",["addframes"]]],
    "-RF": ["-RF <'framename'> : remove frame from tag",["removeframe",1],["opaa",1],["opa",["removeframes"]]],
    "-?": [["-? [<'topic'>,<'subtopic'>] : get help (on topic)"],["help",1],["opa",["helptopic","subtopic"]]],
    "-h": [["-h [<'topic'>,<'subtopic'>] : get help (on topic)"],["help",1],["opa",["helptopic","subtopic"]]]
};
helptopics = {
  picturetype: [1,"getAPICTypes"],
  frametype: [2,"getFrameTemplate",options[""]]
}

function help(){
  usage();
  for(i of Object.keys(aaargh)){
    console.log(`${(" "+i+"     ").substring(0,6)}: ${aaargh[i][0]}`);
  }
  console.log(`${os.EOL}Bug reports to: 'dawi@online.de'`);
}
function usage(){
  console.log(`${os.EOL}usage: tag.js <-switch [argument]|<argument>...>... 'mediafilename'`)
}
if(process.argv.length == 2){
  help();
  return;
}
var error = 0;
process.argv.forEach(function (e,i,a) {
  if(i < 2 || error)return;
  if(aaargh[e]){
    options.opa = [];
    for(let i=1;i<aaargh[e].length;i++){
      options[aaargh[e][i][0]]=aaargh[e][i][1];
      /*if(aaargh[e][i][0] == "opa"){
        options[aaargh[e][i][0]]=aaargh[e][i][1];
        //options[aaargh[e][i][0]].push(aaargh[e][i][1]);
      }else{
        options[aaargh[e][i][0]]=aaargh[e][i][1];
      }*/
    }
  }else{
    if(options.opa.length){
      if(i == a.length-1 && !options.help){
        options.filename = e;
        e = "";
      }
      if(options.opaa){
        let o = options.opa.shift();
        options[o]?options[o].push(e):options[o]=[e];
        options.opaa = 0;
      }else{
        options[options.opa.shift()] = e;
      }
    }else{
      //if(e == "-?" || e == "-h" || e == "--help" ){help();return;}
      if(e[0] == "-"){
        console.log(`aaargh! unknown argument: '${e}'`);
        error = 1;
        return;
      }
      options.filename = e;
    }
  }
  return;
});
if(error)return;
if(options.help){
  if(helptopics[options.helptopic]){
    if(helptopics[options.helptopic][0] == 0)console.log(helptopics[options.helptopic][1]);
    if(helptopics[options.helptopic][0] == 1)console.log(nodeID3v2[helptopics[options.helptopic][1]]());
    if(helptopics[options.helptopic][0] == 2){
      let a = nodeID3v2[helptopics[options.helptopic][1]](options.subtopic);
      if(!a)return;
      console.log(os.EOL);
      for(let i of a)console.log(i);
    }
  }else{
    help();
  }
}
if(options.encoding && isNaN(options.encoding)){
  console.log("encoding: [0-3]");
  return;
}else{
  options.encoding=parseInt(options.encoding);
  if(options.encoding < 0 || options.encoding > 3){
    console.log("encoding: [0-3]");
    return;
  }
}
if(options.lp){
  exec(`find "${options.filename}" -type f -iname "*.mp3"`,{maxBuffer: 1024 * 1024 * 256},  (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    for(let filename of stdout.split(os.EOL)){
      if(options.continue && filename != status.lastfile){continue;}else{options.continue=0;}
      test(filename);
      if(options.testsingle)return;
    }
  });
  return
}

if(options.continue){
  if(!status.lastfile){
    console.log(`no 'lastfile' found in '${ndir}.config.json'`);
    return;
  }else{
    options.filename = status.lastfile;
  }
}
if(options.filename){
  test(options.filename);
  return;
}




function test(filename){
  if(!filename){
    console.log("missing 'filename'");
    usage();
    return;
  }
  if(!fs.existsSync(filename)){
    console.log(`given filename '${filename}' doesn't exist`);
    usage();
    return;
  }
  status.lastfile=filename;
  fs.writeFileSync(`${ndir}.config.json`, JSON.stringify(status, null, 2));
  if(options.debug){debugger;}
  if(options.addtag)nodeID3v2.addTagFromFile(filename,options);
  var tag;
  if(options.createtag){
      tag = nodeID3v2.createTag(filename,options);
  }else{
      tag = nodeID3v2.readTag(filename,options);
  }

  if(tag.iserror)return;
  if(options.backuptag)tag.backupTag(options.butagfile);
  if(options.extractpictures)tag.extractPictures(options.pxpath);
  if(options.convertpictures)tag.convertPictures(options.pdest);
  if(options.restoretag)tag.restoreTag();
  if(options.removetag)tag.removeTag();
  if(options.addframe || options.removeframe){
      for(af of (options.addframe?options.addframes:options.removeframes)){
        let a = [],i=0,qon=0;
        while(af.length){
          if(af[i]=="\"")qon^=1;
          if(!qon && ( af[i]=="," || i == af.length)){
            a.push(af.substr(0,i));
            if(i == af.length-1 && af[i]==",")a.push("");
            af = af.substr(i+1);
            i = -1;
          }
          i++;
        }
        let t = a.shift(),e;
        options.addframe?e=tag.addFrame(t,a):e=tag.removeFrame(t,a);
        if(e && e.iserror)console.log(`[${e.type}] : ${e.msg}`);
      }
  }
  if(options.update)tag.write();
  if(options.list)tag.list();
  if(options.log)tag.log();

}


function cli(o){
  console.log(util.inspect(o,{depth: null}));
}
