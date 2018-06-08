const path = require('path');
var webpack = require('webpack')

var config = {
    entry: './src/index',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            }
        ],
    },
    resolve: {
        extensions: [
            '.ts',
        ],
    },
    externals: [
        // Don't bundle pixi.js, assume it'll be included in the HTML via a script
        // tag, and made available in the global variable PIXI.
        {"pixi.js": "PIXI"}
    ]
};

var packageConfig = Object.assign({}, config, {
    output: {
        filename: 'metacar.min.js',
        path: path.resolve(__dirname, './dist'),
        library: 'metacar',
        libraryTarget: 'window',
        libraryExport: 'default'
    }
});
var demoConfig = Object.assign({}, config,{
    output: {
        filename: 'metacar.min.js',
        path: path.resolve(__dirname, './demo/dist'),
        library: 'metacar',
        libraryTarget: 'window',
        libraryExport: 'default'
    }
});

module.exports = [
    packageConfig, demoConfig,    	
];
