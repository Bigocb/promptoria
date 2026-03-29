'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PromptsPage() {
  const [isCreating, setIsCreating] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Prompt Workspace</h1>
              <p className="text-slate-400">Compose and test prompts</p>
            </div>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isCreating && (
          <Card className="mb-8 bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Create New Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Prompt Name</Label>
                <Input id="name" placeholder="e.g., Product Description Generator" className="mt-2 bg-slate-700 border-slate-600 text-white" />
              </div>
              <div>
                <Label htmlFor="template" className="text-white">Template Body</Label>
                <Textarea id="template" placeholder="Enter your prompt template here..." className="mt-2 bg-slate-700 border-slate-600 text-white min-h-40" />
              </div>
              <Button>Create Prompt</Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-400">No prompts yet. Create one to get started!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
