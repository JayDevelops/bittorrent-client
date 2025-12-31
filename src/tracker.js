"use strict";
import dgram from "node:dgram";
import { parseURL } from "whatwg-url";
import { randomBytes } from "node:crypto";
import genId from "./util";

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
      const announceRequest = buildAnnounceReq(
        connectionResponse.connectionId,
        torrent
      );
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

function buildAnnounceReq(connId) {
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt16BE(4),
      };
    }),
  };
}
export default getPeers;
