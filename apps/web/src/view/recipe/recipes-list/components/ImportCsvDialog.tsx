'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/components/dialog'
import { Button } from '@/shared/ui/components/button'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import type { ImportReport } from '@/data'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<ImportReport>
  isImporting: boolean
}

export function ImportCsvDialog({ open, onOpenChange, onImport, isImporting }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportReport | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    const res = await onImport(file)
    setResult(res)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setFile(null)
      setResult(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Recipes from CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* File picker */}
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer hover:border-primary-default transition-colors"
          >
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-text-primary">
                <FileText size={20} />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="text-text-tertiary">
                <Upload size={24} className="mx-auto mb-2" />
                <p className="text-sm">Click to select CSV file</p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <Button onClick={handleUpload} disabled={!file || isImporting} className="w-full">
            {isImporting ? 'Importing...' : 'Import'}
          </Button>

          {/* Result. Partial success is the expected outcome, not a failure:
              a bad row is rejected on its own and the rest of the file goes in. */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={16} className="text-success-default" />
                <span className="text-text-primary font-medium">
                  {result.created} created, {result.updated} updated
                  {result.skipped > 0 ? `, ${result.skipped} skipped` : ''}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {result.errors.map((err) => (
                    <div key={`${err.row}-${err.importKey ?? ''}`} className="flex items-start gap-2 text-sm">
                      <AlertCircle size={14} className="text-error-default mt-0.5 shrink-0" />
                      <span className="text-text-secondary">
                        {/* The row number is the one the editor sees in Excel,
                            so the fix is a click away in their own file. */}
                        <strong>Row {err.row}</strong>
                        {err.importKey ? ` (${err.importKey})` : ''}: {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
