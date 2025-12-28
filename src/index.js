import fs from "fs";
import bencode from "bencode";

const torrent = fs.readFileSync("puppy.torrent");
const torrentString = torrent.toString("utf8");

console.log(torrentString);

// decode the data from bencode as torrent files use bencode opposed to json
const data = Buffer.from(torrent);

// bencode can decode as utf8 strings, removing utf8 arg converts to json
const result = bencode.decode(data, "utf8");
console.log(result);
