#!/usr/bin/node
const nodeID3v2 = require('node-id3v2.4');
const os = require('os');
const fs = require('fs-extra');
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const util = require('util');
const status = fs.existsSync('./.config.json')?JSON.parse(fs.readFileSync('./.config.json', 'utf-8')):{};
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
    "-d": [["debug",1]],
    "-1": [["testsingle",1]],
    "-l": [["list",1]],
    "-ld": [["log",1]],
    "-log": [["log",1]],
    "-c": [["continue",1]],
    "-u": [["update",1]],
    "-xp": [["extractpictures",1],["opa",["pxpath"]]],
    "-cp": [["convertpictures",1],["opa",["pdest"]]],
    "-fp": [["fixpicture"],1],
    "-tv3": [["targetversion",3]],
    "-tv4": [["targetversion",4]],
    "-bu": [["backuptag",1]],
    "-re": [["restoretag",1]],
    "-RT": [["removetag",1]],
    "-neo": [["noencodingoverride",1]],
    "-te": [["opa",["encoding"]]],
    "-tag": [["addtag",1],["opa",["tagfile"]]],
    "-af": [["addframe",1],["opaa",1],["opa",["addframes"]]],
    "-RF": [["removeframe",1],["opaa",1],["opa",["removeframes"]]]
};
process.argv.forEach(function (e,i,a) {
  if(i<2)return;
  if(aaargh[e]){
    for(a of aaargh[e]){
      options[a[0]]=a[1];
    }
  }else{
    if(options.opa.length){
      if(options.opaa){
        let o = options.opa.shift();
        options[o]?options[o].push(e):options[o]=[e];
        options.opaa = 0;
      }else{
        options[options.opa.shift()] = e;
      }
    }else{
      options.filename = e;
    }
  }
  return;
  switch(e){
    case "-d":
      options.debug = 1;
      break;
    case "-1":
      options.testsingle = 1;
      break;
    case "-l":
      options.list = 1;
      break;
    case "-ld":
      options.list = 1;
      options.dir = 1;
      opa = ["directory"];
      break;
    case "-log":
      options.log = 1;
      break;
    case "-c":
      options.continue = 1;
      break;
    case "-u":
      options.update = 1;
      break;
    case "-xp":
      options.extractpictures = 1;
      opa = ["pxpath"]
      break;
    case "-cp":
      options.convertpictures = 1;
      opa = ["pdest"]
      break;
    case "-fp":
      options.fixpicture = 1;
      break;
    case "-tv3":
      options.targetversion = 3;
      break;
    case "-tv4":
      options.targetversion = 4;
      break;
    case "-bu":
      options.backuptag = 1;
      break;
    case "-re":
      options.restoretag = 1;
      break;
    case "-RT":
      options.removetag = 1;
      break;
    case "-neo":
      options.noencodingoverride = 1;
    case "-te":
      if(options.noencodingoverride){
        console.log("can't use -te and -neo");
        break;
      }
      opa = ["encoding"];
      break;
    case "-add":
      opa = ["tagfile"];
      options.addtag = 1;
      break;
    case "-af":
      opa = ["addframes"];
      opaa = 1;
      options.addframe = 1;
      break;
    case "-RF":
      opa = ["removeframes"];
      opaa = 1;
      options.removeframe = 1;
      break;
    default:
      if(opa.length){
        if(opaa){
          let o = opa.shift();
          options[o]?options[o].push(e):options[o]=[e];
          opaa = 0;
        }else{
          options[opa.shift()] = e;
        }
      }else{
        options.filename = e;
      }
  }
});
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
if(options.dir){
  exec(`find "${options.directory}" -type f -iname "*.mp3"`,{maxBuffer: 1024 * 1024 * 256},  (error, stdout, stderr) => {
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
    console.log("no 'lastfile' found in './.config.json'");
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
  if(!filename){return;}
  status.lastfile=filename;
  fs.writeFileSync('./.config.json', JSON.stringify(status, null, 2));
  if(options.debug){debugger;}
  if(options.addtag)nodeID3v2.addTagFromFile(filename,options);

  var tag = nodeID3v2.read(filename,options);
  if(tag == -1)return;
  if(options.backuptag)tag.backupTag();
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
