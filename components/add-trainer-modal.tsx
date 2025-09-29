"use client";

import type React from "react";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trainersAPI, type CreateTrainerData } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTrainerModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTrainerModalProps) {
  const [formData, setFormData] = useState<CreateTrainerData>({
    name: "",
    email: "",
    password: "",
    phone: "",
    username: "",
    address: {
      city: "",
      state: "",
      street: "",
      zipCode: "",
    },
    treding_profile: {
      trading_exprience: "",
      assets_of_interest: "",
      main_goal: "",
      risk_appetite: "",
      preffered_learning: [],
    },
  });

  const addTrainerMutation = useMutation({
    mutationFn: trainersAPI.addTrainer,
    onSuccess: () => {
      toast.success("Trainer added successfully");
      onSuccess();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add trainer");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      username: "",
      address: {
        city: "",
        state: "",
        street: "",
        zipCode: "",
      },
      treding_profile: {
        trading_exprience: "",
        assets_of_interest: "",
        main_goal: "",
        risk_appetite: "",
        preffered_learning: [],
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTrainerMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof CreateTrainerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Add New Trainer
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={addTrainerMutation.isPending}
            >
              {addTrainerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Trainer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
