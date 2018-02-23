var io = require('socket.io-client');
var ss = require('socket.io-stream');
var fs = require('fs');
const path = require('path');
var AdmZip = require('adm-zip');


var argv = require('minimist')(process.argv.slice(2));
console.dir(argv);

var filename =argv._[0] ;
var port = argv.p || 3636;
var stop = argv.s || 0;

console.log('Filename: '+filename+' Port: '+port);


var socket = io.connect('http://dory.microlab.ntua.gr:'+port);
var stream = ss.createStream();

const ip = require('ip');

let myIP=ip.address();

let user={
    ip:myIP,
    token:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    type:'premium'
}

socket.emit('tokenID', user);


ss(socket).emit('scriptPY', stream, {name: filename});
fs.createReadStream(filename).pipe(stream);

if (stop>0) {
    console.log("Kill signal in :",stop);

    setTimeout(function(){
        socket.emit('stopScript','lele');
    }, stop);
}

socket.on('outPy', function(msg){
    console.log("Received: " + msg);
});

ss(socket).on('results', function(stream, data) {
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
    stream.on('finish', () => {
        console.log('Got File from stream :'+filename);
        var zip = new AdmZip(filename);
        var zipEntries = zip.getEntries();
        zipEntries.forEach(function(zipEntry) {
            let name=zipEntry.entryName;
            let sizeuncomp=formatBytes(zipEntry.header.size);
            let sizecomp=formatBytes(zipEntry.header.compressedSize);
            console.log(name+": "+sizeuncomp+" --> "+sizecomp); // outputs zip entries information
        });
        process.exit();
    });

});

function formatBytes(a,b){
    if(0==a)return"0 Bytes";
    var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));
    return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]
}
