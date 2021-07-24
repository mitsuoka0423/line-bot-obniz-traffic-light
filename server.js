"use strict";

require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const Obniz = require("obniz");
const PORT = process.env.PORT || 3000;

const obnizId = process.env.OBNIZ_ID || "obniz IDを記入";
const obniz = new Obniz(obnizId);

let light;

// obnizに接続できたら、信号LEDを使う準備をする
obniz.onconnect = async function () {
  light = obniz.wired("Keyestudio_TrafficLight", { gnd: 0, green: 1, yellow: 2, red: 3 });
};

const config = {
  channelSecret: process.env.CHANNEL_SECRET || "作成したBOTのチャンネルシークレット",
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || "作成したBOTのチャンネルアクセストークン",
};

const app = express();

app.get("/", (req, res) => res.send("Hello LINE BOT!(GET)")); //ブラウザ確認用(無くても問題ない)
app.post("/webhook", line.middleware(config), (req, res) => {
  console.log(req.body.events);

  //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
  if (req.body.events[0].replyToken === "00000000000000000000000000000000" && req.body.events[1].replyToken === "ffffffffffffffffffffffffffffffff") {
    res.send("Hello LINE BOT!(POST)");
    console.log("疎通確認用");
    return;
  }

  Promise.all(req.body.events.map(handleEvent)).then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  let text = event.message.text;

  // メッセージによって信号LEDを点灯させる
  if (event.message.text === '緑') {
    light.single('green');
    text = '緑色を点灯しました！';
  } else if (event.message.text === '黄') {
    light.single('yellow');
    text = '黄色を点灯しました！';
  } else if (event.message.text === '赤') {
    light.single('red');
    text = '赤色を点灯しました！';
  }

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: text,
  });
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);
