export const SEARCH_ENDPOINT = process.env.NEXT_PUBLIC_SEARCH_ENDPOINT
export const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_CHAT_ENDPOINT

interface Default {
    mode: string
    model: string
    results: string
    sentences: string
    threshold: string
    [key: string]: string
    systemPrompt: string
}


export const defaults: Default = {
    "mode" : '2',
    "model" : 'openai.gpt-3.5-turbo',
    "results" : '5',
    "sentences" : 'short',
    "threshold" : '0.5',
    "systemPrompt": "You are helping devops engineers and cloud architects. Answer the question based only on the information provided between ## and give step by step guide. Do not copy word by word from the context.\
    #\
    {context}\
    #\
    Question: {question}\
    Answer:",
   
}

