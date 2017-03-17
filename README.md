####node-id3v2.4

###node id3 tagger
- read/write ID3v2.3 / ID3v2.4 tags
- use/convert encodings 'ISO-8859-1','UTF-16',(ID3v2.4)'UTF-16BE','UTF-8'
- add, convert (imagemagic) and extract images ('APIC')

###Installation
```
  npm install node-id3v2.4
```
##Include
To use the library:
```
  const nodeID3v2 = require('node-id3v2.4');
```
To read a tag:
```
  let tag = nodeID3v2.readTag(filename);
```

###node-id3tag
After installation 'node-id3tag' command will also be available for use in shell/cmd.

##Help:
  you can try to get help on 'topic' (and 'subtopic')
```
    node-id3tag [-?|-h]
    node-id3tag -? picturetype
    node-id3tag -h frametype image
```
##List tag with:
```
    node-id3tag -l 'path/to/file.mp3'
```
##Add frame:
```
    node-id3tag -af artist,'the artists name' 'path/to/file.mp3'
```
##Add frame and list tag:
```
    node-id3tag -l -af image,'path/to/image','picturetype' 'path/to/file.mp3'
```
##Tag is not writen until you add '-u' argument:
```
    node-id3tag -l -u -af TXXX,'my description','my text' 'path/to/file.mp3'
```
##Remove frame:
```
    node-id3tag -u -RF title 'path/to/file.mp3'
```
##Remove ambiguous frame with:
```
    node-id3tag -u -RF TXXX 'path/to/file.mp3'
```
gives a message:
```
    [-1] : removeFrame: insufficient criteria: ''. should be 'description'
```
so you have to:
```
  node-id3tag -u -RF TXXX,'my description' 'path/to/file.mp3'
```

##Notes:

There are many media files in the wild with malformed tags or frames, which
sometimes leads to unpredictable behaviour.

## TODO:

- support for all possible frame types
- use 'template' approach for reading in data ( add Buffer.eat() )
- clean code
- improve stability with malformed tags/frames
