
const https = require('https');

const url = 'https://admin.mxlens.com';

https.get(url, (res) => {
    console.log('StatusCode:', res.statusCode);
    console.log('Location:', res.headers.location);
    res.resume();
}).on('error', (e) => {
    console.error(e);
});
