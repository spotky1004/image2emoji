import initEnv from "./env.js";
initEnv();
import Discord from "discord.js";
import Canvas, { loadImage } from "canvas";
import path from "path";
import axios from "axios";
import fs from "fs";
import { getNearestEmoji } from "./emojiData.js";

const prefix = "image2emoji";
const client = new Discord.Client({
  intents: [
    "GUILD_MESSAGES",
    "GUILDS"
  ],
});

client.on("ready", () => {
  console.log("Online!");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.includes(prefix)) return;
  const attachment = message.attachments.first();
  if (!attachment) return;
  const type = attachment.contentType;
  if (type !== "image/png") return;
  const fileName = `${Date.now()}.png`;
  await downloadURL(attachment.url, fileName);
  const filePath = path.join("bin", fileName);
  const file = fs.readFileSync(filePath);

  let size = parseInt(message.content.split(" ")[1]);
  if (
    isNaN(size) || 0 > size || size > 50 
  ) size = 20;

  const image = await loadImage(file);
  const canvas = Canvas.createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const maxDiv = Math.max(1, image.width/canvas.width, image.height/canvas.height);
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, image.width/maxDiv, image.height/maxDiv);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let toSend = "";
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (x + y*canvas.width)*4;
      const [r, g, b] = imageData.slice(idx, idx+4);
      toSend += getNearestEmoji([r, g, b]);
    }
    toSend += "\n";
  }

  const lines = toSend.split("\n");
  const linePerMessage = Math.floor(140/canvas.width);
  if (linePerMessage < 1) return;
  for (let i = 0; i < lines.length; i += linePerMessage) {
    const part = lines.slice(i, i+linePerMessage).join("\n");
    if (part.length === 0) return;
    await message.channel.send(part);
  }

  fs.unlinkSync(filePath);
});

async function downloadURL(url: string, fileName: string) {
  if (!fs.existsSync("bin")) {
    fs.mkdirSync("bin");
  }

  await axios({
    url,
    responseType: "stream"
  }).then(
    async response => {
      await new Promise((res, rej) => {
        response.data
          .pipe(fs.createWriteStream(path.join("bin", fileName)))
          .on("finish", () => res("done"))
          .on("error", () => rej())
      });
    }
  );
}

client.login(process.env.TOKEN);
