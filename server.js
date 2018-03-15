////server define
const express = require('express'),
    app = express(),
    // server = require('http').createServer(app),
    http = require("http"),
    https = require("https"),
    fs = require("fs"),
    mysql=require("mysql"),
    config={
        key: fs.readFileSync('./https/privatkey.pem'),
        cert: fs.readFileSync('./https/certificate.pem')
    }

    const httpsServer = https.createServer(config,app);
    httpsServer.listen(4000);

    const httpServer = http.createServer(app);
    httpServer.listen(3000);

////database connect
const conn=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"123456",
    database:"xunjian",
    port:"3306"
});

conn.connect();


////router
app.get("/",function(req,res){
    res.write("欢迎来到Webrtc聊天室");
})
app.get('/webrtc/:roomid/:identity', function(req, res) {
    res.sendFile(__dirname + '/peerConnection.html');
});
app.get("/test",function(req,res){
   let id=req.query.roomid;
   let pwd=req.query.password;
   console.log(id);
    let queryStr='select password from chatroom where roomid="'+id+'"';
    conn.query(queryStr,function(err,res1){
       if(err){
           console.log(err);
           return false;
       }
       if(res1[0].password===pwd){
           res.send({
               success:true
           })
       }
       else{
           res.send({
               success:false
           })
       }
    })
});
app.get("/:id",function(req,res){
    res.sendFile(__dirname+"/login.html");
});


//websocket server
var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({server: server});

// 存储socket的数组，这里只能有2个socket，每次测试需要重启，否则会出错
var wsc = [],
    index = 1;

// 有socket连入
wss.on('connection', function(ws) {
    console.log('connection');

    // 将socket存入数组
    wsc.push(ws);

    // 记下对方socket在数组中的下标，因为这个测试程序只允许2个socket
    // 所以第一个连入的socket存入0，第二个连入的就是存入1
    // otherIndex就反着来，第一个socket的otherIndex下标为1，第二个socket的otherIndex下标为0
    var otherIndex = index--,
        desc = null;

    if (otherIndex == 1) {
        desc = 'first socket';
    } else {
        desc = 'second socket';
    }

    // 转发收到的消息
    ws.on('message', function(message) {
        var json = JSON.parse(message);
        console.log('received (' + desc + '): ', json);

        wsc[otherIndex].send(message, function (error) {
            if (error) {
                console.log('Send message error (' + desc + '): ', error);
            }
        });
    });
});