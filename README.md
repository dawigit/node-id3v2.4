####node-id3v2.4

##node id3 tagger

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
##remove frame: (no 'friendly names' [title instead of TIT2] for remove) (yet)
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
