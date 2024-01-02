import 'dotenv/config'
import axios from "axios"
import { spawn } from "child_process"
import fs from "fs/promises"

export async function generateVideo(
  topic: string,
  firstLine: string,
  secondLine: string
) {
  const outputVideoPath = "../generated/videos/output.mp4"
  const overlayVideoPath = "../generated/videos/output2.mp4"
  const fontFile = "../generated/font/Roboto-Bold.ttf"

  //Intro video
  await processIntroVideo(topic, firstLine, secondLine, fontFile)

  // Step 1: Process the first video
  await processVideoStep(
    "../generated/images/%d.png",
    `scale=1080:1080, drawtext=text='%{frame_num}.': start_number=1 :fontfile=${fontFile}:fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2 :borderw=5:bordercolor=black`,
    outputVideoPath
  )

  // Step 2: Process the second video
  await processVideoStep(
    "../generated/images/%d.png",
    "scale=1080:1920,setsar=1:1[main];[main]split[main][bg];[bg]boxblur=70[bg];[main][bg]overlay=(W-w)/2:(H-h)/2",
    overlayVideoPath
  )

  // Step 3: Merge the processed videos
  await mergeVideos(
    outputVideoPath,
    overlayVideoPath,
    "../generated/videos/merged.mp4"
  )

  //Final video
  await finalVideo()

  //Final video with sound
  await finalVideoWithSound()
}

async function processVideoStep(
  inputPattern: string,
  vfFilter: string,
  outputVideoPath: string
) {
  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-framerate",
      "1/3",
      "-i",
      inputPattern,
      "-vf",
      vfFilter,
      "-c:v",
      "libx264",
      "-r",
      "30",
      "-t",
      "15",
      "-pix_fmt",
      "yuv420p",
      outputVideoPath,
    ],
    { cwd: "src", stdio: "inherit" }
  )

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Video processing failed with code ${code}`)
      }
    })
  })
}

async function mergeVideos(
  inputVideoPath: string,
  overlayVideoPath: string,
  outputVideoPath: string
) {
  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-i",
      overlayVideoPath,
      "-i",
      inputVideoPath,
      "-filter_complex",
      "[0:v][1:v]overlay=(W-w)/2:(H-h)/2[out]",
      "-map",
      "[out]",
      "-c:v",
      "libx264",
      "-b:v",
      "3000k", // Adjust bitrate as needed
      "-r",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac", // Use AAC audio codec
      "-strict",
      "experimental",
      "-b:a",
      "192k", // Adjust audio bitrate as needed
      outputVideoPath,
    ],
    { cwd: "src", stdio: "inherit" }
  )

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Video merging failed with code ${code}`)
      }
    })
  })
}

async function getIntroVideo(topic: string) {
  const search = await axios.get("https://api.pexels.com/videos/search", {
    params: {
      query: topic,
      orientation: "portrait",
      total_results: 1,
      per_page: 1,
    },
    headers: {
      Authorization: process.env.PEXELS_API_KEY,
    },
  })

  const videoUrl = search.data.videos[0].video_files[0].link
  console.log(videoUrl)
  const filename = `./generated/videos/pexels.mp4`

  try {
    await downloadVideo(videoUrl, filename)
    console.log("Video downloaded successfully!")
  } catch (error) {
    console.error("Error downloading video:", error)
  }
}

async function downloadVideo(url, filename) {
  const response = await axios({
    method: "get",
    url: url,
    responseType: "arraybuffer",
  })

  await fs.writeFile(filename, Buffer.from(response.data, "binary"))
}

async function processIntroVideo(
  topic: string,
  firstLine: string,
  secondLine: string,
  fontFile: string
) {
  //await getIntroVideo(topic)

  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-i",
      "../generated/videos/pexels.mp4",
      "-vf",
      `scale=1080:1920, drawtext=text='${firstLine}':fontsize=80:fontcolor=white:fontfile=${fontFile}:x=(w-text_w)/2:y=(h-text_h)/3:borderw=5:bordercolor=black,drawtext=text='${secondLine}':fontsize=80:fontcolor=white:fontfile=${fontFile}:x=(w-text_w)/2:y=(h+text_h)/2.8:borderw=5:bordercolor=black`,
      "-t",
      "4",
      "-c:v",
      "libx264",
      "-b:v",
      "3000k", // Adjust bitrate as needed
      "-r",
      "30",
      "-c:a",
      "aac", // Use AAC audio codec
      "-strict",
      "experimental",
      "-b:a",
      "192k", // Adjust audio bitrate as needed
      "-pix_fmt",
      "yuv420p",
      "../generated/videos/intro.mp4",
    ],
    { cwd: "src", stdio: "inherit" }
  )

  ffmpegProcess.on("error", (err) => {
    console.error("Error executing FFmpeg:", err)
  })

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Video 4 failed with code ${code}`)
      }
    })
  })
}

async function finalVideo() {
  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-i",
      "../generated/videos/intro.mp4",
      "-i",
      "../generated/videos/merged.mp4",
      "-filter_complex",
      "concat=n=2:v=1:a=0 [v]",
      "-map",
      "[v]",
      "-c:v",
      "libx264",
      "-b:v",
      "3000k", // Adjust bitrate as needed
      "-r",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac", // Use AAC audio codec
      "-strict",
      "experimental",
      "-b:a",
      "192k", // Adjust audio bitrate as needed
      "../generated/videos/final.mp4",
    ],
    { cwd: "src", stdio: "inherit" }
  )

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Video 5 failed with code ${code}`)
      }
    })
  })
}

async function finalVideoWithSound() {
  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-i",
      "../generated/videos/final.mp4",
      "-i",
      "../generated/audio/letgo_slow.mp3",
      "-c:v",
      "libx264",
      "-b:v",
      "3000k", // Adjust bitrate as needed
      "-r",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac", // Use AAC audio codec
      "-strict",
      "experimental",
      "-b:a",
      "192k", // Adjust audio bitrate as needed
      "../generated/videos/final_sound.mp4",
    ],
    { cwd: "src", stdio: "inherit" }
  )

  return new Promise<void>((resolve, reject) => {
    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(`Video 6 failed with code ${code}`)
      }
    })
  })
}
