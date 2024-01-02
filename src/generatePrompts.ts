import 'dotenv/config'
import axios from "axios"

export async function generatePrompts(topic: string, numPrompts = 5) {
  const openai = axios.create({
    baseURL: "https://api.openai.com/v1",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.OPENAI_API_KEY,
    },
  })

  const options = {
    model: "gpt-3.5-turbo",
    temperature: 0.8,
    max_tokens: 500,
  }

  const prompt = `I want you to generate ${numPrompts} prompts related to "${topic}" to be used later for midjourney ai image creation. This images are going to be used later creating a video for tiktok, asking the user what he preffers.
    -(using car as an example) your prompts should be short and look like: "Luxury black car, full view, ultra realistic" or "Futuristic scifi car, full view, ultra realistic". 
    -you should always use singular, so if topic is "cars", use "car" in your prompts.
    -This is used for video generation where user has to pick one choice, so prompts should be different but follow a similar flow.
    -return one prompt per line and without numbers at the start, just the prompt
    -No cartoony style, i want all prompts to be specified that it needs to be realistic
    -If topic is an object, i want one prompt to have the adjective "futuristic" and another one with the adjective "luxury"
    -No "close up view"
    -No quotes around the prompt`

  const messages = [{ role: "user", content: prompt }]

  async function createChatCompletion(messages, options = {}) {
    try {
      const response = await openai.post("/chat/completions", {
        messages,
        ...options,
      })
      return response.data.choices[0].message.content
    } catch (error) {
      console.error("Error creating chat completion:", error)
    }
  }

  const choices = await createChatCompletion(messages, options)
  const prompts = choices.split("\n")
  return prompts
}
