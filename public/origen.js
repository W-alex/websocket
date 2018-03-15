// 仅仅用于控制哪一端的浏览器发起offer，#号后面有值的一方发起
//    var isCaller = window.location.href.split('#')[1];
var isCaller=window.location.href.indexOf("caller")!==-1;
var roomid=window.location.href.split("#")[1];
// 与信令服务器的WebSocket连接
var socket = new WebSocket("ws://192.168.1.109:3000");

// 创建PeerConnection实例 (参数为null则没有iceserver，即使没有stunserver和turnserver，仍可在局域网下通讯)
var PeerConnection = (window.PeerConnection ||
window.webkitPeerConnection00 ||
window.webkitRTCPeerConnection ||
window.mozRTCPeerConnection);

const configuration = {
iceServers: [{
urls: 'stun:stun.l.google.com:19302'
}]
};
var pc = new PeerConnection(configuration);


// 发送ICE候选到其他客户端
pc.onicecandidate = function(event){
console.log("ice");
if (event.candidate !== null) {
socket.send(JSON.stringify({
"event": "_ice_candidate",
"data": {
"candidate": event.candidate
}
}));
}
};

// 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
pc.onaddstream = function(event){
document.getElementById('remoteVideo').src = URL.createObjectURL(event.stream);
};

// 发送offer和answer的函数，发送本地session描述
var sendOfferFn = function(desc){
pc.setLocalDescription(desc);
socket.send(JSON.stringify({
"event": "_offer",
"room":roomid,
"data": {
"sdp": desc
}
}));
},
sendAnswerFn = function(desc){
pc.setLocalDescription(desc);
socket.send(JSON.stringify({
"event": "_answer",
"room":roomid,
"data": {
"sdp": desc
}
}));
};

pc.ondatachannel=function(evt){
let receiveChannel=evt.channel;
receiveChannel.onmessage= function(evt){
addMessage(evt.data,"question");

}
}
const sendChannel=pc.createDataChannel("sendChannel",{reliable:false});

document.querySelector("#submit").addEventListener("click",function(evt){
    let inputArea=document.querySelector("#inputMess");
    let sendData=inputArea.value;
    addMessage(sendData,"answer");
    inputArea.value="";
    inputArea.focus();
    let readyState = sendChannel.readyState;
    console.log(readyState);
    if (readyState === "open") {
        console.log(sendData);
        sendChannel.send(sendData);
    }
},false);
document.onkeydown=function(evt){
if(evt.keyCode === 13){ //绑定回车
    document.querySelector('#submit').click();
    }
    };

// 获取本地音频和视频流
    var getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

    getUserMedia.call(navigator,{
    "audio": false,
    "video": true
    }, function(stream){
    console.log("usermedia");
    //绑定本地媒体流到video标签用于输出
    document.getElementById('localVideo').src = URL.createObjectURL(stream);
    //向PeerConnection中加入需要发送的流
    pc.addStream(stream);
    //如果是发起方则发送一个offer信令
    if(isCaller){
    pc.createOffer(sendOfferFn, function (error) {
    console.log('Failure callback: ' + error);
    });
    }
    }, function(error){
    //处理媒体流创建失败错误
    console.log('getUserMedia error: ' + error);
    });

    //处理到来的信令
    socket.onmessage = function(event){
    console.log("get server message");
    var json = JSON.parse(event.data);
    console.log('onmessage: ', json);
    //如果是一个ICE的候选，则将其加入到PeerConnection中，否则设定对方的session描述为传递过来的描述
    if( json.event === "_ice_candidate" ){
    pc.addIceCandidate(new RTCIceCandidate(json.data.candidate));
    } else {
    pc.setRemoteDescription(new RTCSessionDescription(json.data.sdp));
    // 如果是一个offer，那么需要回复一个answer
    if(json.event === "_offer") {
    pc.createAnswer(sendAnswerFn, function (error) {
    console.log('Failure callback: ' + error);
    });
    }
    }
    };

    function addMessage(data,role){
    let message=document.createElement("div");
    let alert=document.createElement("div");
    message.className="message";
    alert.className=role==="answer"?"alert alert-success answer":"alert alert-danger question";
    alert.innerHTML=data;
    message.appendChild(alert);
    document.querySelector(".dialog").appendChild(message);
    }
