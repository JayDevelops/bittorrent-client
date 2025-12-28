import fs from "fs";

const torrent = fs.readFileSync("puppy.torrent");
const torrentString = torrent.toString("utf8");

console.log(torrentString);
