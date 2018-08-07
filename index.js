'use strict'

const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const handler = require('./lib/handler');



const serverHttp = http.createServer((req, res) => {
    serverLogic(req, res);
})

const options = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem'),
};
const serverHttps = https.createServer(options, (req, res) => {
    serverLogic(req, res);
})







serverHttp.listen(4443, () => {
    console.log('server started at port 4443');
})

serverHttps.listen(3000, () => {
    console.log('server started at port 3000');
})
const handleNotFound = (data, cb) => {
    cb(404, {});
}

const serverLogic = (req, res) => {
    const parserdUrl = url.parse(req.url, true);
    const trimedUrl = parserdUrl.pathname.replace(/^\/|\/$/g, "");
    let { headers, method } = req;
    method=method.toLowerCase();

    let buffer = "";
    let queryParameter = parserdUrl.query;
    const decoder = new StringDecoder('utf-8');
    req.on('data', function (data) {
        buffer += decoder.write(data);
    })
    req.on('end', function () {
        buffer += decoder.end();
        buffer = !!buffer ? JSON.parse(buffer) : buffer;
        const chooseHandler = trimedUrl in handler ? handler[trimedUrl] : handleNotFound;
        const data = { payload: buffer, queryParameter, method, headers, parserdUrl, trimedUrl };
        chooseHandler(data, (statusCode, json) => {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(JSON.stringify(json));
        })
    })
}