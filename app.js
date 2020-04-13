const express = require('express');
const timeout = require('connect-timeout');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressWs = require('express-ws');
const AV = require('leanengine');
const cors = require('cors');

// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

const app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 设置默认超时时间
app.use(timeout('30s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
app.use(AV.Cloud.HttpsRedirect());

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'Device-type',
            'Pragma',
            'Cache-Control',
        ],
    })
);

app.get('/', function (req, res) {
    res.json({
        success: true
    });
});

app.post('/identity/connect/token', require('./routes/login'));
app.post('/api/accounts/prelogin', require('./routes/prelogin'));
app.get('/api/accounts/profile', require('./routes/accounts').profileHandler);
app.put('/api/accounts/profile', require('./routes/accounts').putProfileHandler);
app.post('/api/accounts/keys', require('./routes/keys'));
app.post('/api/accounts/register', require('./routes/register'));
app.get('/api/accounts/revision-date', require('./routes/accounts').revisionDateHandler);
app.put('/api/devices/identifier/:uuid/token', require('./routes/accounts').pushTokenHandler);
app.get('/api/sync', require('./routes/sync'));
app.post('/api/ciphers', require('./routes/ciphers').postHandler);
app.put('/api/ciphers/:uuid', require('./routes/ciphers').putHandler);
app.delete('/api/ciphers/:uuid', require('./routes/ciphers').deleteHandler);
app.post('/api/folders', require('./routes/folders').postHandler);
app.put('/api/folders/:uuid', require('./routes/folders').putHandler);
app.delete('/api/folders/:uuid', require('./routes/folders').deleteHandler);
app.get('/icons/:domain/icon.png', require('./routes/icons'));

expressWs(app);
app.ws('/notifications/hub', function (ws) {
    ws.on('message', function (msg) {
        console.log('Notifications handle', msg);

        try {
            const data = JSON.parse(msg.slice(0, -1));

            if (data.protocol === 'messagepack' && data.version === 1) {
                const RECORD_SEPARATOR = 0x1e;
                const INITIAL_RESPONSE = [0x7b, 0x7d, RECORD_SEPARATOR];

                ws.send(Buffer.from(INITIAL_RESPONSE));
            } else {
                ws.send(msg);
            }
        } catch(e) {
            console.error('handle err:', e);
        }
    });
});

app.use(function (req, res, next) {
    // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
    if (!res.headersSent) {
        const err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});

// error handlers
app.use(function (err, req, res, next) {
    if (req.timedout && req.headers.upgrade === 'websocket') {
        // 忽略 websocket 的超时
        return;
    }

    const statusCode = err.status || 500;
    if (statusCode === 500) {
        console.error(err.stack || err);
    }
    if (req.timedout) {
        console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
    }
    res.status(statusCode);
    // 默认不输出异常详情
    let error = {};
    if (app.get('env') === 'development') {
        // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
        error = err;
    }
    console.error('err', req.originalUrl);

    res.json({
        success: false,
        message: err.message
    });
});

module.exports = app;
