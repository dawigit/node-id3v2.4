const fs = require('fs');
const iconv = require("iconv-lite");
const util = require('util');
const zlib = require('zlib');
const execSync = require('child_process').execSync;
const os = require('os');
const home = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE);
const ndir = `${home}/.nodeID3v2/`;
if(!fs.existsSync(ndir))fs.mkdirSync(ndir);
module.exports = new NodeID3v2;
// options
const STRICTMODE = 1;
const AUTOCONVERTGENRE = 1;
const LOGGING = 0;
const DEEPSEARCH = 0;
const RELOAD = 1;

const ENC_ISO88591 =  0x00;
const ENC_UTF16 =     0x01;
const ENC_UTF16BE =   0x02;
const ENC_UTF8 =      0x03;

var ENC_DEF = ENC_UTF8;

const BLOCKSIZE = 512;

const ID3v2_3 = 3;
const ID3v2_4 = 4;
const ID3v2_default = ID3v2_4;
// lengths / offsets (offsets are relative to tag start position)
// tag
const ID3TAG_LEN_HEADER = 10;
const ID3TAG_VERSION_MAJOR = 3;
const ID3TAG_VERSION_MINOR = 4;
const ID3TAG_FLAGS = 5;
const ID3TAG_SIZE = 6;
// extended tag
const ID3ETAG_SIZE = 0;
const ID3ETAG_NUMBEROFFLAGS = 4; // this position should allways contain 0x01 as value
const ID3ETAG_FLAGS = 5;
const ID3ETAG_LEN_HEADER = 6;
const ID3ETAG_LEN_CRC = 5;
const ID3ETAG_LEN_RESTRICTIONS = 1;
// flags
const ID3_EXTENDEDTAGHEADER = 0b01000000;
const ID3_CRC = 0b00100000;
const ID3_RESTRICTIONS = 0b00010000;
// frame
const ID3_FID = 0;
const ID3_FSIZE = 4;
const ID3_FSTATUS = 8; //('flags')
const ID3_FFORMAT = 9;
// lenghts
const ID3_FLEN_ID = 4;
const ID3_FLEN_SIZE = 4;
const ID3_FLEN_FLAGS = 2;
const ID3_FLEN = 10;
const ID3_LEN_ENCODING = 1;
// frames, generic
const ID3_ENC = 0;
const ID3_LENC = 1;
const ID3_LLANG = 3;
// 'TEXT' frames
const ID3_FTEXT_ENC = 0;
const ID3_FTEXT_DATA = 1;
// 'APIC' frames
const ID3_FAPIC_ENC = 0;
const ID3_FAPIC_MIME = 1;
// 'COMM' frames
const ID3_FCOMM_ENC = 0;
const ID3_FCOMM_LANG = 1;
const ID3_FCOMM_DATA = 4;
// 'USER' frames
const ID3_FUSER_ENC = 0;
const ID3_FUSER_LANG = 1;
const ID3_FUSER_DATA = 4;
// 'WXXX' frames
const ID3_FWXXX_ENC = 0;
// 'GEOB' frames
const ID3_FGEOB_ENC = 0;
const ID3_FGEOB_MIME = 1;
// 'SYLT' frames
const ID3_FSYLT_ENC = 0;
const ID3_FSYLT_LANG = 1;
const ID3_FSYLT_TIMESTAMPFORMAT = 4;
const ID3_FSYLT_CONTENTTYPE = 5;
const ID3_FSYLT_CONTENTDESC = 6;

// frame 'FLAGS'

// flags (1) status
const ID3_FFLAG_A = 64; // 'tag alter preservation'
const ID3_FFLAG_B = 32; // 'file alter preservation'
const ID3_FFLAG_C = 16; // 'read only'
const ID3_FFLAG_VALID_STATUS = 0b0111000;
// flags (2) format
const ID3_FFLAG_P = 1;  // 'data length indicator'
const ID3_FFLAG_N = 2;  // 'unsynchronisation'
const ID3_FFLAG_M = 4;  // 'encryption'
const ID3_FFLAG_K = 8;  // 'compression'
const ID3_FFLAG_H = 64; // 'grouping identity'
const ID3_FFLAG_VALID_FORMAT = 0b01001111;

/**
 * Frame - Creates an 'ID3-Frame' by reading a buffer of id3 tag data
 *
 * @param {Buffer} b Buffer (id3 tag 'data')
 * @param {Number} o Offset in the Buffer
 * @param {Object} p Parent Object (-> the id3 tag)
 * @returns {Frame} frame.type is set to -1 if no frame was wound
 *  frame.type is set to 0 if a malformed (in some way) frame was found,
 *  which cannot be repaired/used, but with a valid  framesize!(->offset next frame)
 */
function Frame(arga){
  var FT2_4 = ["AENC", "APIC", "ASPI",  "COMM", "COMR",  "ENCR", "EQU2", "ETCO",  "GEOB", "GRID",  "LINK",  "MCDI", "MLLT",  "OWNE",  "PRIV", "PCNT", "POPM", "POSS",  "RBUF", "RVA2", "RVRB",  "SEEK", "SIGN", "SYLT", "SYTC",  "TALB", "TBPM", "TCOM", "TCON", "TCOP", "TDEN", "TDLY", "TDOR", "TDRC", "TDRL", "TDTG", "TENC", "TEXT", "TFLT", "TIPL", "TIT1", "TIT2", "TIT3", "TKEY", "TLAN", "TLEN", "TMCL", "TMED", "TMOO", "TOAL", "TOFN", "TOLY", "TOPE", "TOWN", "TPE1", "TPE2", "TPE3", "TPE4", "TPOS", "TPRO", "TPUB", "TRCK", "TRSN", "TRSO", "TSOA", "TSOP", "TSOT", "TSRC", "TSSE", "TSST", "TXXX",  "UFID", "USER", "USLT",  "WCOM", "WCOP", "WOAF", "WOAR", "WOAS", "WORS", "WPAY", "WPUB", "WXXX"]
  let FO = 0;
  const FO_ENC = FO++; // numeric (encoding [0-3])
  const FO_TE = FO++; // string : text (with) encoding
  const FO_T = FO++; // string : text (encoding 0)
  const FO_NB = FO++; // numeric (byte)
  const FO_NW = FO++; // numeric (word) = (2bytes)
  const FO_NBMM = FO++; // numeric (byte), min, max (0x00 - 0xff)
  const FO_BP = FO++; // string containing path to binary
  const FO_L = FO++; // language code (3 characters)
  var FrameTeplateEmpty = [
    ENC_DEF,"","",0,0,0,"","XXX"
  ];
  var FrameTemplates = [
    [["AENC"],,[],[[FO_NW,"previewstart"],[FO_NW,"previewlength"],[FO_BP,"bin"]]],
    [["APIC","picture","image"],fixPicture,[[4,2],[4,2,3]],[[FO_ENC,"encoding"],[FO_T,"mime"],[FO_NBMM,0x00,0x14,"picturetype"],[FO_TE,"description"],[FO_BP,"picture"]]],
    [["ASPI"]],
    [["COMM","comment"],,[[2,3],[2,3,1]],[[FO_ENC,"encoding"],[FO_L,"language"],[FO_TE,"description"],[FO_TE,"text"]]],
    [["COMR"]],
    [["ENCR"],,[],[[FO_T,"owner"],[FO_NBMM,0x80,0xf0],[FO_BP,"bin"]]],
    [["EQU2"]],
    [["TPE1","artist"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TIT2","title"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TALB","album"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TCON","genre"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TRCK","track"],checkTracknumber,[],[[FO_T,"text"]]],
    [["TPUB","label"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TDRL","date","year"],checkDate,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["TXXX","text"],,[[1,2]],[[FO_ENC,"encoding"],[FO_TE,"description"],[FO_TE,"text"]]],
    [["WXXX"],,[[1,2]],[[FO_ENC,"encoding"],[FO_TE,"description"],[FO_T,"url"]]],
    [["PRIV"],,[],[[FO_T,"url"],[FO_BP,"bin"]]],
    [["USER"],,[[2]],[[FO_ENC,"encoding"],[FO_L,"language"],[FO_TE,"text"]]],
    [["USLT"],,[[3],[2,3],[2,3,1]],[[FO_ENC,"encoding"],[FO_L,"language"],[FO_TE,"description"],[FO_TE,"ulyrics"]]],
    [["UFID"],,[],[[FO_T,"owner"],[FO_BP,"id"]]],
    [["T"],,[[1]],[[FO_ENC,"encoding"],[FO_TE,"text"]]],
    [["W"],,[[1]],[[FO_T,"text"]]]
  ];

  Frame.prototype.createFrame = function(t,fd,p){
    this.parent = p;
    this.type = -1;
    this.error = {iserror: 0};
    this.data = {};
    this.flags_status = 0;
    this.flags_format = 0;
    for(ft of FrameTemplates){
        if( (ft[0].includes(t) && ft[0][0].length > 1) || (ft[0][0].length == 1 && ft[0][0] == t[0]) ){ // check for frame name/'friendly name'
          if(ft[0][0].length != 1) t = ft[0][0];
          let short;
          for(shorts of ft[2]){
            if(shorts.length == fd.length){
              short=shorts;
              break;
            }
          }
          if(!short && fd.length < ft[3].length){
            let need = [];
            if(ft[2]){
              for(let i of ft[2][0])need.push(ft[3][i][ft[3][i].length-1]);
            }else{
              for(let i of ft[3])need.push(i[i.length-1]);
            }
            return { iserror: 1, type: -1, msg: `insufficient arguments (${fd}). should be <${need}>`};
          }
          for(let i=0;i<ft[3].length;i++){  // commands
            let v;
            if(short){
              if(short.includes(i)){
                v = fd[short.indexOf(i)];
              }else{
                v = FrameTeplateEmpty[ft[3][i][0]];
              }
            }else{
              v = fd[i];
            }

            let td = ft[3][i];
            switch(td[0]){
              case FO_ENC:
                v = parseInt(v);
                if(v > 0 && v << 3)this.data[td[1]] = v;
                break;
              case FO_TE:
                this.data[td[1]] = v;break;
              case FO_T:
                this.data[td[1]] = v;break;
              case FO_NB:
                v = parseInt(v)&0xff;
                this.data[td[1]] = v;break;
              case FO_NW:
                v = parseInt(v)&0xffff;
                this.data[td[1]] = v;break;
              case FO_NBMM:
                v = parseInt(v)&0xff;
                if(v < td[1] || v > td[2]){
                  return { iserror: 1, type: -2, msg: `argument '${v}' out of  range [${td[1]}-${td[2]}]`};
                }
                this.data[td[3]] = v;break;
              case FO_BP:
                let fb = fs.readFileSync(v);
                if(!fb.length)return;
                this.data[td[1]] = fb;break;
              case FO_L:
                if(!language_codes.includes(v))return;
                this.data[td[1]] = v;break;
              default:
                debugger;
            }
          }
          this.type = t;
          if(ft[1]){
              this.data = ft[1](this.data);
              if(!this.data)return { iserror: 1, type: -3, msg: `argument '${v}' frame '${t}' data error`};
          }
          return this;
        }
    }
  }

  /**
   * log - Logs frame data depending on 'type' to console
   *
   * @param {number} [s=0] Default output is by 'util.inspect'. Short output by s!=0.
   *
   * @returns {}
   */
  Frame.prototype.log = function(s=0){
    if(s){
      var l = "";
      switch(this.type){
        case "TXXX":
          l = `(${this.data.encoding}) '${this.data.description}':'${this.data.text}'`;
          break;
        case "WXXX":
          l = `(${this.data.encoding}) '${this.data.description}':'${this.data.url}'`;
          break;
        case "APIC":
          l = `(${this.data.encoding})(${this.data.mime}) '${this.data.description}'(${this.data.picturetype}) / ${this.data.picture.length} b`;
          break;
        case "COMM":
          l = `(${this.data.encoding})(${this.data.language}) '${this.data.description}':'${this.data.text}'`;
          break;
        case "USER":
          l = `(${this.data.encoding})(${this.data.language}) '${this.data.text}'`;
          break;
        case "TCON":
          l = `'${getGenre(this.data.text)}'`;
          break;
        case "PRIV":
          l = `${this.data.url}`;
          break;

        /*case "":
          l = `${this.encoding}(${})${}${}`;
          break;*/
        default:
            if(this.type[0]=="T"){l = `(${this.data.encoding}) '${this.data.text}'`;break;}
            if(this.type[0]=="W"){l = `(${this.data.encoding}) '${this.data.url}'`;break;}
            debugger;

      }
      if(s == 2)return `[${this.type}]:${l}`;
      console.log(`[${this.type}]:${l}`);
    }else{
      console.log(`${this.type} : ${util.inspect(this.data,{depth: null})}`);
    }
  }

  /**
   * frameHeader - Description
   *
   * @param {String} t  4 character, upper case string containing a valid frame type
   * @param {Number} fs flags_status (0-255)
   * @param {Number} ff flags_fromat (0-255)
   *
   * @returns {Buffer} length = 10 bytes | 0 on error
   */
  Frame.prototype.frameHeader = function(t,fs,ff){
    if(frametypes.includes(t)){
      if(!( (fs&(~ID3_FFLAG_VALID_STATUS)) || (ff&(~ID3_FFLAG_VALID_FORMAT)) ) ){
        let b = Buffer.alloc(ID3_FLEN);
        b.write(t);
        b.writeUInt32BE(0,ID3_FSIZE);
        b.writeUInt8(fs,ID3_FSTATUS);
        b.writeUInt8(fs,ID3_FFORMAT);
        return b;
      }
    }else{
      return 0;
    }
  }
  /**
   * toBinary - creates a Buffer from Frame/String
   *
   * @param {Frame|[String,...]} f Frame or Array of Strings containing data
   *
   * @returns {Buffer} Buffer containing the whole Frame as binary data
   */
  Frame.prototype.toBinary = function(options){
    let f = this;
    //let h = f.frameHeader(f.type,f.flags_status,f.flags_format);
    let h = f.frameHeader(f.type,f.flags_status,0);
    if(options && options.encoding && !options.noencodingoverride){
      if(options.encoding > 0 && options.encoding < 4){
        if(options.targetversion == 3 && options.encoding > 1)options.encoding = 1;
        f.data.encoding = options.encoding;
      }else{
        debugger;
      }
    }

    if(h){
      var b = Buffer([]);
      switch(f.type){
        case "TXXX":
          b = b.ap(f.data.encoding).ap(f.data.description,f.data.encoding).ap(f.data.text,f.data.encoding,1);
          break;
        case "WXXX":
          b = b.ap(f.data.encoding).ap(f.data.description,f.data.encoding).ap(f.data.url,0,1);
          break;
        case "APIC":
          b = b.ap(f.data.encoding).ap(f.data.mime).ap(f.data.picturetype).ap(f.data.description,f.data.encoding).ap(f.data.picture);
          break;
        case "PRIV":
          b = b.ap(f.data.url).ap(f.data.bin);
          break;
        case "COMM":
          b = b.ap(f.data.encoding).ap(f.data.language,0,1).ap(f.data.description,f.data.encoding).ap(f.data.text,f.data.encoding,1);
          break;
        case "USER":
          b = b.ap(f.data.encoding).ap(f.data.language,0,1).ap(f.data.text,f.data.encoding,1);
          break;
        case "USLT":
          b = b.ap(f.data.encoding).ap(f.data.language,0,1).ap(f.data.description,f.data.encoding).ap(f.data.ulyrics,f.data.encoding,1);
          break;
        case "UFID":
          b = b.ap(f.data.owner).ap(f.data.id);
          break;

        default:
          if(f.type[0] == "T"){
            b = b.ap(f.data.encoding).ap(f.data.text,f.data.encoding,1);
            break;
          }
          if(f.type[0] == "W"){
            b = b.ap(f.data.url,0,1);
            break;
          }
          debugger;
      }
      if(f.flags_format & ID3_FFLAG_H)h.ap(f.groupingidentity);
      if(f.flags_format & ID3_FFLAG_K){b = zlib.deflate(b);
      }else if(f.flags_format & ID3_FFLAG_M){/* b = mcrypt(b)*/  }
      if(f.flags_format & ID3_FFLAG_N)b = unsychroniseBuf(b);
      let s;
      if(this.parent.version.major == ID3v2_4){
        s = encodeSize(b.length,4);
      }else{
        s = encodeSize(b.length,4,8);
      }
      s.copy(h,ID3_FSIZE);
      return Buffer.concat([h,b]);
    }else{
      return -1;
    }
  }

  Frame.prototype.extractPicture = function(fn){
    if(this.type == "APIC"){
      fs.writeFileSync(fn,this.data.picture);
    }
  }

  var b,o,p;
  if(arga[0] == 0){
    b = arga[1];
    o = arga[2];
    p = arga[3];
  }
  if(arga[0] == 1){
    return this.createFrame(arga[1],arga[2],arga[3]);
  }


  this.u = 0; // unsychronisation
  this.parent = p;  // parent object (id3 tag)
  this.offset = o;  // offset
  var zb; // decompression buffer
  this.type = String.fromCharCode(b[o])+String.fromCharCode(b[o+1])+String.fromCharCode(b[o+2])+String.fromCharCode(b[o+3]);
  if(!frametypes.includes(this.type)){
    this.type = -1;
    return;
  }

  if(this.parent.version.major == ID3v2_4){
    this.size = getSynchSafeSize(b,o+ID3_FSIZE);    // size of complete frame data (id3 v2.4: frame size IS sychsafe)
  }
  if(this.parent.version.major == ID3v2_3){
    this.size = getSize(b,o+ID3_FSIZE);    // size of complete frame data (id3 v2.3: frame size is NOT synchsafe)
  }

  if(!this.size)return;
  this.flags_status = b[o+ID3_FSTATUS];
  this.flags_format = b[o+ID3_FFORMAT];
  var od = 0;
  // checking for format flags
  if(this.flags_format & ID3_FFLAG_H){  // grouping identity
    this.groupingidentity = b[o+ID3_FLEN];
    od+=1;
  }

  if(this.flags_format & ID3_FFLAG_P){  // data length indicator
    this.datalengthindicator = getSynchSafeSize(b,o+od+ID3_FLEN);
    od+=4;
  }
  this.datalengthindicator?this.datasize=this.datalengthindicator:this.datasize=this.size;
  if(this.flags_format & ID3_FFLAG_N){  // (u)nsynchronisation
    this.u = 1;
  }
  if(this.flags_format & ID3_FFLAG_M){  // mcryption
    if(!(this.flags_format & ID3_FFLAG_P)){
      console.warn("WARNING: encryption flag without data length indicator flag");
      debugger;
    }
  }
  if(this.flags_format & ID3_FFLAG_K){  // kompression
    if(!(this.flags_format & ID3_FFLAG_P)){
      console.warn("WARNING: compression flag without data length indicator flag");
      debugger;
    }
  }

  let reloaded = false;
  // check if frame is incomplete (cut)
  if(b.length < o+ID3_FLEN+this.size){  //size of frame is out of buffer size / ?OUT OF DATA ERROR
    if(RELOAD){
      console.warn("WARNING: frame is truncated! Trying to reload.");
      let l = (this.size+ID3_FLEN)-(b.length-o);
      let brl = Buffer.alloc(l);
      debugger;
      if(this.parent.loadMore(brl, l, b.length ) < l){
      //if(arguments.callee.caller.prototype.loadMore(brl, l, b.length ) < l){
        console.warn("ERROR: couldn't reload frame");
        this.size = 0;  //mark frame as 'empty'
        return;
      }
      b = Buffer.concat([b,brl]);
      reloaded = true;
      this.parent.addReloads();
    }
  }
  // check next frame: no known frametype, next frame type NOT 0x00 (-> not padding)
  if((b.length > o+ID3_FLEN+this.size) && (!frametypes.includes(getFType(b,o+ID3_FLEN+this.size)) && getFType(b,o+ID3_FLEN+this.size).charCodeAt(0))){
    debugger;
    console.warn("WARNING: next frame of unknown type : maybe a size problem? (not synchsafe?)");
    //maybe size is not sychsafe encoded ?
    let nsss = getSize(b,o+ID3_FSIZE);
    if(nsss == this.size)nsss = getSynchSafeSize(b,o+ID3_FSIZE);
    if((b.length > o+ID3_FLEN+nsss) && (frametypes.includes(getFType(b,o+ID3_FLEN+nsss)) || !getFType(b,o+ID3_FLEN+nsss).charCodeAt(0))){
      console.warn("WARNING: probably fixed with 'resize'");
      //debugger;
      this.size = nsss;
    }//this.size = getSize(b,o+ID3_FSIZE);
  }
  var bu = Buffer.alloc(this.size-od);
  b.copy(bu,0,o+ID3_FLEN+od);

  if(this.u){   // apply deunsychronisation ?
    debugger;
    bu = deunsychroniseBuf(bu);
    if(this.datalengthindicator && bu.length != this.datalengthindicator){
      console.warn("WARNING: Size of data not correct after unsynchronisation (data length indicator)");
    }
  }

  if(this.flags_format & ID3_FFLAG_K){
    debugger;
    zb = zlib.inflateSync(bu);
    if(zb.length != this.datalengthindicator){
      console.log("WARNING: decompressed buffer length incorrect. (datalengthindicator)");
    }
    bu = zb;
  }else if(this.flags_format & 0xf0){ // compressed || high nibble set ? -> must be mistake or malformed frame
    if(this.flags_format & 0x80){
      debugger;
      console.warn("WARNING: unknown flag : bit 7 in format flag is set. might be compression ?");
      // let's try a few things here...
      if(bu.bindexOf("78") == 0){ // maybe zlib header first byte was found...
        zb = zlib.inflateSync(bu);
        if(this.datalengthindicator && zb.length == this.datalengthindicator){
          console.warn("Data found and decompressed!");
          bu = zb;
        }
      }
      if(bu.bindexOf("78") == 4){ // maybe zlib header first byte was found...
        let dli = getSynchSafeSize(bu,0,4);
        bu = bu.slice(4);
        zb = zlib.inflateSync(bu);
        if(zb.length == dli){
          console.warn("Data found and decompressed!");
          bu = zb;
        }
      }
    }else{
      debugger;
    }
  }

  this.data = {};
  if(this.type.charAt(0)=="T"){
    this.data.encoding = bu[ID3_FTEXT_ENC];
    // Text information frames
    if(this.type == "TXXX"){
      let desc = decodeBuf(bu,ID3_FTEXT_DATA,this.data.encoding,1);    // last argument: mode=1 (array of key,value as array)
      this.data.description = desc[0][0];
      this.data.text = desc[0][1];
    }else{  // Text information frame ("T000"-"TZZZ")
      this.data.text = decodeBuf(bu,ID3_FTEXT_DATA,this.data.encoding);
    }
    return;
  }
  if(this.type.charAt(0)=="W"){
    // Text information frames
    if(this.type == "WXXX"){
      this.data.encoding = bu[ID3_FWXXX_ENC];
      let desc = decodeBuf(bu,ID3_LEN_ENCODING,this.data.encoding,2);
      this.data.description = desc.data;
      let burl = Buffer.alloc(bu.length-(ID3_LEN_ENCODING+desc.length));
      bu.copy(burl,0,ID3_LEN_ENCODING+desc.length);
      this.data.url = decodeBuf(burl);
    }else{  // Text information frame ("T000"-"TZZZ")
      this.data.url = decodeBuf(bu,ID3_LEN_ENCODING);
    }
    return;
  }
  if(this.type == "APIC"){
    this.data.encoding = bu[ID3_FAPIC_ENC];  // encoding of of text 'description'
    moffset = bu.indexOf("image/");
    if(moffset < 0 || moffset > 16){
      if(bu[ID3_LENC]){
        this.data.mime = decodeBuf(bu,ID3_LENC);
        poffset = this.data.mime.length;
      }else{
        this.data.mime = "";
        poffset = 1;
        if(moffset>16){
            console.warn("WARNING: very suspicious offset of mime type string ('image/XXX')!");
            debugger;
        }
      }
    }else{
      poffset = bu.indexOf(0,moffset);
      var bm = Buffer.alloc(poffset-moffset);
      bu.copy(bm,0,moffset,poffset);
      this.data.mime = decodeBuf(bm);
      if(!this.data.mime){
        console.warn("WARNING: no mime type in 'APIC' frame");
      }
    }
    this.data.picturetype = bu[poffset+1];
    var desc = {};
    desc = decodeBuf(bu,poffset+2,this.data.encoding,2);
    this.data.description = desc.data;
    this.data.picture = Buffer.alloc(bu.length-(poffset+2+desc.length));
    if(this.data.picture.length < 32){
      console.warn(`WARNING: size of picture is ${this.data.picture.length} (<32) and probably faulty, discarding` );
      this.type = 0;
      return;
    }
    bu.copy(this.data.picture,0,poffset+2+desc.length);
    if(this.parent.options.fixpicture){
      this.data = fixPicture(this.data);
      if(!this.data){
        this.type = 0;
        return;
      }
    }

    //if(this.options.convertpictures){ }
    return;
  }
  if(this.type == "COMM"){
    this.data.encoding = bu[ID3_FCOMM_ENC];  // encoding of of text 'short content description' and 'full text'
    this.data.language = getLanguageCode(bu,ID3_FCOMM_LANG);
    if(this.data.language == -1)this.data.language="XXX";
    //let bf = bf.slice(ID3_FCOMM_DATA);
    let desc = decodeBuf(bu,ID3_FCOMM_DATA,this.data.encoding,3);
    this.data.description = desc[0];
    this.data.text = desc[1];
    return;
  }
  if(this.type == "USER"){
    this.data.encoding = bu[ID3_FUSER_ENC];  // encoding of of text 'short content description' and 'full text'
    let l = getLanguageCode(bu,ID3_FUSER_LANG);
    if(l == -1){
      debugger;
      console.warn("WARNING: language code error");
      this.data.language = "";
    }else{
      this.data.language = l;
    }
    //bf = bf.slice(ID3_FUSER_DATA);
    this.data.text = decodeBuf(bu,ID3_FUSER_DATA,this.data.encoding);
    return;
  }

  if(this.type == "PRIV"){
    this.data.url = decodeBuf(bu);
    this.data.bin = bu.slice(this.data.url.length+1);
    return;
  }
  if(this.type == "MCDI"){
    this.data.toc = bu;
    return;
  }
  if(this.type == "POPM"){
    this.data.user = decodeBuf(bu);
    let ul = this.data.user?this.data.user.length+1:1;
    this.data.rating = bu[ul];
    this.data.counter = bu.slice(ul+1);
    return;
  }
  if(this.type == "PCNT"){
    if(bu.length < 4){
      console.warn("WARNING: playcounter at frame 'PCNT' is less then 4 bytes");
    }
    this.data.counter = bu;
    return;
  }
  if(this.type == "GEOB"){
    this.data.encoding = bu[ID3_FGEOB_ENC];
    this.data.mime = decodeBuf(bu,ID3_FGEOB_MIME);
    bu = bu.slice(ID3_FGEOB_MIME+1+this.data.mime.length);
    let desc = decodeBuf(bu,0,this.data.encoding,2);
    this.data.filename = desc.data;
    bu = bu.slice(desc.length);
    desc = decodeBuf(bu,0,this.data.encoding,2);
    this.data.descrition = desc.data;
    bu = bu.slice(desc.length);
    this.data.bin = bu;
    return;
  }
  if(this.type == "UFID"){
    this.data.owner = decodeBuf(bu);
    bu = bu.slice(this.data.owner.length+1);
    if(bu.length > 64){
      console.warn("WARNING: 'UFID' binary id > 64 bytes");
    }
    this.data.id = bu;
    return;
  }
  if(this.type == "USLT"){
    this.data.encoding = bu[ID3_ENC];
    this.data.language = getLanguageCode(bu,ID3_LENC);
    let desc = decodeBuf(bu,ID3_LENC+ID3_LLANG,this.data.encoding,2);
    this.data.description = desc.data;
    bu = bu.slice(ID3_LENC+ID3_LLANG+desc.length);
    desc = decodeBuf(bu,0,this.data.encoding,2);
    this.data.ulyrics = desc.data;
    return;
  }
  if(this.type == "SYLT"){
    this.data.encoding = bu[ID3_FSYLT_ENC];
    this.data.language = getLanguageCode(bu,ID3_FSYLT_LANG);
    this.data.tsformat = bu[ID3_FSYLT_TIMESTAMPFORMAT];
    this.data.contettype = bu[ID3_FSYLT_CONTENTTYPE];
    let desc = decodeBuf(bu,ID3_FSYLT_CONTENTDESC,this.data.encoding,2);
    this.data.description = desc.data;
    bu = bu.slice(ID3_LENC+ID3_LLANG+desc.length);
    this.data.slyrics = bu;
    return;
  }
  if(this.type == "RVA2"){
    debugger;
    let ro = 0;
    this.data.identification = decodeBuf(bu);
    if(!this.data.identification)console.warn("WARNING: 'situation/device' is empty in frame 'RVA2' (relative volume adjustment)");
    this.data.adjustments = [];
    bu = bu.slice(this.data.identification.length?this.data.identification.length:1);
    while(ro + 4 < bu.length && (ro+4+Math.ceil(bu[ro+3]/7)) < bu.length){
      let setting = {};
      setting.channel = bu[ro+0];
      if(setting.channel > 8){console.warn("WARNING: channel > 8 in frame 'RVA2' (relative volume adjustment)");}
      setting.volumeadjustment = bu.readInt16BE(ro+1);
      setting.peakbits = bu[ro+3];
      if(setting.peakbits)setting.peakvolume = getSynchSafeSize(bu,4,Math.ceil(bu[ro+3]/7));
      this.data.adjustments.push(setting);
      ro+=4+Math.ceil(bu[ro+3]/7);
    }
    return;
  }
  debugger;
}


// helper functions
function getLanguageCode(b,o){
  let l = String.fromCharCode(b[o])+String.fromCharCode(b[o+1])+String.fromCharCode(b[o+2]);
  if(STRICTMODE){
    if(language_codes.indexOf(l.toLowerCase()) == -1){
      console.warn(`WARNING: '${l}' is NOT a language code!`);
      return "XXX";
    }
    if(l != "XXX" && l != l.toLowerCase()){
      console.warn(`WARNING: language codes should be lower case = ${l} -> ${l.toLowerCase()}!`);
      l = l.toLowerCase();
    }
  }
  return l;
}

function getFType(b,o){
  return String.fromCharCode(b[o])+String.fromCharCode(b[o+1])+String.fromCharCode(b[o+2])+String.fromCharCode(b[o+3]);
}

function getGenre(text){
  if(text.match(/\d+?/)){
    let id = text.match(/\d+?/)[0];
    if(id > 0 && id < genres.length)return genres[id];
  }else{
    return text;
  }
}

function getSize(buffer,offset=0,length=4){
  var a = 0;
  for(let i=0;i<length;i++){
    a+=((buffer[offset+length-i-1])<<(i*8));
  }
  return a;
}

function getSynchSafeSize(buffer,offset=0,length=4){
    a = [];
    for(let i=0;i<length;a.push(buffer[offset + i++])){}
    return decodeSize(a);
}

function decodeSize(size) {
    var a = 0;
    var sh = 7;
    for(let i in size){
      if(sh == 7 && (size[size.length-i-1] > 0x7f)){ // size is not synchsafe encoded!!!
        console.warn(`WARNING: size is not synchsafe encoded at frame with type ${getFType(arguments.callee.caller.arguments[0],arguments.callee.caller.arguments[1]-4)}`);
        sh = 8;
      }
      a+=((size[size.length-i-1])<<(i*sh));
    }
    return a;
    //return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
}

function encodeSize(size,length,s=7) {
  const a=[];
  for(let i=0;i<length;i++){
    a.push((size >> (i*s)) & (s==7?0x7f:0xff));
  }
  return Buffer.from(a.reverse());
  //return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
}

function deunsychroniseBuf(br){
  let i = 0;
  while(1){
    if(i + 1 >= br.length)break;
    let p = br.indexOf(0xff,i);
    if(p < 0)break;
    if(p >= 0 && p < br.length-1 && br[p+1] == 0x00){
      if( (p < br.length-2) && (br[p+2] == 0x00) ){  // unsychronised 0xff00 found (0xff0000)
        br = Buffer.concat([br.slice(0,p+1),br.slice(p+2)])
        i=p+1;
        continue;
      }
      br = Buffer.concat([br.slice(0,p+1),br.slice(p+2)])
    }
    i=p+1;
  }
  return br;
}

function unsychroniseBuf(br){
  let i = 0;
  while(1){
    if(i + 1 >= br.length)break;
    let p = br.indexOf(0xff,i);
    if(p < 0)break;
    if(p >= 0 && p < br.length-1 && br[p+1] == 0x00){
      br = Buffer.concat([br.slice(0,p+1),Buffer.alloc(1),br.slice(p+2)])
      i=p+2;
    }else{
      br = Buffer.concat([br.slice(0,p),Buffer.alloc(1),br.slice(p+1)]);
      i=p+1;
    }
  }
  return br;
}

// b : buffer
// o : offset
// e : encoding (default = 0) -> ec array
// mode == 0 : return a single string (default)
// mode == 1 : return (multiple strings) as array of array[key,value]
// mode == 2 : return object with propoertys 'data' (the found string) and 'length' (the number of bytes, this string uses in the buffer) -> for unknown length utf encoded strings
// mode == 3 : return multiple strings as array
const ec = ["","utf16","utf16be","utf8"];
function decodeBuf(b,o=0,e=0,mode=0){
  if(e < 0 || e > 3)return "";
  var ra = [];  // mutliple, by 0 seperated values will be returned as array
  var br = Buffer.alloc(b.length-o);
  try{
    b.copy(br,0,o);
  }catch(e){
    debugger;
  }
  let wc=0,bu,zz,pre,ea=1;
  if( e && e < 3)ea=2;
  while(br.length){
    //if(mode == 2 && br[0] == 0){return {data:"",length:1};}
    if( e && e < 3){
      bu = br.toString('hex');
      zz = bu.indexOf("0000")/2;
    }else{
      zz = br.indexOf(0);
    }
    if(e == 1 && zz && zz+ea < br.length && br[zz+ea] == 0) zz++;
    if(zz < 0)zz = br.length+1;
    if(!mode && !zz)return "";
    if(!zz && mode == 3){
      ra.push("");
      br = br.slice(zz+ea);
      continue;
    }
    if(e){
      pre = Buffer.alloc(zz);
      br.copy(pre,0,0,zz);
      ra.push(iconv.decode(pre, ec[e]));  // select conversion type from string array ec
    }else{
      ra.push(!br[0]?"":br.slice(0,zz).toString());
    }
    wc++;
    if(!mode)return ra[0];
    if(mode == 2){return {data:ra[0],length:zz+ea};}
    br = br.slice(zz+ea);
  }
  //if(!ra.length)return -1;
  if(!ra.length)return "";
  if(mode == 1){
    var k,v;
    var raa = [];
    while(ra.length){
      k = ra.shift();
      ra.length?v = ra.shift():v = "";
      raa.push([k,v]);
    }
    if(raa.length > 1){
      debugger;
      console.warn(`WARNING: decode strings should be one pair (key,value), but there were more: ${raa.slice(1)}`);
    }
    return raa;
  }
  if(ra.length == 1)return ra[0];
  return ra;
}

function checkTracknumber(data){
  if( data.text.match(/\d+(\/d+)?/) ){
    return data;
  }else{
    debugger;
    return 0;
  }
}

function checkDate(data){
  debugger;
  let nd = new Date(data.text);
  if(nd)return data;
  return 0;
}

function fixPicture(data){
  var repair = [];
  var found = false;
  for(let i=0;i<imagetypes.length;i++){
    let it = imagetypes[i];
    let bp = data.picture.bindexOf(it[2],0,8);
    if(bp >= 0){ // compare with magic number (0 == position 0 == found)
      pic = data.picture.slice(bp);
      found = true;
      let j = data.mime.length?it[0].indexOf(mime.substring(6)):-1;
      if(j < 0){ // "image/".length = 6 - 1 = 5
        console.warn(`WARNING: mime type '${data.mime}' is set in frame but it is 'image/${it[0][0]}' (${it[1]}) - fixing`);
        data.mime = `image/${it[0][0]}`;
      }
      if(j > 0){
        console.warn(`WARNING: mime type '${data.mime}' correcting to 'image/${it[0][0]}' (${it[1]})`);
        data.mime = `image/${it[0][0]}`;
      }
      if(repair.length)console.warn("WARNING: image seems to be fixed");
      break;
    }
    if(it.length > 3 && !repair.includes(i)){
      let j = data.picture.bindexOf(it[3],0,128);  // search up to 128 bytes for needle
      if(j >= 0){
        console.warn(`WARNING: image magic code suffix found: "${it[3].toString(16)}" (${it[1]}) @position ${j}", trying to fix`);
        if(j > 32){
          debugger; // suspicious position !
        }
        if(j+it[4]<0){
          console.warn("WARNING: cannot fix. discarding");
          return 0;
        }
        let p = it[2].match(/.{1,2}/g);
        p.forEach((e,i,a)=>{a[i] = parseInt(e,16);});
        p = Buffer.from(p);
        let s = data.picture.slice(j+it[4]);
        //let nb = Buffer.alloc(p.length+m.length+s.length)
        //let nb = Buffer.concat([p,m,s]);
        pic = Buffer.concat([p,s]);
        repair.push(i);
        i=-1;
      }
    }
  }
  if(!found){
    console.warn(`WARNING: unknown picture type found, but mime type is '${mime}'`);
    debugger;
  }else{
    return data;
  }
}



function ID3Tag(fb,options) { // fb = filebuffer
  ID3Tag.prototype.create = function(filename,options){
    if(options.version < 3){
      console.warn("id3v2.2 is not supported");
      return 0;
    }
    if(options.version > 4){
      console.warn(`${version} is unknown`);
      return 0;
    }
    this.options = options;
    this.filename = filename;
    this.version = {
      major: options.version,
      minor: 0
    }
    this.flags = options.flags;
    this.etag = {};
    this.frames = [];
    this.buf = Buffer.alloc(0);
    this.tagok = 1;
    return this;
  }
  ID3Tag.prototype.removeFrame = function(t,a){
    for(let fi in this.frames){
      if(this.frames[fi].type == t){ // equal type
          for(let ftnd of frametypesnodupe){  // check frame type nodupe list
              if(ftnd[0].includes(t)){ // inludes f.type
                  if(!ftnd[1]){ // but no delete criteria
                      this.frames.splice(fi,1);  // just delete
                      return;
                  }else{
                      let wc = 0;
                      let ai = 0; // array index for array 'a' (must be same order as criteria)
                      for(let dc of ftnd[1]){ // test all compare values
                        if(ai == a.length){
                          return { iserror: 1, type: -1, msg: `removeFrame: insufficient criteria: '${a}'. should be '${ftnd[1]}'`};
                        }
                        if(a[ai] != this.frames[fi].data[dc]){
                          wc = 1;
                          break;
                        }
                        ai++;
                      }
                      if(!wc){
                        this.frames.splice(fi,1);  // all criteria ok, delete
                        return;
                      }
                  }
              }
          }
          this.frames.splice(fi,1);  // no criteria - just delete
          return;
      }
    }
    return { iserror: 1, type: -1, msg: `removeFrame: no frame of type '${t}' criteria '${a}' in tag`};
  }
  ID3Tag.prototype.addFrame = function(t,a){
    let f = new Frame([1,t,a,this]);
    if(f.iserror)return f;
    if(f.type != -1){
      for(let fi in this.frames){
        if(this.frames[fi].type == f.type){ // equal type
            for(let ftnd of frametypesnodupe){  // check frame type nodupe list
                if(ftnd[0].includes(f.type)){ // inludes f.type
                    if(!ftnd[1]){ // but no dupe criteria
                        this.frames[fi] = f;  // just overwrite
                        return;
                    }else{
                        let dupe = 0;
                        for(let dc of ftnd[1]){ // test all compare values
                          if(this.frames[fi].data[dc] == f.data[dc]){dupe = 1;break;}
                        }
                        dupe?this.frames[fi]=f:this.frames.push(f);
                        return;
                    }
                }
            }
            this.frames[fi] = f;
            return;
        }
      }
      this.frames.push(f);
    }
  }
  ID3Tag.prototype.list = function() {
    debugger;
    let l = `ID3v2.${this.version.major}${os.EOL}`;
    for(f of this.frames){
      l+=f.log(2)+os.EOL;
    }
    console.log(l);
  }

  ID3Tag.prototype.log = function() {
    if(!this.size)return;
    for(f of this.frames){
      console.log(util.inspect(f,{depth: null}));
    }
  }
  ID3Tag.prototype.toBinary = function() {
    if(!this.tagok)return -1;
    this.flags = 0;
    if(this.options.targetversion){
      this.version.major = this.options.targetversion;
    }
    var b = Buffer.from("ID3").ap(this.version.major).ap(0).ap(this.flags).ap(Buffer.alloc(4));
    for(f of this.frames){
      let bf = f.toBinary(this.options);
      if(bf == -1){
        debugger;
      }
      try{
        b = Buffer.concat([b,bf]);
      }catch(e){
        debugger;
      }
    }
    if(b.length < (this.buf.length)){
      b = Buffer.concat([b,Buffer.alloc(this.buf.length-b.length)]); // add padding
    }
    let s = encodeSize(b.length-ID3TAG_LEN_HEADER,4);
    s.copy(b,ID3TAG_SIZE);
    return b;
  }
  ID3Tag.prototype.write = function() {
    if(this.ot)debugger;
    //if(this.options.backuptag)this.backupTag();

    let btag = this.toBinary();
    if(btag.length > this.buf.length){
      f = fs.readFileSync(this.filename);
      bm = f.slice(this.buf.length);
      b = Buffer.concat([btag,bm]);
      fn = this.filename.match(/^(.+\/)(.+)$/);
      //fs.writeFileSync(fn[1]+"X_"+fn[2],b);
      fs.writeFileSync(this.filename,b);
    }else{
      //let s = encodeSize(this.size,4);
      //s.copy(btag,ID3TAG_SIZE+this.ot);
      //btag = Buffer.concat([btag,Buffer.alloc(this.size-btag.length)]);
      let fh = fs.openSync(this.filename,'rs+');
      if(!fh)return 0;
      fs.writeSync(fh,btag,0,btag.length,this.ot);
      fs.closeSync(fh);
    }
  }
  ID3Tag.prototype.backupTag = (butagfile) => {
    if(this.tagok){
      debugger;
      let b = this.toBinary();
      let r = fs.writeFileSync((butagfile?butagfile+".":this.filename.substring(0,this.filename.length-3))+"hbin",b);
      return 1;
    }else{
      return 0;
    }
  }
  ID3Tag.prototype.restoreTag = () => {
    if(this.ot)debugger;
    let hb = fs.readFileSync(this.filename.substring(0,this.filename.length-3)+"hbin");
    let b = fs.readFileSync(this.filename);
    b = b.slice(this.buf.length);
    b = Buffer.concat(hb,b);
    fs.writeFileSync(this.filename,b);
  }
  ID3Tag.prototype.removeTag = () => {
    debugger;
    let b = fs.readFileSync(this.filename);
    b = b.slice(this.buf.length);
    fs.writeFileSync(this.filename,b);
  }
  ID3Tag.prototype.extractPictures = (pxpath) => {
    let fn;
    let i=0;
    for(f of this.frames){
      if(f.type == "APIC"){
        pxpath?fn=pxpath+this.filename.match(/(.+\/)?(.+)\..+$/)[2]:fn=this.filename.match(/(.+)\..+$/)[1];
        fn+=`(${i})[${f.data.picturetype}].${f.data.mime.substring(6)}`;
        fs.writeFileSync(fn,f.data.picture);
        i++;
      }
    }
  }
  ID3Tag.prototype.convertPictures = function(dest){
    dest = dest || "png";
    for(f of this.frames){
      if(f.type == "APIC"){
        debugger;
        f.extractPicture(`${ndir}pic.tmp`);
        execSync(`convert ${ndir}pic.tmp ${ndir}pic.${dest}`);
        f.data.picture = fs.readFileSync(`${ndir}pic.${dest}`);
        fs.unlinkSync(`${ndir}pic.${dest}`);
        fs.unlinkSync(`${ndir}pic.tmp`);
        f.data.mime = `image/${dest}`;
      }
    }
  }
  ID3Tag.prototype.setOption = (k,v) => {this.options[k]=v;}
  ID3Tag.prototype.getOption = (k) => {return this.options[k];}
  ID3Tag.prototype.getOptions = () => {return this.options;}
  ID3Tag.prototype.getSize = () => {return this.size;}
  ID3Tag.prototype.getFrames = () => {return this.frames;}
  ID3Tag.prototype.getFramesSize = () => {return this.size-this.etag.size;}
  ID3Tag.prototype.getFilebuffer = () => {return this.buf;}
  ID3Tag.prototype.getTagOffset = () => {return this.ot;}
  ID3Tag.prototype.loadMore = (b,l,o) => {return fs.readSync(this.fh,b,0,l,o);}
  ID3Tag.prototype.addReloads = () => {this.reloads++;}
  ID3Tag.prototype.listFrames = () => {cli(this.frames);}


  // header + frames (data) = id3-tag
  // header
  this.version = {
    major: 0,
    minor: 0
  }
  this.flags = 0;
  this.etag = {};
  // the frames (data)
  this.frames = [];
  if(!fb)return this;

  console.log(fb);
  this.tagok = false;
  this.tagfound = false;
  this.reloads = 0;
  this.ot = 0;
  this.options = options;

  this.filename = fb;
  if(typeof fb === "string" || fb instanceof String){
    let sbuffer = Buffer.alloc(BLOCKSIZE);
    this.fh = fs.openSync(fb,"r");
    if(!this.fh)return -1;
    if(fs.readSync(this.fh,sbuffer,0,BLOCKSIZE,0) < sbuffer.length);
    if((sbuffer.readUInt16BE(0) & 0b1111111111000000)==0b1111111111000000)return -1;
    this.ot = sbuffer.indexOf("ID3"); // offset to tag
    if(this.ot >= 0 && this.ot+ID3TAG_SIZE < BLOCKSIZE){    // "ID3" found
      this.size = getSynchSafeSize(sbuffer,this.ot+ID3TAG_SIZE);
      if(!this.size)return -1;
      this.tagfound = true;
      this.buf = Buffer.alloc(this.size+ID3TAG_LEN_HEADER);
      fs.readSync(this.fh,this.buf,0,this.size+ID3TAG_LEN_HEADER,0);
    }else{  // not found... check for mpeg-frame header
      if((sbuffer.readUInt16BE(0) & 0b1111111111000000)==0b1111111111000000){return;}else{  //found ! no id3-tag at start of file!
        if(DEEPSEARCH){
          sbuffer = readFileSync(fb);
          this.ot = sbuffer.indexOf("ID3");
          if(this.ot < 0)return -1;
          this.size = getSynchSafeSize(fb,this.ot+ID3TAG_SIZE);
          if(!this.size)return -1;
          this.tagfound = true;
          this.buf = Buffer.from(sbuffer,this.ot,this.size+ID3TAG_LEN_HEADER);
        }else{
          return -1;
        }
      }
    }
  }

  this.version.major = this.buf[ID3TAG_VERSION_MAJOR];
  this.version.minor = this.buf[ID3TAG_VERSION_MINOR];
  if(this.version.major < 3){
    console.warn("WARNING: id3v2.2 is not supported.");
    return;
  }
  this.flags = this.buf[ID3TAG_FLAGS];
  // Offset (to the) First Frame from file-pos-0 / offset to extended header
  this.off = ID3TAG_LEN_HEADER; // now at position after tag header
  this.etag.size = 0;
  if(this.flags & ID3_EXTENDEDTAGHEADER){ // extended header !
    debugger; // check size offsets!
    this.etag.size = getSynchSafeSize(this.buf,this.off);
    this.etag.flags = this.buf[this.off + ID3ETAG_FLAGS];
    if(etag.flags & ID3_CRC){ // crc present
      debugger;
      this.etag.crc = getSynchSafeSize(this.buf,this.off,ID3ETAG_LEN_CRC);
      this.off += ID3ETAG_LEN_CRC;  // now at extended header restrictions position or ...
    }
    if(this.etag.flags & ID3_RESTRICTIONS){
      debugger;
      this.etag.restrictions = this.buf[this.off];
      this.off += ID3ETAG_LEN_RESTRICTIONS; // now after extended header position
    }
  }


  // filebuffer at frames position
  var errors = [];
  let i = 0;
  let last_frame_offset = 0;
  while(i < this.buf.length) {
    if(this.buf[i+this.off]){
        var frame = new Frame([0,this.buf,i+this.off,this]);
        if(frame.type == -1){
          i++;
          continue;
        }if(frame.type == 0){
          i+=frame.size+ID3_FLEN;
          continue;
        }
        if(!frame.size){
          i+=4;
          continue;
        }
        last_frame_offset = i;
        this.frames.push(frame);
        i+=frame.size+ID3_FLEN;
    }else{
      i++;
    }
  }
  fs.closeSync(this.fh);
  this.tagok = true;
  //debugger;

}







function NodeID3v2() {

  NodeID3v2.prototype.createTag = function(f,options){
    options.version = options.version || ID3v2_default;
    options.flags = options.flags || 0;
    let bf = fs.readFileSync(f);
    if( (bf.readUInt16BE(0) & 0b1111111111000000) == 0b1111111111000000 ){
      let tag = new ID3Tag();
      tag.create(f,options);
      if(tag)return tag;
    }
    console.log(`ERROR: file '${f}' has no MPEG frame at file pos 0`);
    return 0;
  }

  NodeID3v2.prototype.readTag = function(filebuffer,options={}) {
    // returns tag object or -1 on error
    if(!filebuffer)return;
    var tag = new ID3Tag(filebuffer, options);
    if(!tag.tagok)return -1;
    LOGGING?tag.log():null;
    return tag;
  }

  NodeID3v2.prototype.addTagFromFile = function(f,options) {
    let bf = fs.readFileSync(f);
    if( (bf.readUInt16BE(0) & 0b1111111111000000) == 0b1111111111000000 ){
      let tag = new ID3Tag(options.tagfile,options);
      if(tag.tagok){
        let bt = fs.readFileSync(options.tagfile);
        bf = Buffer.concat([bt,bf]);
        fs.writeFileSync(f,bf);
        return 1;
      }
      console.log(`ERROR: file '${t}' is not a valid tag`);
      return 0;
    }
    console.log(`ERROR: file '${f}' has no MPEG frame at file pos 0`);
    return 0;
  }
}
function getMPEGFirstFrameOffset(b){
  let i = 0;
  while(!( (bf.readUInt16BE(i) & 0b1111111111000000) == 0b1111111111000000 ) && i < b.length)i++;
  return i;
}

function getID3TagStart(buffer) {
    var ts = String.prototype.indexOf.call(buffer, (Buffer.from("ID3")));
    if(ts == -1 || ts > 20) return -1;
    else return ts;
}

function getID3TagSize(buffer,offset){
  return getSynchSafeSize(buffer,offset);
}

function getFrameSize(buffer,offset) {
  return getSynchSafeSize(buffer,offset);
}

function getSynchSafeSize32(buffer,offset){
  return decodeSize32(new Buffer([buffer[offset], buffer[offset+1], buffer[offset+2], buffer[offset+3]]));
}

function getSynchSafeSize35(buffer,offset){
  return decodeSize35(new Buffer([buffer[offset], buffer[offset+1], buffer[offset+2], buffer[offset+3], buffer[offset+4]]));
}

function cli(f){console.log(util.inspect(f,{depth: null}));}

function encodeSize32(totalSize) {
    byte_3 = totalSize & 0x7F;
    byte_2 = (totalSize >> 7) & 0x7F;
    byte_1 = (totalSize >> 14) & 0x7F;
    byte_0 = (totalSize >> 21) & 0x7F;
    return ([byte_0, byte_1, byte_2, byte_3]);
}

function encodeSize35(totalSize) {
    byte_4 = totalSize & 0x7F;
    byte_3 = (totalSize >> 7) & 0x7F;
    byte_2 = (totalSize >> 14) & 0x7F;
    byte_1 = (totalSize >> 21) & 0x7F;
    byte_0 = (totalSize >> 28) & 0x7F;
    return ([byte_0, byte_1, byte_2, byte_3, byte_4]);
}

function decodeSize32(hSize) {
    return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
}

function decodeSize35(hSize) {
    return ((hSize[0] << 28) + (hSize[1] << 21) + (hSize[2] << 14) + (hSize[3] << 7) + (hSize[4]));
}

/**
 * ap - append
 *
 * @param {String|Number|Buffer} v value
 * @param {Number} m mode :
 * String: ec[0-3] = iso-8859-1,utf16,utf16be,utf8
 * Number: m = number of bytes to use (where 0 is also 1 byte)
 *         s = 1 : synchsafeEncode number;
 * Buffer: a Buffer
 * @param {Number} s special :
 * @returns {Buffer} returns new Buffer
 */
Buffer.prototype.ap = function(v,m=0,s=0){
  var ab = Buffer([]);
  switch(typeof(v)){
    case "string":
      if(m>ec.length)return -1;
      ab = Buffer.from(m?iconv.encode(v,ec[m]):v);
      if(!ab.length){
        ab = Buffer.alloc((m==0 || m==3)?1:2);
      }else if(!s){
        //debugger;
        ab = Buffer.concat([ab,Buffer.alloc((m==0 || m==3)?1:2)]);
      }
      break;
    case "number":
      if(!m)m=1;
      if(m == 1 ){
        ab = Buffer.alloc(m);
        ab[0]=v;
      }
      if( m == 2 ){
        ab = Buffer.alloc(m);
        s&1?ab.writeInt16BE(v):ab.writeUInt16BE(v);
      }
      if( m == 4 ){
        ab = Buffer.alloc(m);
        s&1?ab.writeInt32BE(v):ab.writeUInt32BE(v);
        if(s&2)ab = encodeSize(ab,m);
      }
      break;
    default:
      ab=v;
  }
  var nb = Buffer.concat([this,ab]);
  return nb;
}

Buffer.prototype.len = ((v) => {v=this.length;})

//function hex(b,o=0,l=0){  b.slice(o,o+l).toString('hex');}
// Length, Offset, Width of output, Adress offset (will be added to adress column)
Buffer.prototype.hex = function(l=this.length,o=0,w=16,ao=0){
  if(ao < 0)ao=o;
  if(o < 0)o = this.length + o;
  if(o > this.length)return -1;
  if(o+l > this.length)l = this.length - o;
  let s = this.slice(o,o+l).toString('hex');
  let i=0,r="",d="",bw=0,rc=0;
  //while(i<l){
  while(i<l){
    d+=" "+s.substring(i*2,i*2+2);
    if( ((i+1) == l) || (!((i+1)%w)) ){
      let j = (i+1)%w;
      j?bw=j:bw=w;
      let b = Buffer.alloc(bw);
      this.copy(b,0,o+i+1-bw,o+i+1);
      b.forEach((e,i,a)=>{(a[i]<32)?a[i]=46:null;});
      r+=("0000000"+((parseInt(rc*w+ao)).toString(16))).substr(-8)+d;
      rc++;
      if(j){
        r+= new Array(w-j+1).join("   ");
      }
      r+= " : '" +b.toString()+"'\n";
      d = "";
    }
    i++;
  };
  console.log(r);
}
// s must be hex string(!) - eg: "dead1a1a"
Buffer.prototype.bindexOf = function(s,o=0,m=this.length){
  let sa = s.match(/.{1,2}/g);
  sa.forEach((e,i,a) => {a[i] = parseInt(e,16);})
  let found,i=0;
  while( (i+o) < this.length && i < m){
    found = 1;
    let j = i;
    for(n of sa){
      if(this[j+o] == n){
        j++;
      }else{
        i++;
        found = false;
        break;
      }
    }
    if(found){
      return i;
    }
  }
  return -1;
};



Object.defineProperty(Buffer.prototype, 'hx', {
    get: Buffer.prototype.hex
});


function cli(o){
  console.log(util.inspect(o,{depth: null}));
}

var language_codes =[ "xxx", // language not defined (XXX!)
  "aar","aav","abk","ace","ach","ada","ady","afa","afh","afr","ain","aka","akk","alb","ale","alg","alt","alv","amh","ang","anp","apa","aqa","aql","ara","arc","arg","arm","arn","arp","art","arw","asm","ast","ath","auf","aus","ava","ave","awa","awd","aym","azc","aze",
  "bad","bai","bak","bal","bam","ban","baq","bas","bat","bej","bel","bem","ben","ber","bho","bih","bik","bin","bis","bla","bnt","bod","bos","bra","bre","btk","bua","bug","bul","bur","byn",
  "cad","cai","car","cat","cau","cba","ccn","ccs","cdc","cdd","ceb","cel","ces","cha","chb","che","chg","chi","chk","chm","chn","cho","chp","chr","chu","chv","chy","cmc","cop","cor","cos","cpe","cpf","cpp","cre","crh","crp","csb","csu","cus","cym","cze",
  "dak","dan","dar","day","del","den","deu","dgr","din","div","dmn","doi","dra","dsb","dua","dum","dut","dyu","dzo",
  "efi","egx","egy","eka","elx","eng","enm","epo","est","esx","euq","eus","ewe","ewo",
  "fan","fao","fas","fat","fij","fil","fin","fiu","fon","fox","fra","fre","frm","fro","frr","frs","fry","ful","fur",
  "gaa","gay","gba","gem","geo","ger","gez","gil","gla","gle","glg","glv","gme","gmh","gmq","gmw","goh","gon","gor","got","grb","grc","gre","grk","grn","gsw","guj","gwi",
  "hai","hat","hau","haw","heb","her","hil","him","hin","hit","hmn","hmo","hmx","hok","hrv","hsb","hun","hup","hye","hyx",
  "iba","ibo","ice","ido","iii","iir","ijo","iku","ile","ilo","ina","inc","ind","ine","inh","ipk","ira","iro","isl","ita","itc",
  "jav","jbo","jpn","jpr","jpx","jrb",
  "kaa","kab","kac","kal","kam","kan","kar","kas","kat","kau","kaw","kaz","kbd","kdo","kha","khi","khm","kho","kik","kin","kir","kmb","kok","kom","kon","kor","kos","kpe","krc","krl","kro","kru","kua","kum","kur","kut",
  "lad","lah","lam","lao","lat","lav","lez","lim","lin","lit","lol","loz","ltz","lua","lub","lug","lui","lun","luo","lus",
  "mac","mad","mag","mah","mai","mak","mal","man","mao","map","mar","mas","may","mdf","mdr","men","mga","mic","min","mis","mkd","mkh","mlg","mlt","mnc","mni","mno","moh","mon","mos","mri","msa","mul","mun","mus","mwl","mwr","mya","myn","myv",
  "nah","nai","nap","nau","nav","nbl","nde","ndo","nds","nep","new","ngf","nia","nic","niu","nld","nno","nob","nog","non","nor","nqo","nso","nub","nwc","nya","nym","nyn","nyo","nzi",
  "oci","oji","omq","omv","ori","orm","osa","oss","ota","oto",
  "paa","pag","pal","pam","pan","pap","pau","peo","per","phi","phn","plf","pli","pol","pon","por","poz","pqe","pqw","pra","pro","pus",
  "qaa","que","qwe",
  "raj","rap","rar","rcf","roa","roh","rom","ron","run","rup","rus",
  "sad","sag","sah","sai","sal","sam","san","sas","sat","scn","sco","sdv","sel","sem","sga","sgn","shn","sid","sin","sio","sit","sla","slk","slv","sma","sme","smi","smj","smn","smo","sms","sna","snd","snk","sog","som","son","sot","spa","sqi","sqi","srd","srn","srp","srr","ssa","ssw","suk","sun","sus","sux","swa","swe","syc","syd","syr",
  "tah","tai","tam","tat","tbq","tel","tem","ter","tet","tgk","tgl","tha","tib","tig","tir","tiv","tkl","tlh","tli","tmh","tog","ton","tpi","trk","tsi","tsn","tso","tuk","tum","tup","tur","tut","tuw","tvl","twi","tyv",
  "udm","uga","uig","ukr","umb","und","urd","urj","uzb",
  "vai","ven","vie","vol","vot",
  "wak","wal","war","was","wel","wen","wln","wol",
  "xal","xgn","xho","xnd",
  "yao","yap","yid","yor","ypk",
  "zap","zbl","zen","zgh","zha","zho","zhx","zle","zls","zlw","znd","zul","zun","zxx","zza"
]

var apictypes = [
  "Other",
  "32x32 pixels 'file icon' (PNG only)",
  "Other file icon",
  "Cover (front)",
  "Cover (back)",
  "Leaflet page",
  "Media (e.g. label side of CD)",
  "Lead artist/lead performer/soloist",
  "Artist/performer",
  "Conductor",
  "Band/Orchestra",
  "Composer",
  "Lyricist/text writer",
  "Recording Location",
  "During recording",
  "During performance",
  "Movie/video screen capture",
  "A bright coloured fish",
  "Illustration",
  "Band/artist logotype",
  "Publisher/Studio logotype"
];

var genres = ["Blues", "Classic Rock", "Country", "Dance", "Disco", "Funk", "Grunge", "Hip-Hop", "Jazz", "Metal","New Age","Oldies","Other","Pop","R&B","Rap","Reggae","Rock","Techno","Industrial","Alternative","Ska","Death Metal","Pranks","Soundtrack","Euro-Techno","Ambient","Trip-Hop","Vocal","Jazz+Funk","Fusion","Trance","Classical","Instrumental","Acid","House","Game","Sound Clip","Gospel","Noise","AlternRock","Bass","Soul","Punk","Space","Meditative","Instrumental Pop","Instrumental Rock","Ethnic","Gothic","Darkwave","Techno-Industrial","Electronic","Pop-Folk","Eurodance","Dream","Southern Rock","Comedy","Cult","Gangsta","Top 40","Christian Rap","Pop/Funk","Jungle","Native American","Cabaret","New Wave","Psychedelic","Rave","Showtunes","Trailer","Lo-Fi","Tribal","Acid Punk","Acid Jazz","Polka","Retro","Musical","Rock & Roll","Hard Rock"];

var frametypes = [
 "AENC", "APIC", "ASPI",  "COMM", "COMR",  "ENCR", "EQU2", "ETCO",  "GEOB", "GRID",  "LINK",  "MCDI", "MLLT",  "OWNE",  "PRIV", "PCNT", "POPM", "POSS",  "RBUF", "RVA2", "RVRB",  "SEEK", "SIGN", "SYLT", "SYTC",  "TALB", "TBPM", "TCOM", "TCON", "TCOP", "TDEN", "TDLY", "TDOR", "TDRC", "TDRL", "TDTG", "TENC", "TEXT", "TFLT", "TIPL", "TIT1", "TIT2", "TIT3", "TKEY", "TLAN", "TLEN", "TMCL", "TMED", "TMOO", "TOAL", "TOFN", "TOLY", "TOPE", "TOWN", "TPE1", "TPE2", "TPE3", "TPE4", "TPOS", "TPRO", "TPUB", "TRCK", "TRSN", "TRSO", "TSOA", "TSOP", "TSOT", "TSRC", "TSSE", "TSST", "TXXX",  "UFID", "USER", "USLT",  "WCOM", "WCOP", "WOAF", "WOAR", "WOAS", "WORS", "WPAY", "WPUB", "WXXX",
 // deprecated
 "TYER","TDAT","TRDA","TIME","TSIZ"
]

var frametypesnodupe = [
  [["TXXX","WXXX","GEOB"],["description"]],
  [["USLT","SYLT","COMM"],["language","description"]],
  [["RVA2","EQU2"],["identification"]],
  [["POPM"],["user"]],
  [["APIC"],["picturetype"]]
]

var imagetypes = [
  [["jpeg","jpg"],"JPEG : JFIF", "ffd8ffe0","4a4649460001",-2,2],
  [["png"],"PNG", "89504e470d0a1a0a"],
  [["jpeg","jpg"],"JPEG : Exif", "ffd8ffe1","457869660000",-2,2],
  [["gif"],"GIF : GIF87a", "474946383761"],
  [["gif"],"GIF : GIF89a", "474946383961"],
  [["bpm"], "BPM", "424d" ],
  [["tiff","tif"],"TIFF : big endian", "4d4d002a"],
  [["tiff","tif"],"TIFF : little endian", "49492a00"],
  [["jpeg","jpg"],"JPEG : raw", "ffd8ffdb"],
  [["jpeg","jpg"],"JPEG : uknown", "ffd8ff"]

];
