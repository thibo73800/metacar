const path = require('path');

var config = {
    entry: './src/index',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: [
            '.ts',
        ],
    }
};

var packageConfig = Object.assign({}, config, {
    output: {
        filename: 'metacar.min.js',
        path: path.resolve(__dirname, './dist'),
    }
});
var demoConfig = Object.assign({}, config,{
    output: {
        filename: 'metacar.min.js',
        path: path.resolve(__dirname, './demo/dist'),
    }
});

module.exports = [
    packageConfig, demoConfig,    	
];
