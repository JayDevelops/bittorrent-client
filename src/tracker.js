"use strict";
import dgram from "node:dgram";
import { parseURL } from "whatwg-url";

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

function buildConnReq() {}

function parseConnResp(response) {}

function buildAnnounceReq(connId) {}

function parseAnnounceResp(response) {}

export default getPeers;
