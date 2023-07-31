"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { defaults } from "@/config/config"

'bedrock.ai21.j2-grande-instruct'
'bedrock.ai21.j2-jumbo-instruct'
'bedrock.anthropic.claude-instant-v1'
'bedrock.anthropic.claude-v1'

const options = [
  {
    value: 'bedrock.amazon.titan-tg1-large' ,
    label: "bedrock.amazon.titan-tg1-large",
  },
  {
    value: "bedrock.ai21.j2-grande-instruct",
    label: "bedrock.ai21.j2-grande-instruct",
  },
  {
    value: "bedrock.ai21.j2-jumbo-instruct",
    label: "bedrock.ai21.j2-jumbo-instruct",
  },
  {
    value: "bedrock.anthropic.claude-instant-v1",
    label: "bedrock.anthropic.claude-instant-v1",
  },
  {
    value: "bedrock.anthropic.claude-v1",
    label: "bedrock.anthropic.claude-v1",
  },
  {
    value: "openai.gpt-3.5-turbo",
    label: "openai.gpt-3.5-turbo",
  },
  {
    value: "openai.text-davinci-003",
    label: "openai.text-davinci-003",
  }
  ,
  {
    value: "sagemaker.falcon-16b-instruct",
    label: "sagemaker.falcon-16b-instruct",
  }
  
]

export function ComboBoxModels({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? options.find((options) => options.value === value)?.label
            : localStorage.getItem("sentence") || defaults["sentence"]}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandGroup>
            {options.map((options) => (
              <CommandItem
                key={options.value}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === options.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {options.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
