"use client"

import { useRef, useState } from "react"

import { siteConfig } from "@/config/site"
import { OutputComponent } from "@/components/cases"
import { Prompt } from "@/components/prompt"

export default function IndexPage() {
  const [chat, setChat] = useState(0)
  const [isLoading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const check_model = typeof window !== "undefined" ? localStorage.getItem("model") : ""
  var model = ""
  if(check_model == "2"){model="OpenAI"}
  if(check_model == "1"){model="Titan"}
  return (
    <section className="container grid items-center gap-4 pb-2 pt-1 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl leading-tight tracking-tight md:text-3xl font-mono">
        <span className="font-extrabold">Q&A with{" "}</span>
          <span className="font-extrabold text-sky-500">
            <a href={siteConfig.links.documentation}>AWS Events Video</a>
          </span>{" "}
          <br className="hidden sm:inline" />
        </h1>
      </div>
      <Prompt onChange={setChat} setLoading={setLoading} setData={setData} />
      <OutputComponent chat={chat} isLoading={isLoading} data={data} />
    </section>
  )
}
