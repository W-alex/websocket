////server define
const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    mysql=require("mysql");

server.listen(3000);

////database connect
const conn=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"123456",
    database:"xunjian",
    port:"3306"
});
conn.connect();

const roomArr=[];
let socketObj={};//存储不同房间中的socket 每个元素对应一个socket数组

////router
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
    const WebSocketServer=require("ws").Server,
        wws=new WebSocketServer({server:server});
//存储socket数组
let index=1;
    wws.on("connection",function(ws
    ){
        console.log("connection");
        let otherIndex=index--;
        ws.on("message",function(message){
            console.log(message);
            message=JSON.parse(message);
            if(message.event==="_offer"){//caller 第一次连接服务器
                socketObj[message.room]=[];
            }
            console.log(socketObj[message.room].length);
            socketObj[message.room].push(ws);
            socketObj[message.room][otherIndex].send(JSON.stringify(message),function(error){
                if(error){
                    console.log(error);
                }
            })
        })
    })
