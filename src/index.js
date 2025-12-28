import fs from "fs";
import bencode from "bencode";
import { DgramAsPromised as dgram } from "dgram-as-promised";
import { parseURL } from "whatwg-url";

const torrent = fs.readFileSync("puppy.torrent");

//console.log(torrentString);

// decode the data from bencode as torrent files use bencode opposed to json
const data = Buffer.from(torrent);

// bencode can decode as utf8 strings, removing utf8 arg converts to json
const result = bencode.decode(data, "utf8");
//console.log(result);

// create a udp socket
const socket = dgram.createSocket("udp4");
// seems the address and the port is found in the torrent url
//const ADDRESS = "224.0.0.1";
//const PORT = 6881;

// parse the 'announce' url from the already decoded result
const announceURL = parseURL(result.announce);

// commenting out for now but can see the URL parsed into JSON
console.log("parsed announce url from torrent:", announceURL);

const myMsg = Buffer.from("hello?", "utf8");

const bytes = await socket.send(
  myMsg,
  0,
  myMsg.length,
  announceURL.port,
  announceURL.host
);
console.log(`Message is sent (${bytes} bytes)`);
