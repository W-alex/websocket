const urlList=window.location.href.split("/").reverse();
const rid=urlList[1],identity=urlList[0];
const socket=new WebSocket("ws://192.168.1.109:3000");
const PeerConnection=(window.PeerConnection ||
    window.webkitPeerConnection00 ||
    window.webkitRTCPeerConnection ||
    window.mozRTCPeerConnection);

const configuration = {
    iceServers: [{
        urls: 'stun:stun.l.google.com:19302'
    }]
};
const pc=new PeerConnection(configuration);

let caller=false;
if(identity==="caller"){
    caller=true;
}

function oniceCandidate(evt){
    console.log("ice");
    if (event.candidate !== null) {
        socket.send(JSON.stringify({
            "event": "_ice_candidate",
            "data": {
                "candidate": evt.candidate
            }
        }));
    }
}
function onAddStream(evt){
    document.getElementById('remoteVideo').src = URL.createObjectURL(evt.stream);
}
// 发送offer和answer的函数，发送本地session描述
function sendOfferFn(desc){
        pc.setLocalDescription(desc);
        socket.send(JSON.stringify({
            "event": "_offer",
            "room":roomid,
            "data": {
                "sdp": desc
            }
        }));
    }
function sendAnswerFn(desc){
        pc.setLocalDescription(desc);
        socket.send(JSON.stringify({
            "event": "_answer",
            "room":roomid,
            "data": {
                "sdp": desc
            }
        }));
    }
function onDataChannel(evt){
    let receiveChannel=evt.channel;
    receiveChannel.onmessage= function(evt){
        console.log("recieve the message");
        console.log(evt.data);
    }
}

//发送ICE候选到其他客户端
pc.onicecandidate = oniceCandidate();
// 如果检测到媒体流连接到本地，将其绑定到一个video标签上输出
pc.onaddstream = onAddStream();
//监听到datachannel信息
pc.ondatachannel=onDataChannel();

const sendChannel=pc.createDataChannel("sendChannel",{reliable:false});

document.querySelector("#submit").addEventListener("click",function(evt){
    let sendData=document.querySelector("#inputMess").value;
    const readyState = sendChannel.readyState;
    console.log(readyState);
    if (readyState === "open") {
        console.log(sendData);
        sendChannel.send(sendData);
    }
},false);
// 获取本地音频和视频流
const getUserMedia = (navigator.getUserMedia ||
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
    const json = JSON.parse(event.data);
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

