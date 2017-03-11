####node-id3v2.4

###node id3 tagger

##help:
```
    node tag.js [-?|-h|--help]
```
##list tag with:
```
    node tag.js -l 'path/to/file.mp3'
```
##add frame:
```
    node tag.js -af artist,'the artists name' 'path/to/file.mp3'
```
##add frame and list tag:
```
    node tag.js -l -af artist,'the artists name' 'path/to/file.mp3'
```
##tag is not writen until you add '-u' argument:
```
    node tag.js -l -u -af TXXX,'my description','my text' 'path/to/file.mp3'
```
##remove frame: (no 'friendly names' [use 'TIT2' instead of 'title'] for remove) (yet)
```
    node tag.js -u -RF TIT2 'path/to/file.mp3'
```
##remove ambiguous frame with:
```
    node tag.js -u -RF TXXX 'path/to/file.mp3'
```
gives a message:
```
    [-1] : removeFrame: insufficient criteria: ''. should be 'description'
```
so you have to:
```
  node tag.js -u -RF TXXX,'my description' 'path/to/file.mp3'
```

## importat:

This software has 'alpha' status - send bug reports!
There are many media files in the wild with malformed tags or frames, which
sometimes leads to unpredictable behaviour.

## TODO:

- support for all possible frame types
- use 'template' approach for reading in data ( add Buffer.eat() )
- clean code
- improve stability with malformed tags/frames
