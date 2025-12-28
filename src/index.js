"use strict";
import fs from "fs";
import bencode from "bencode";
import getPeers from "#tracker";

const data = fs.readFileSync("puppy.torrent");
const torrent = bencode.decode(data, "utf8");
console.log("Torrent: ", torrent);

getPeers(torrent, (error, peers) => {
  if (error) {
    console.log("Error: ", error);
  }
  console.log("list of peers: ", peers);
});
