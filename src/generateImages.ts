import "dotenv/config"
import { Midjourney } from "midjourney"
import axios from "axios"
import fs from "fs/promises"
import readline from "readline"

export async function generateImages(prompts: string[]) {
  const client = new Midjourney({
    ServerId: process.env.SERVER_ID,
    ChannelId: process.env.CHANNEL_ID,
    SalaiToken: process.env.SALAI_TOKEN,
    Debug: false,
    Ws: true,
  })

  await client.Connect()

  const images = []

  for (let i = 0; i < prompts.length; i++) {
    const prompt = prompts[i];
    const Imagine = await client.Imagine(
      prompt,
      (uri: string, progress: string) => {
        process.stdout.write(`Generating Image ${i + 1} | ${progress}\r`);
      }
    )

    if (!Imagine) {
      continue
    }

    console.log()

    const index = await askForImageIndex()
    const Upscale = await client.Upscale({
      index,
      msgId: Imagine.id as string,
      hash: Imagine.hash as string,
      flags: Imagine.flags,
      loading: (uri: string, progress: string) => {
        console.log("Upscale.loading", uri, "progress", progress)
      },
    })

    //@ts-ignore
    images.push(Upscale.uri)

    console.log(`Image ${i+1} generated`)
  }

  client.Close()

  // Download images
  console.log("Downloading Images...")
  const downloadPromises = images.map(async (image, index) => {
    console.log(`Image ${index + 1} downloaded`)
    const response = await axios.get(image, { responseType: "arraybuffer" })
    const filename = `./generated/images/${index + 1}.png`
    await fs.writeFile(filename, response.data)
  })

  await Promise.all(downloadPromises)
}

async function askForImageIndex(): Promise<1 | 2 | 3 | 4> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question("Pick one image (1, 2, 3, or 4): ", (answer) => {
      rl.close()
      const index = parseInt(answer, 10) as 1 | 2 | 3 | 4
      if (isNaN(index) || index < 1 || index > 4) {
        console.log("Invalid input. Please enter a number between 1 and 4.")
        resolve(askForImageIndex())
      } else {
        resolve(index)
      }
    })
  })
}
