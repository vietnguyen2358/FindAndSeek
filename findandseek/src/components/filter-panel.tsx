"use client"

import { useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export default function FilterPanel() {
  const [date, setDate] = useState<Date>()
  const [timeRange, setTimeRange] = useState([0, 24])

  return (
    <div className="p-4 space-y-4">
      {/* Date filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
            >
              {date ? format(date, "PPP") : "Select date..."}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time range filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Time Range</Label>
        <div className="pt-2 px-1">
          <Slider value={timeRange} min={0} max={24} step={1} onValueChange={setTimeRange} />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>{timeRange[0]}:00</span>
            <span>{timeRange[1]}:00</span>
          </div>
        </div>
      </div>

      {/* Location filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location</Label>
        <Input placeholder="Search locations..." />
        <div className="space-y-2 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="location-1" />
            <label
              htmlFor="location-1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Downtown Plaza
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="location-2" />
            <label
              htmlFor="location-2"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Central Park
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="location-3" />
            <label
              htmlFor="location-3"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Main Street
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="location-4" />
            <label
              htmlFor="location-4"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              City Hall
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="location-5" />
            <label
              htmlFor="location-5"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Transit Center
            </label>
          </div>
        </div>
      </div>

      {/* Person attributes filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Person Attributes</Label>
        <Input placeholder="Search attributes..." />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="attr-1" />
            <label
              htmlFor="attr-1"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Red Clothing
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="attr-2" />
            <label
              htmlFor="attr-2"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Blue Clothing
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="attr-3" />
            <label
              htmlFor="attr-3"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Backpack
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="attr-4" />
            <label
              htmlFor="attr-4"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hat/Cap
            </label>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" size="sm">
          Reset
        </Button>
        <Button size="sm">Apply Filters</Button>
      </div>
    </div>
  )
}

