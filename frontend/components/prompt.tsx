"use client"

import * as React from "react"
import { ChangeEvent, useState } from "react"
import Link from "next/link"
import { Icons } from "@/icons/icons"
import { fetchData1 } from "lib/api"

import { Button } from "@/components/ui/button"
import { Input, TextInput } from "@/components/ui/input"
import { defaults } from "@/config/config";

export function Prompt({
  onChange,
  setLoading,
  setData,
}: {
  onChange: (value: React.SetStateAction<number>) => void
  setLoading: (value: boolean) => void
  setData: (value: any) => void
}) {
  const check_system_prompt = typeof window !== "undefined" ? localStorage.getItem("systemPrompt") : null
  const [textareaValue, setTextareaValue] = useState("")
  //const [textareaValueSystemPrompt, setTextareaValueSystemPrompt] = useState("")
  const [disabled, setDisable] = useState(false)
  const [noSubmit, setNoSubmit] = useState(true)
  const [textareaValueSystemPrompt, setTextareaValueSystemPrompt] = useState(check_system_prompt || defaults['systemPrompt'])
  const [isOpen, setIsOpen] = useState(false);
  
  function toggle() {
    setIsOpen((isOpen) => !isOpen);
  }

  const handleTextareaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.value.length > 0) {
      setNoSubmit(false)
    } else {
      setNoSubmit(true)
    }

    setTextareaValue(event.target.value)
  }
  const handleTextareaChangeSystemPrompt = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (event.target.value.length > 0) {
      setNoSubmit(false)
    } else {
      setNoSubmit(true)
    }
    setTextareaValueSystemPrompt(event.target.value)
    localStorage.setItem('systemPrompt', event.target.value);
  }

  const clearPrompt = () => {
    setNoSubmit(true)
    setTextareaValue("")
  }
  var systemPromptHidden = false
  const toogleSystemPrompt = () => {
    if (systemPromptHidden == false){
      //todo: hide
      systemPromptHidden = true
    }
    else{
      //todo: show
      systemPromptHidden = false
    }
  }
  
  const listener = (event: any) => {
    if (event.key === "Enter" && !event.shiftKey) {
      callAPI()
    }
  }

  const callAPI = async () => {
    if (!noSubmit) {
      try {
        setDisable(true)
        setLoading(true)
        const check_mode =
          typeof window !== "undefined" ? localStorage.getItem("mode") : null
        const check_model =
          typeof window !== "undefined" ? localStorage.getItem("model") : null
        const check_results =
          typeof window !== "undefined" ? localStorage.getItem("results") : null
        const check_sentences = 
          typeof window !== 'undefined' ? localStorage.getItem('sentences') : null
        const check_threshold = 
          typeof window !== 'undefined' ? localStorage.getItem('threshold') : null
        onChange(Number(check_mode || defaults['mode']))
        const data = await fetchData1(
          textareaValue,
          textareaValueSystemPrompt,
          check_mode || defaults['mode'],
          check_model || defaults['model'],
          check_results || defaults['results'], 
          check_sentences || defaults['sentences'],
          check_threshold || defaults['threshold']

        )
        
        setData(data)
        setLoading(false)
        setDisable(false)
      } catch (err) {
        setDisable(false)
        setLoading(false)
        console.log(err)
      }
    }
  }

  return (
    <React.Fragment>
      <div className="flex items-end gap-4 w-full relative">
        <Icons.search className="absolute left-4 top-10 transform -translate-y-1/2 h-8 w-8" />
        <TextInput
          className="pr-20 resize-none overflow-hidden pt-2 pb-2"
          placeholder="Enter you question here"
          id="prompt"
          disabled={disabled}
          value={textareaValue}
          onChange={handleTextareaChange}
          onKeyDown={(e) => listener(e)}
          rows={1}
        />
        
        <Button
          disabled={noSubmit}
          className="absolute right-3 top-10 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 rounded-lg h-14 w-14"
          onClick={callAPI}
        >
          <Icons.in />
        </Button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link
          href=""
          className="text-sky-500 -translate-y-1/3 font-semibold pr-4"
          onClick={clearPrompt}
        >
          Clear Prompt
        </Link>
      </div>
      
      <div className="text-sky-500 font-semibold pr-4">
      <Link
          href=""
          className="text-sky-500 -translate-y-1/3 font-semibold pr-4"
          onClick={toggle}>
          System Prompt
        </Link>
        </div>
        {isOpen && 
        <div className="flex items-end gap-4 w-full relative" >
          <TextInput 
            className="pr-20 resize-none overflow-y-auto pt-6 pb-2 h-64"
            placeholder="Enter your system prompt. use {question} for the question placeholder"
            id="systemPrompt"
            disabled={disabled}
            value={textareaValueSystemPrompt}
            onChange={handleTextareaChangeSystemPrompt}
            onKeyDown={(e) => listener(e)}
            rows={1}
          />
        </div>
    }
    </React.Fragment>
  )
}
