const express = require('express'),
    app = express(),
    // server = require('http').createServer(app),
    http = require("http"),
    https = require("https"),
    fs = require("fs"),
    config={
        key: fs.readFileSync('./https/privatkey.pem'),
        cert: fs.readFileSync('./https/certificate.pem')
    }

const httpsServer = https.createServer(config,app);
httpsServer.listen(4000);

const httpServer = http.createServer(app);
httpServer.listen(3000);

const mysql=require("mysql");
const conn=mysql.createConnection({
    host:"127.0.0.1",
    user:"root",
    port:3306,
    database:"xunjian",
    password:"123456"
});
conn.connect();

const path=require("path");
app.use(express.static(path.join(__dirname, '')));

const rtc=require("./myRTC").listen(httpServer);

app.get("/webrtc/001/test",function(req,res){
    res.sendFile(__dirname+"/peerConnection.html");
})


//router
app.get('/webrtc/:roomid/:username', function(req, res) {
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
        if(res1[0].password===pwd ){
            res.send({
                success:true
            })
        }
        else if(res1[0].approvestatus!==1){
            res.send({
                success:false,
                message:"此聊天室尚未通过审批，登录失败！"
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

//**********webrtc回调函数*************/
rtc.rtc.on('new_connect', function(socket) {
    console.log('创建新连接');
});

rtc.rtc.on('remove_peer', function(socketId) {
    console.log(socketId + "用户离开");
    rtc.rtc.emit("__notice",JSON.stringify({
        message:socketId+"用户离开",
        socketId:socketId
    }))

});

rtc.rtc.on('new_peer', function(socket, room) {
    console.log("新用户" + socket.id + "加入房间" + room);
    rtc.rtc.emit("__notice",JSON.stringify({
        message:"新用户加入房间" + room,
        socketId:socket.id
    }))
});

rtc.rtc.on('socket_message', function(socket, msg) {
    console.log("接收到来自" + socket.id + "的新消息：" + msg);
});

rtc.rtc.on('ice_candidate', function(socket, ice_candidate) {
    console.log("接收到来自" + socket.id + "的ICE Candidate");
});

rtc.rtc.on('offer', function(socket, offer) {
    console.log("接收到来自" + socket.id + "的Offer");
});

rtc.rtc.on('answer', function(socket, answer) {
    console.log("接收到来自" + socket.id + "的Answer");
});

rtc.rtc.on('error', function(error) {
    console.log("发生错误：" + error.message);
});