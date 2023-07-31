"use client"

import { ChangeEvent, useState } from "react"
import { Icons } from "@/icons/icons"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TwoToggle } from "@/components/two-toggle"
import { defaults } from "@/config/config"
import { ComboBox } from "@/components/combobox"
import { Slider } from "@/components/ui/slider"

export function Summary({ data }: { data: any }) {
  const check_mode =
    typeof window !== "undefined" ? localStorage.getItem("mode") : null
  const check_results =
    typeof window !== "undefined" ? localStorage.getItem("results") : null
  const check_sentences = 
    typeof window !== 'undefined' ? localStorage.getItem('sentences') : null
  const check_threshold = 
    typeof window !== 'undefined' ? localStorage.getItem('threshold') : null
  const [mode, setMode] = useState(check_mode || defaults['mode'])
  const [results, setResults] = useState(check_results || defaults['results'])
  const [sentences, setSentences] = useState(check_sentences || defaults['sentences'])
  const [threshold, setThreshold] = useState(check_threshold || defaults['threshold'])

  const handleSliderChange = (value: number[]) => {
    setThreshold(String(value));
  };

  const handleSaveChanges = () => {
    localStorage.setItem('mode', mode);
    localStorage.setItem('sentences', sentences);
    localStorage.setItem('threshold', threshold);
    if (Number(results) < 1 || isNaN(Number(results))) {
      setResults(String(1))
      localStorage.setItem("results", "1")
    } else if (Number(results) > 10) {
      setResults(String(10))
      localStorage.setItem("results", "10")
    } else {
      localStorage.setItem("results", results)
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <>
          <div
            className={buttonVariants({
              size: "sm",
              variant: "ghost",
            })}
          >
            <Icons.subtitles className="h-5 w-5" />
          </div>
        </>
      </DialogTrigger>
      <DialogContent className="max-w-[80%] max-h-[32rem] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle>Summary</DialogTitle>
          <DialogDescription className="text-white-400 text-base">
           {data}
          </DialogDescription>
        </DialogHeader>
       
        <DialogFooter>
        
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
