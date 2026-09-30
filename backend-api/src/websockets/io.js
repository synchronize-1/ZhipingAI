// socket.io 实例的单一持有者。
// app.js 启动时注入，业务服务（如通知）通过 getIo() 拿到实例做服务端推送，
// 避免各模块各自 require app.js 造成循环依赖。
let ioRef = null;

function setIo(io) {
  ioRef = io;
}

function getIo() {
  return ioRef;
}

module.exports = { setIo, getIo };