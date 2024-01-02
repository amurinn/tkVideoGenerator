import dotenv from "dotenv"
import { createInterface } from 'readline';
import { generatePrompts } from "./generatePrompts"
import { generateImages } from "./generateImages"
import { generateVideo } from "./generateVideo"

dotenv.config({ path: "../.env" })

const functionName = process.argv[2]
const args = process.argv.slice(3)

switch (functionName) {
  case "generatePrompts":
    const generatedPrompts = await generatePrompts(
      args[0],
      parseInt(args[1]) || 5
    )
    const satisfied = await promptSatisfaction(generatedPrompts)
    if (satisfied) {
      await generateImages(generatedPrompts)
    } else {
      console.log("Exiting")
    }
    break
  case "generateVideo":
    await generateVideo(args[0], args[1], args[2])
    break
  default:
    console.log("Invalid function name")
}

async function promptSatisfaction(prompts: string[]): Promise<boolean> {
  console.log("Generated prompts:")
  prompts.forEach((prompt, index) => {
    console.log(`${index + 1}. ${prompt}`)
  })

  const response = await askQuestion(
    "Are you satisfied with the generated prompts? (Y/N): "
  )
  return response.trim().toLowerCase() === "y"
}

async function askQuestion(question: string): Promise<string> {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    readline.question(question, (answer: string) => {
      readline.close()
      resolve(answer)
    })
  })
}
