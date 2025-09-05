import * as React from "react"
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UNIVERSITIES } from "@/data/universities"
import { UNIVERSITIES_EN } from "@/data/universities2"
import { useIsMobile } from "@/hooks/use-mobile"

interface UniversityComboboxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  language?: 'ar' | 'en'
  onLanguageChange?: (lang: 'ar' | 'en') => void
}

export function UniversityCombobox({ 
  value, 
  onChange, 
  placeholder,
  language = 'ar',
  onLanguageChange
}: UniversityComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const isMobile = useIsMobile()

  // Get universities based on language
  const getUniversities = () => {
    if (language === 'en') {
      return Array.isArray(UNIVERSITIES_EN) ? UNIVERSITIES_EN : []
    }
    return Array.isArray(UNIVERSITIES) ? UNIVERSITIES : []
  }

  const universities = getUniversities()

  // Get localized text
  const getText = (key: string) => {
    const texts = {
      ar: {
        search: "ابحث عن الجامعة...",
        notFound: "لم يتم العثور على جامعة بهذا الاسم",
        selectPlaceholder: "اختر الجامعة..."
      },
      en: {
        search: "Search for university...",
        notFound: "No university found with this name",
        selectPlaceholder: "Select university..."
      }
    }
    return texts[language][key] || texts.ar[key]
  }

  const filteredUniversities = searchQuery === ""
    ? universities
    : universities.filter(university =>
        university.toLowerCase().includes(searchQuery.toLowerCase())
      )

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "") {
      onChange("")
      setOpen(false)
      setSearchQuery("")
      return
    }
    onChange(selectedValue === value ? "" : selectedValue)
    setOpen(false)
    setSearchQuery("")
  }

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery && !filteredUniversities.includes(searchQuery)) {
      e.preventDefault()
      onChange(searchQuery)
      setOpen(false)
      setSearchQuery("")
    }
  }

  // Get the appropriate placeholder based on language
  const getPlaceholder = () => {
    if (placeholder && placeholder !== "اختر الجامعة...") {
      return placeholder
    }
    return getText('selectPlaceholder')
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-md border border-green-200 bg-white/40 backdrop-blur-sm py-2 text-right font-normal text-gray-800 hover:bg-white/50 transition-colors focus:ring-1 focus:ring-green-300 focus:border-green-300"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            <div className={cn(
              "flex items-center w-full",
              language === 'ar' ? 'flex-row-reverse' : 'flex-row'
            )}>
              <ChevronsUpDown className={cn(
                "h-4 w-4 shrink-0 opacity-50 text-gray-500",
                language === 'ar' ? 'ml-2' : 'mr-2'
              )} />
              <span className={cn(
                "truncate text-sm font-medium w-full",
                language === 'ar' ? 'text-right' : 'text-left'
              )}>
                {value || getPlaceholder()}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-full p-0 rounded-md border border-green-200 bg-white/50 backdrop-blur-sm shadow-lg"
          align="start"
          sideOffset={5}
          style={{ 
            width: isMobile ? 'calc(100vw - 24px)' : undefined,
            direction: language === 'ar' ? 'rtl' : 'ltr',
            textAlign: language === 'ar' ? 'right' : 'left'
          }}
        >
          <Command dir={language === 'ar' ? 'rtl' : 'ltr'} className="bg-transparent rounded-md">
            <CommandInput 
              placeholder={getText('search')}
              className="h-10 border-none text-sm bg-transparent focus:ring-0"
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={handleCustomSubmit}
              style={{ 
                textAlign: language === 'ar' ? 'right' : 'left', 
                direction: language === 'ar' ? 'rtl' : 'ltr' 
              }}
            />
            <CommandList className="max-h-64 overflow-y-auto">
              <CommandEmpty>
                <div className={cn(
                  "px-2 py-3 text-sm text-gray-600",
                  language === 'ar' ? 'text-right' : 'text-left'
                )}>
                  {getText('notFound')}
                </div>
              </CommandEmpty>
              <CommandGroup className="py-1">
                {filteredUniversities.map((university) => (
                  <CommandItem
                    key={university}
                    value={university}
                    onSelect={handleSelect}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    className={cn(
                      "cursor-pointer transition-all duration-200 py-2 px-3 flex items-center justify-between gap-2",
                      language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left',
                      value === university ? "bg-green-100/70 border border-green-300 rounded-md" : "hover:bg-green-100/40"
                    )}
                    style={{ textAlign: language === 'ar' ? 'right' : 'left' }}
                  >
                    <div className={cn(
                      "flex items-center gap-2 w-full",
                      language === 'ar' ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <GraduationCap className={cn(
                        "h-4 w-4 text-green-500",
                        language === 'ar' ? 'ml-1' : 'mr-1'
                      )} />
                      <span className={cn(
                        "truncate w-full",
                        language === 'ar' ? 'text-right' : 'text-left'
                      )}>
                        {university}
                      </span>
                    </div>
                    {value === university && (
                      <Check className={cn(
                        "h-4 w-4 text-green-600",
                        language === 'ar' ? 'ml-1' : 'mr-1'
                      )} />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}