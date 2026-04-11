"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { marketAPI, type MarketItem, type MarketItemPayload, type MarketItemType } from "@/lib/api"
import { ExternalLink, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { MarketItemFormModal } from "./market-item-form-modal"

const MARKET_TYPES: MarketItemType[] = ["best seller", "free", "recommended"]

type MarketFilter = "all" | MarketItemType

function formatDate(value?: string) {
  if (!value) return "N/A"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "N/A"
  }

  return date.toLocaleDateString()
}

function formatPrice(item: MarketItem) {
  if (item.type === "free") {
    return "Free"
  }

  if (item.price === undefined || item.price === null || Number.isNaN(Number(item.price))) {
    return "N/A"
  }

  return `$${Number(item.price).toFixed(2)}`
}

function formatLinkHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch (error) {
    return value
  }
}

function getBadgeVariant(type: MarketItemType): "default" | "secondary" | "outline" {
  if (type === "best seller") return "default"
  if (type === "recommended") return "secondary"
  return "outline"
}

export default function MarketPlacePage() {
  const [typeFilter, setTypeFilter] = useState<MarketFilter>("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editModal, setEditModal] = useState<{ isOpen: boolean; item: MarketItem | null }>({
    isOpen: false,
    item: null,
  })
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: MarketItem | null }>({
    isOpen: false,
    item: null,
  })

  const queryClient = useQueryClient()

  const {
    data: marketItemsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["market-items", typeFilter],
    queryFn: () => marketAPI.getMarketItems(typeFilter === "all" ? undefined : typeFilter),
  })

  const createMarketItemMutation = useMutation({
    mutationFn: marketAPI.createMarketItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-items"] })
      toast.success("Market item created successfully")
      setIsCreateModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create market item")
    },
  })

  const updateMarketItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketItemPayload }) => marketAPI.updateMarketItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-items"] })
      toast.success("Market item updated successfully")
      setEditModal({ isOpen: false, item: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update market item")
    },
  })

  const deleteMarketItemMutation = useMutation({
    mutationFn: marketAPI.deleteMarketItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-items"] })
      toast.success("Market item deleted successfully")
      setDeleteModal({ isOpen: false, item: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete market item")
    },
  })

  const items = marketItemsData?.data || []

  const handleDeleteConfirm = () => {
    if (!deleteModal.item) return
    deleteMarketItemMutation.mutate(deleteModal.item._id)
  }

  if (error) {
    return (
      <div className="p-6 pt-12">
        <div className="bg-card rounded-lg border border-border p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Market Place</h1>
            <p className="text-sm text-muted-foreground">Dashboard &gt; Market Place</p>
          </div>
          <p className="text-sm text-red-500">Failed to load market items. Please try again.</p>
          <Button onClick={() => refetch()} className="w-fit">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-12 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Market Place</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Market Place</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as MarketFilter)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {MARKET_TYPES.map((marketType) => (
                <SelectItem key={marketType} value={marketType}>
                  {marketType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Market Item
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Item</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Type</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Price</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Shope Link</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Updated At</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-14 w-14 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-56" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))
                : items.map((item, index) => (
                    <tr key={item._id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="h-14 w-14 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-lg font-semibold text-muted-foreground">
                              {item.title.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="max-w-sm text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getBadgeVariant(item.type)} className="capitalize">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="p-4 text-foreground">{formatPrice(item)}</td>
                      <td className="p-4">
                        {item.shopeLink ? (
                          <a
                            href={item.shopeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                          >
                            {formatLinkHost(item.shopeLink)}
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not set</span>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">{formatDate(item.updatedAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10"
                            onClick={() => setEditModal({ isOpen: true, item })}
                          >
                            <Pencil className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteModal({ isOpen: true, item })}
                            disabled={deleteMarketItemMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

              {!isLoading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="space-y-2">
                      <p className="text-base font-medium text-foreground">No market items found</p>
                      <p className="text-sm text-muted-foreground">
                        Add a new item or change the filter to see more results.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {isLoading ? "Loading market items..." : `${items.length} market item${items.length === 1 ? "" : "s"} found`}
        </div>
      </div>

      <MarketItemFormModal
        isOpen={isCreateModalOpen}
        title="Add Market Item"
        description="Create a new market place item with a valid shope link URL."
        submitLabel="Create Item"
        isLoading={createMarketItemMutation.isPending}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => createMarketItemMutation.mutate(payload)}
      />

      <MarketItemFormModal
        isOpen={editModal.isOpen}
        title="Update Market Item"
        description="Edit the selected market place item and save your changes."
        submitLabel="Update Item"
        isLoading={updateMarketItemMutation.isPending}
        initialData={editModal.item}
        onClose={() => setEditModal({ isOpen: false, item: null })}
        onSubmit={(payload) => {
          if (!editModal.item) return
          updateMarketItemMutation.mutate({ id: editModal.item._id, data: payload })
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Market Item"
        description={`Are you sure you want to delete ${deleteModal.item?.title || "this item"}? This action cannot be undone.`}
        isLoading={deleteMarketItemMutation.isPending}
      />
    </div>
  )
}
