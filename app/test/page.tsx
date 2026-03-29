'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TestRunnerPage() {
  const [variables, setVariables] = useState({
    product_name: 'Premium Wireless Headphones',
    product_category: 'Audio Equipment',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleVariableChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }))
  }

  const handleExecute = async () => {
    setIsLoading(true)
    try {
      // Mock execution
      await new Promise(resolve => setTimeout(resolve, 1000))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Test Runner</h1>
            <p className="text-slate-400">Execute and test prompts in real-time</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(variables).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-white text-sm">
                      Variable: {key}
                    </Label>
                    <Input
                      id={key}
                      value={value}
                      onChange={(e) => handleVariableChange(key, e.target.value)}
                      className="mt-1 bg-slate-700 border-slate-600 text-white text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={handleExecute}
              disabled={isLoading}
              className="w-full gap-2 h-12 text-base"
              size="lg"
            >
              <Play className="w-4 h-4" />
              {isLoading ? 'Executing...' : 'Execute Prompt'}
            </Button>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Output</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 p-4 rounded text-slate-200 text-sm">
                  Run a prompt to see output here
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
