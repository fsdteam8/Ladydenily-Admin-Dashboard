"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Paperclip, Send } from "lucide-react"
import Image from "next/image"

export default function SignalSendPage() {
  const [message, setMessage] = useState("")

  const signals = [
    {
      id: 1,
      chart: "/trading-chart.png",
      content:
        "Just shared a new analysis on EUR/USD.\nLooking for a potential breakout above 1.0850.\nWhat do you all think?",
      targets: [
        { name: "Name", value: "100-200" },
        { name: "TB1", value: "100-200" },
        { name: "TB2", value: "100-200" },
        { name: "TB3", value: "100-200" },
        { name: "TB4", value: "100-200" },
        { name: "TB5", value: "100-200" },
      ],
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Signal Send</h1>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Signal Send</p>
      </div>

      <div className="space-y-6">
        {signals.map((signal) => (
          <Card key={signal.id} className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="mb-4">
                <Image
                  src={signal.chart || "/placeholder.svg"}
                  alt="Trading Chart"
                  width={600}
                  height={300}
                  className="rounded-lg w-full max-w-2xl"
                />
              </div>

              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-line">{signal.content}</p>
              </div>

              <div className="flex justify-end gap-2 mb-4">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {signal.targets.map((target, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{target.name}:</span>
                        <span className="text-sm font-medium">{target.value}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-end gap-4">
              <Button variant="ghost" size="sm" className="shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Textarea
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 min-h-[40px] resize-none border-0 focus-visible:ring-0 bg-transparent"
              />
              <Button size="sm" className="shrink-0 bg-[#F1C40F] hover:bg-[#F39C12] text-black">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
