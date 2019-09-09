const liliumroot = __dirname;
const pathlib = require('path');

const buildconfig = { 
    mode : "development",
    module : { 
        rules : [ 
            {
                test : /.m?js$/, 
                exclude: /(node_modules)/,
                use : { 
                    loader : "babel-loader?cacheDirectory=true", 
                    options : { 
                        "plugins": [
                            ["transform-react-jsx", { "pragma":"h" }], 
                            ["transform-class-properties"],
                            ["@babel/plugin-proposal-object-rest-spread", {
                                useBuildIns : true
                            }],
                        ],
                        "presets" : [ 
                            [ "@babel/preset-env" ]
                        ]
                    }
                }
            },
            {
                test: /\.less$/,
                loader: 'less-loader', 
            },
        ]
    },
    resolve : { 
        modules : [ 
            pathlib.resolve(pathlib.join(liliumroot, 'apps', 'lilium')),
            pathlib.resolve(pathlib.join(liliumroot, 'node_modules'))
        ]
    },
    entry : pathlib.resolve(pathlib.join(liliumroot, 'src', 'liliumtext.dev.js')),
    plugins: [ ],
    output : { 
        filename : "app.dev.bundle.js"
    },
    devServer : {
        port : 18367
    }
};

module.exports = buildconfig;
