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
import { TwoToggleModel } from "@/components/two-toggle-model"
import { defaults } from "@/config/config"
import { ComboBox } from "@/components/combobox"
import { Slider } from "@/components/ui/slider"
import { ComboBoxModels } from "./combobox-models"

export function Settings() {
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
  const [mode, setMode] = useState(check_mode || defaults['mode'])
  const [model, setModel] = useState(check_model || defaults['model'])
  const [results, setResults] = useState(check_results || defaults['results'])
  const [sentences, setSentences] = useState(check_sentences || defaults['sentences'])
  const [threshold, setThreshold] = useState(check_threshold || defaults['threshold'])

  const handleSliderChange = (value: number[]) => {
    setThreshold(String(value));
  };

  const handleSaveChanges = () => {
    localStorage.setItem('mode', mode);
    localStorage.setItem('model', model);
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
            <Icons.cog className="h-5 w-5" />
          </div>
        </>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
         { /* <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mode" className="text-right">
              Model
            </Label>
            <TwoToggleModel value={model} onChange={setModel} />
          </div> */ }
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="results" className="text-right">
              Results
            </Label>
            <Input
              id="results"
              className="col-span-3"
              min={1}
              max={10}
              item="results"
              onChange={(e) => setResults(e.target.value)}
            />
          </div>
         {  <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
              Model
            </Label>
            <ComboBoxModels 
             
              value={model}
              onChange={setModel}
            />
          </div> }
          <div className="grid grid-cols-12 my-2">
            <Label htmlFor="threshold" className="text-center col-span-3">
              Similarity
            </Label>
            <Label className="text-center col-span-2">0.0</Label>
            <Slider
              value={[parseFloat(threshold)]}
              onValueChange={handleSliderChange}
              max={0.9}
              step={0.05}
              className="col-span-5"
            />
            <Label className="text-center col-span-2">0.9</Label>
          </div>
          <div className="text-white-400 text-xs grid grid-cols-1 gap-2">
            Similarity (a number between 0 and 1) 
            represents the relatedness of your prompt
            to the search results. A higher decimal represents higher
            similarity. Click save when you&apos;re done.
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSaveChanges}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
