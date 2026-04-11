"use client"

import { useEffect, useId, useState, type ChangeEvent, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type MarketItem, type MarketItemPayload, type MarketItemType } from "@/lib/api"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

const MARKET_TYPES: MarketItemType[] = ["best seller", "free", "recommended"]

type MarketItemFormState = {
  title: string
  description: string
  price: string
  type: MarketItemType
  shopeLink: string
}

const EMPTY_FORM_STATE: MarketItemFormState = {
  title: "",
  description: "",
  price: "",
  type: "best seller",
  shopeLink: "",
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return ["http:", "https:"].includes(url.protocol)
  } catch (error) {
    return false
  }
}

function createFormState(item?: MarketItem | null): MarketItemFormState {
  if (!item) {
    return EMPTY_FORM_STATE
  }

  return {
    title: item.title,
    description: item.description,
    price: item.price === undefined || item.price === null ? "" : String(item.price),
    type: item.type,
    shopeLink: item.shopeLink || "",
  }
}

type MarketItemFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  submitLabel: string
  isLoading: boolean
  initialData?: MarketItem | null
  onClose: () => void
  onSubmit: (payload: MarketItemPayload) => void
}

export function MarketItemFormModal({
  isOpen,
  title,
  description,
  submitLabel,
  isLoading,
  initialData,
  onClose,
  onSubmit,
}: MarketItemFormModalProps) {
  const inputId = useId()
  const [formData, setFormData] = useState<MarketItemFormState>(EMPTY_FORM_STATE)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setImageFile(null)
      setImagePreview((currentPreview) => {
        if (currentPreview) {
          URL.revokeObjectURL(currentPreview)
        }
        return null
      })
      return
    }

    setFormData(createFormState(initialData))
    setImageFile(null)
    setImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }
      return null
    })
  }, [initialData, isOpen])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const handleInputChange = (field: keyof MarketItemFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    const nextPreview = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview((currentPreview) => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview)
      }
      return nextPreview
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = formData.title.trim()
    const trimmedDescription = formData.description.trim()
    const trimmedShopeLink = formData.shopeLink.trim()
    const trimmedPrice = formData.price.trim()
    const hasImage = Boolean(imageFile || initialData?.image)

    if (!trimmedTitle || !trimmedDescription || !trimmedShopeLink) {
      toast.error("Title, description and shope link are required")
      return
    }

    if (!hasImage) {
      toast.error("Image is required")
      return
    }

    if (!isValidHttpUrl(trimmedShopeLink)) {
      toast.error("Shope link must be a valid URL")
      return
    }

    if (trimmedPrice && Number.isNaN(Number(trimmedPrice))) {
      toast.error("Price must be a valid number")
      return
    }

    onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      price: trimmedPrice ? Number(trimmedPrice) : null,
      type: formData.type,
      image: imageFile,
      shopeLink: trimmedShopeLink,
    })
  }

  const previewSource = imagePreview || initialData?.image || null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-x-hidden">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="market-title">Title</Label>
              <Input
                id="market-title"
                value={formData.title}
                onChange={(event) => handleInputChange("title", event.target.value)}
                placeholder="Enter item title"
                required
              />
            </div>

            <div className="min-w-0 space-y-2">
              <Label htmlFor="market-type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value as MarketItemType)}>
                <SelectTrigger id="market-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MARKET_TYPES.map((marketType) => (
                    <SelectItem key={marketType} value={marketType}>
                      {marketType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="market-description">Description</Label>
            <Textarea
              id="market-description"
              value={formData.description}
              onChange={(event) => handleInputChange("description", event.target.value)}
              placeholder="Write a short description"
              className="min-h-32"
              required
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="market-price">Price</Label>
              <Input
                id="market-price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(event) => handleInputChange("price", event.target.value)}
                placeholder="Optional for free items"
              />
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Image Upload</Label>
              <div className="max-w-full rounded-lg border border-dashed border-border bg-muted/20 p-4">
                <div className="flex min-h-40 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                  {previewSource ? (
                    <img src={previewSource} alt="Market item preview" className="h-40 w-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span>Upload market item image</span>
                    </div>
                  )}
                </div>

                <input id={inputId} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

                <div className="mt-3 space-y-3">
                  <p className="break-all text-xs leading-5 text-muted-foreground">
                    {imageFile ? imageFile.name : "PNG, JPG or WebP up to 5MB"}
                  </p>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                    <label htmlFor={inputId} className="cursor-pointer">
                      {previewSource ? "Replace Image" : "Upload Image"}
                    </label>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="market-shope-link">Shope Link</Label>
            <Input
              id="market-shope-link"
              type="url"
              value={formData.shopeLink}
              onChange={(event) => handleInputChange("shopeLink", event.target.value)}
              placeholder="https://example.com/product"
              required
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
