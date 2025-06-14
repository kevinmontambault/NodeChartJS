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

module.exports = class Chart{
    constructor(config={}, options={}){
        this.config = config;

        this._client = null;

        this._height = options.height || 500;
        this._width = options.width || 500;
        this._bgColor = options.bgColor || '#FFFFFF';
    };

    async show(){
        const server = net.createServer(client => {
            this._client = client;

            client.on('data', data => {
                // console.log('Received:', data.toString());
            });

            client.on('close', () => this._client = null);

            client.on('error', () => {
                
            });

            client.write(JSON.stringify(this.config));
        }).listen(0, () => {
            const scapp = spawn(scappPath, [
                path.join(__dirname, `index.html`),
                '--debug',
                `-port=${server.address().port}`,
                `-width=${this._width}`,
                `-height=${this._height}`,
                `-bg=${this._color}`
            ]);
            scapp.on('close', () => server.close());
        });
    };

    async update(){
        if(!this._client){ throw new Error('Missing UI connection'); }
    };

    async resize(width, height){
        if(!Number.isInteger(width)){ throw new Error('Width must be integer'); }
        if(!Number.isInteger(height)){ throw new Error('Height must be integer'); }
        if(!this._client){ throw new Error('Missing UI connection'); }

        this._width = width;
        this._height = height;
    };

    async setBackgroundColor(color){
        if(!this._client){ throw new Error('Missing UI connection'); }

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