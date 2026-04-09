"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { trainersAPI, type User } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { TrainerPagination } from "@/components/trainer-pagination"
import { AddTrainerModal } from "@/components/add-trainer-modal"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { UserDetailsModal } from "@/components/user-details-modal"

function formatDate(value?: string) {
  if (!value) return "N/A"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "N/A"
  }

  return date.toLocaleDateString()
}

export default function TrainerPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; trainer: User | null }>({
    isOpen: false,
    trainer: null,
  })
  const [viewModal, setViewModal] = useState<{ isOpen: boolean; trainer: User | null }>({
    isOpen: false,
    trainer: null,
  })

  const queryClient = useQueryClient()

  const {
    data: trainersData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["trainers", currentPage],
    queryFn: () => trainersAPI.getTrainers(currentPage, 10),
  })

  const deleteTrainerMutation = useMutation({
    mutationFn: trainersAPI.deleteTrainer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainers"] })
      toast.success("Trainer deleted successfully")
      setDeleteModal({ isOpen: false, trainer: null })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete trainer")
    },
  })

  const handleDeleteTrainer = (trainer: User) => {
    setDeleteModal({ isOpen: true, trainer })
  }

  const handleViewTrainer = (trainer: User) => {
    setViewModal({ isOpen: true, trainer })
  }

  const confirmDelete = () => {
    if (deleteModal.trainer) {
      deleteTrainerMutation.mutate(deleteModal.trainer._id)
    }
  }

  const trainers = trainersData?.data?.trainers || []
  const meta = trainersData?.data?.meta

  useEffect(() => {
    const lastPage = Math.max(meta?.totalPages ?? 1, 1)

    if (currentPage > lastPage) {
      setCurrentPage(lastPage)
    }
  }, [currentPage, meta?.totalPages])

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-center text-red-500">Failed to load trainers. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Trainer</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Trainer</p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Trainer
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Created At</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Updated At</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 7 }).map((_, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </td>
                    </tr>
                  ))
                : trainers.map((trainer, index) => (
                    <tr key={trainer._id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={trainer.avatar?.url || "/placeholder.svg"} alt={trainer.name} />
                            <AvatarFallback>{trainer.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{trainer.name}</span>
                            <p className="text-xs text-muted-foreground">@{trainer.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{trainer.email}</td>
                      <td className="p-4 text-foreground">{trainer.phone || "------"}</td>
                      <td className="p-4 text-foreground">{formatDate(trainer.createdAt)}</td>
                      <td className="p-4 text-muted-foreground">{formatDate(trainer.updatedAt)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10"
                            onClick={() => handleViewTrainer(trainer)}
                          >
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteTrainer(trainer)}
                            disabled={deleteTrainerMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {meta
                ? `Showing ${meta.total === 0 ? 0 : (currentPage - 1) * 10 + 1} to ${Math.min(currentPage * 10, meta.total)} of ${meta.total} results`
                : "Loading..."}
            </p>
            {meta && (
              <TrainerPagination currentPage={currentPage} totalPages={meta.totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </div>
      </div>

      {/* Modal Components */}
      <AddTrainerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["trainers"] })
          setIsAddModalOpen(false)
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, trainer: null })}
        onConfirm={confirmDelete}
        title="Delete Trainer"
        description={`Are you sure you want to delete ${deleteModal.trainer?.name}? This action cannot be undone.`}
        isLoading={deleteTrainerMutation.isPending}
      />

      <UserDetailsModal
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, trainer: null })}
        user={viewModal.trainer}
        title="Trainer Details"
        description="View all available trainer information."
      />
    </div>
  )
}
