const http = require('http');
const fs = require('fs');
const open = require('open');
const pathlib = require('path');
const lesscompiler = require('less');
const WebpackDevServer = require('webpack-dev-server');
const Webpack = require('webpack');
const buildconfig = require('./dev.webpack.js');

const compiler = Webpack(buildconfig);
const server = new WebpackDevServer(compiler, {
    disableHostCheck : true,
    hot : true
});

server.listen(18367);

const lessserver = http.createServer((req, resp) => {
    fs.readdir('./less', (err, files) => {
        const paths = files.filter(x => x.endsWith('.less')).map(x => `@import "${pathlib.join(pathlib.resolve('.'), 'less', x)}";`);
        lesscompiler.render(paths.join('\n'), { compress : false }, (err, result) => {
            if (err) {
                console.error(err);
                resp.writeHead(500);
                resp.end();
            } else {
                console.log(`Compiled ${result.imports.length} less files`);
                resp.writeHead(200, { "Content-Type" : "text/css" });
                resp.end(result.css);
            }
        });
    });
});
lessserver.listen(23391);

open('http://localhost:18367/');
