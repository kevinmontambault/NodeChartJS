const EventEmitter = require('events').EventEmitter;
const spawn = require('child_process').spawn;
const path = require('path');
const net = require('net');
const os = require('os');

let fileName = '';
const platform = os.platform();
if(platform === 'win32'){ fileName = 'scapp.exe'; }
else if(platform === 'linux'){ fileName = 'scapp'; }
else if(platform === 'darwin'){ fileName = 'scapp'; }
else{
    console.error(`Unsupported platform '${platform}'`);
    process.exit(1);
}

const scappPath = path.join(__dirname, 'bin', fileName);

const messageTypes = {
    CONFIG: 1,
    RESIZE: 2,
    BGCOLOR: 3,
};

module.exports = class Chart extends EventEmitter{
    constructor(config={}, options={}){
        super();

        this.config = config;

        this._client = null;
        this._process = null;

        this._height  = options.height || 500;
        this._width   = options.width || 500;
        this._bgColor = options.bgColor || '#FFFFFF';
    };

    _send(type, data){
        return new Promise((resolve, reject) => {
            if(!this._client){ return reject(new Error('Missing UI connection')); }

            if(!data){ data = ''; }
            if(Object.isExtensible(data)){ data = JSON.stringify(data); }
            if(typeof(data) === 'string'){ data = Buffer.from(data, 'utf8'); }

            const dataLength = data.length + 1; // 1 for the type
            const buffer = Buffer.from([(dataLength>>24)&0xFF, (dataLength>>16)&0xFF, (dataLength>>8)&0xFF, dataLength&0xFF, type, ...data]);
            this._client.write(buffer, resolve);
        });
    };

    show(){
        return new Promise(resolve => {
            const server = net.createServer(async client => {
                this._client = client;
                client.on('close', () => this._client = null);
                client.on('error', err => this.emit('error', err));
    
                const lengthBytes = [null, null, null, null];
                let   messageBuffer = null;
                let   receivedData = 0;
                client.on('data', dataBuffer => {
    
                    let dataOffset = 0;
                    while(dataOffset < dataBuffer.length){
                        if(messageBuffer === null){
                            if(lengthBytes[0] === null){ lengthBytes[0] = dataBuffer[dataOffset++]; continue; }
                            if(lengthBytes[1] === null){ lengthBytes[1] = dataBuffer[dataOffset++]; continue; }
                            if(lengthBytes[2] === null){ lengthBytes[2] = dataBuffer[dataOffset++]; continue; }
                            if(lengthBytes[3] === null){ lengthBytes[3] = dataBuffer[dataOffset++]; continue; }
                            messageBuffer = Buffer.allocUnsafe((lengthBytes[0]<<24) | (lengthBytes[1]<<16) | (lengthBytes[2]<<8) | lengthBytes[3]);
                        }
            
                        else{
                            messageBuffer[receivedData++] = dataBuffer[dataOffset++];
            
                            if(receivedData === messageBuffer.length){
                                const messageType = messageBuffer[0];
                                const dataString = String.fromCharCode.apply(null, messageBuffer.slice(1));
                                lengthBytes.fill(null);
                                messageBuffer = null;
                                receivedData = 0;
    
                                switch(messageType){
                                    case messageTypes.RESIZE: {
                                        const {width, height} = JSON.parse(dataString);
                                        this._width = width;
                                        this._height = height;
                                        this.emit('resize');
                                        break;
                                    }
                                }
                            }
                        }
                    }
                });
    
                await this.update();

                resolve();
            }).listen(0, () => {
                this._process = spawn(scappPath, [
                    path.join(__dirname, `index.html`),
                    '--debug',
                    `-port=${server.address().port}`,
                    `-width=${this._width}`,
                    `-height=${this._height}`,
                    `-bg=${this._color}`
                ]);
    
                this._process.on('close', () => {
                    this._process = null;
                    server.close();
                });
                
                this._process.on('exit', () => {
                    this._process = null;
                    server.close();
                });
            });
    
            server.on('close', () => this.emit('close'));
        });
    };

    // flushes current config to the client
    async update(){
        await this._send(messageTypes.CONFIG, this.config);
    };

    // delete the chart window if it is open
    async hide(){
        if(!this._process){ throw new Error('Missing Sciter process'); }

        this._client?.destroy();
        this._process.kill();
    };

    async resize(width, height){
        if(!Number.isInteger(width)){ throw new Error('Width must be integer'); }
        if(!Number.isInteger(height)){ throw new Error('Height must be integer'); }

        await this._send(messageTypes.RESIZE, {width, height});

        this._width = width;
        this._height = height;
    };

    async setBackgroundColor(color){
        await this._send(messageTypes.BGCOLOR, {color});

        this._backgroundColor = color;
    };

    get height(){
        return this._height;
    };

    set height(newHeight){
        this.resize(this._width, newHeight);
        return newHeight;
    };

    get width(){
        return this._width;
    };

    set width(newWidth){
        this.resize(newWidth, this._height);
        return newWidth;
    };

    get bgColor(){
        return this._bgColor;
    };

    set bgColor(newColor){
        this.setBackgroundColor(newColor);
        return newColor;
    };
};