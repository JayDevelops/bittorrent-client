"use strict";
import dgram from "node:dgram";
import { parseURL } from "whatwg-url";
import { randomBytes } from "node:crypto";

async function getPeers(torrent, callback) {
  // create a udp socket
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce;

  udpSend(socket, buildConnReq(), url);

  socket.on("message", (response) => {
    const responseType = respType(response);

    if (responseType === "connect") {
      // connect and send the announce request
      const connectionResponse = parseConnResp(response);
      const announceRequest = buildAnnounceReq(connectionResponse);
      udpSend(socket, announceRequest, url);
    } else if (responseType === "announce") {
      //  parse announce response and return peers in callback
      const announceResponse = parseAnnounceResp(response);
      callback(announceResponse.peers);
    }
  });
}

async function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = parseURL(rawUrl);

  if (!url || url === undefined) {
    throw new Error("Invalid url");
  }

  socket.send(message, 0, message.length, url.port, url.host, callback);
}

// Helper method to distinguish if the peer is connecting or announcing since both responses are in the same socket
function respType(response) {
  const action = response.readInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
}

function buildConnReq() {
  // length of the message will be about 16 bytes long
  const buf = Buffer.alloc(16);

  // connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);

  // action
  buf.writeUInt32BE(0, 8);

  // transaction id
  randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(response) {
  const responseFormatted = {
    action: response.readUInt32BE(0),
    transactionId: response.readUInt32BE(4),
    connectionId: response.slice(8),
  };
  return responseFormatted;
}

function buildAnnounceReq(connId) {}

function parseAnnounceResp(response) {}

export default getPeers;
