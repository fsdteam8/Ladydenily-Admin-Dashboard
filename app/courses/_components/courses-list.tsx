"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Eye, Trash2 } from "lucide-react"
import { CoursePagination } from "@/components/course-pagination"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Coordinator {
  _id: string
  name: string
  email: string
  phone?: string
  username?: string
  role?: string
  createdAt?: string
  updatedAt?: string
  uniqueId?: string
  isStripeOnboarded?: boolean
  fine?: number
  __v?: number
  avatar?: {
    public_id?: string
    url: string
  }
}

interface Video {
  name: string
  no: number
  url: string
  public_id?: string
  _id: string
}

interface Resource {
  name: string
  url: string
  public_id?: string
  _id: string
}

interface Assignment {
  title: string
  start: string
  submission: any[]
  _id: string
}

interface Module {
  _id: string
  name: string
  video: Video[]
  resources: Resource[]
  assignment: Assignment[]
  __v?: number
}

interface ApiCourse {
  _id: string
  name: string
  description: string
  photo: string | null
  photoPublicId?: string
  price: number
  offerPrice: number
  isPublished?: boolean
  publishedAt?: string | null
  coordinator: Coordinator[]
  modules: Module[]
  enrolled: any[]
  createdAt: string
  updatedAt?: string
  __v?: number
}

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string | null
  trainers: { name: string; avatar: string }[]
  enroll: number
  modules: number
  deadline: string
  price: string
  added: string
}

interface ApiResponse {
  data: {
    course: ApiCourse[]
  }
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface SingleCourseResponse {
  success?: boolean
  message?: string
  data?: {
    course?: ApiCourse
  } | ApiCourse
}

const fetchCourses = async (token?: string, page = 1, limit = 10): Promise<ApiResponse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}/course/all-courses?page=${page}&limit=${limit}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch courses: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}

const deleteCourse = async (courseId: string, token?: string): Promise<void> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const response = await fetch(`${baseUrl}/course/courses/${courseId}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete course: ${response.statusText}`)
  }
}

const fetchCourseById = async (courseId: string, token?: string): Promise<ApiCourse> => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  // Keep compatibility with both route patterns:
  // router.get("/courses/:id", protect, getCourse)
  // and existing /course/courses/:id pattern used in this project.
  const endpoints = [`${baseUrl}/courses/${courseId}`, `${baseUrl}/course/courses/${courseId}`]

  let data: SingleCourseResponse | null = null

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, { headers })
    if (response.ok) {
      data = (await response.json()) as SingleCourseResponse
      break
    }
  }

  if (!data) {
    throw new Error("Failed to fetch course details")
  }

  if (data.data && typeof data.data === "object" && "course" in data.data) {
    if (data.data.course) {
      return data.data.course
    }
  } else if (data.data) {
    return data.data
  }

  throw new Error("Course details not found")
}

const transformApiCourse = (apiCourse: ApiCourse): Course => {
  // Strip HTML tags from description for safe rendering
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "")

  // Check for duplicate assignment IDs
  const assignmentIds = new Set()
  apiCourse.modules.forEach((module, index) => {
    module.assignment.forEach((assignment) => {
      if (assignmentIds.has(assignment._id)) {
        console.warn(`Duplicate assignment ID ${assignment._id} found in module ${module._id}`)
      }
      assignmentIds.add(assignment._id)
    })
  })

  // Derive deadline from the first assignment's start field, if available
  const deadline =
    apiCourse.modules[0]?.assignment[0]?.start || "4 Weeks"

  return {
    id: apiCourse._id,
    title: apiCourse.name,
    description: stripHtml(apiCourse.description),
    thumbnail: apiCourse.photo,
    trainers: apiCourse.coordinator.map((coord) => ({
      name: coord.name,
      avatar: coord.avatar?.url || "/placeholder.svg?height=32&width=32",
    })),
    enroll: apiCourse.enrolled.length,
    modules: apiCourse.modules.length,
    deadline,
    price: apiCourse.offerPrice ? `$${apiCourse.offerPrice}` : `$${apiCourse.price}`,
    added: new Date(apiCourse.createdAt).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCourses, setTotalCourses] = useState(0)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<ApiCourse | null>(null)

  const { data: session } = useSession()
  const token = session?.accessToken

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchCourses(token, page)
        const transformedCourses = response.data.course.map(transformApiCourse)
        setCourses(transformedCourses)
        setTotalPages(response.meta.totalPages)
        setTotalCourses(response.meta.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses")
        console.error("Error fetching courses:", err)
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [token, page])

  useEffect(() => {
    const lastPage = Math.max(totalPages, 1)

    if (page > lastPage) {
      setPage(lastPage)
    }
  }, [page, totalPages])

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return
    try {
      await deleteCourse(courseId, token)
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
      setTotalCourses((prev) => {
        const nextTotal = Math.max(prev - 1, 0)
        const nextTotalPages = Math.max(Math.ceil(nextTotal / 10), 1)

        setTotalPages(nextTotalPages)
        setPage((currentPage) => Math.min(currentPage, nextTotalPages))

        return nextTotal
      })
    } catch (err) {
      console.error("Error deleting course:", err)
      setError(err instanceof Error ? err.message : "Failed to delete course")
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleViewCourse = async (courseId: string) => {
    try {
      setIsDetailsOpen(true)
      setDetailsLoading(true)
      setDetailsError(null)
      const courseDetails = await fetchCourseById(courseId, token)
      setSelectedCourse(courseDetails)
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load course details")
      setSelectedCourse(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground">Dashboard &gt; Courses</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="p-6 pt-12">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Courses</h1>
        <p className="text-sm text-muted-foreground">Dashboard &gt; Courses</p>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Courses table">
            <thead className="bg-muted/50">
              <tr>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Courses</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Trainer</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Enroll</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Modules</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Deadline</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Price</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Added</th>
                <th scope="col" className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No courses found
                  </td>
                </tr>
              ) : (
                courses.map((course, index) => (
                  <tr key={course.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={course.thumbnail || "/placeholder.svg?height=48&width=64&query=course thumbnail"}
                            alt={course.title}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg?height=48&width=64")}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {course.trainers.map((trainer, trainerIndex) => (
                          <div key={trainerIndex} className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={trainer.avatar} alt={trainer.name} />
                              <AvatarFallback>
                                {trainer.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {trainerIndex === 0 && <span className="text-sm text-foreground">{trainer.name}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-foreground">{course.enroll}</td>
                    <td className="p-4 text-foreground">{course.modules}</td>
                    <td className="p-4 text-foreground">{course.deadline}</td>
                    <td className="p-4 text-foreground">{course.price}</td>
                    <td className="p-4 text-muted-foreground">{course.added}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCourse(course.id)}
                          aria-label={`View course details for ${course.title}`}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCourse(course.id)}
                          aria-label={`Delete course ${course.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {totalCourses === 0 ? 0 : (page - 1) * 10 + 1} to {Math.min(page * 10, totalCourses)} of {totalCourses} results
            </p>
            <CoursePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
          </DialogHeader>

          {detailsLoading && <p className="text-sm text-muted-foreground">Loading details...</p>}

          {detailsError && <p className="text-sm text-destructive">{detailsError}</p>}

          {!detailsLoading && !detailsError && selectedCourse && (
            <div className="space-y-5">
              <div className="w-full h-48 rounded-md overflow-hidden bg-muted">
                <Image
                  src={selectedCourse.photo || "/placeholder.svg?height=192&width=768&query=course banner"}
                  alt={selectedCourse.name}
                  width={768}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{selectedCourse.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCourse.description.replace(/<[^>]+>/g, "")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Course ID</p>
                  <p className="font-medium break-all">{selectedCourse._id}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">${selectedCourse.price}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Offer Price</p>
                  <p className="font-medium">${selectedCourse.offerPrice || selectedCourse.price}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Enrolled</p>
                  <p className="font-medium">{selectedCourse.enrolled.length}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Modules</p>
                  <p className="font-medium">{selectedCourse.modules.length}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Published</p>
                  <p className="font-medium">{selectedCourse.isPublished ? "Yes" : "No"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Published At</p>
                  <p className="font-medium">{selectedCourse.publishedAt || "N/A"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Photo Public ID</p>
                  <p className="font-medium break-all">{selectedCourse.photoPublicId || "N/A"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Created At</p>
                  <p className="font-medium">{selectedCourse.createdAt || "N/A"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Updated At</p>
                  <p className="font-medium">{selectedCourse.updatedAt || "N/A"}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">{selectedCourse.__v ?? "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Coordinators</p>
                {selectedCourse.coordinator.length ? (
                  <div className="space-y-2">
                    {selectedCourse.coordinator.map((coord) => (
                      <div key={coord._id} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{coord.name}</p>
                        <p className="text-muted-foreground">{coord.email}</p>
                        <p className="text-muted-foreground">ID: {coord._id}</p>
                        <p className="text-muted-foreground">Phone: {coord.phone || "N/A"}</p>
                        <p className="text-muted-foreground">Username: {coord.username || "N/A"}</p>
                        <p className="text-muted-foreground">Role: {coord.role || "N/A"}</p>
                        <p className="text-muted-foreground">Unique ID: {coord.uniqueId || "N/A"}</p>
                        <p className="text-muted-foreground">Fine: {coord.fine ?? "N/A"}</p>
                        <p className="text-muted-foreground">
                          Stripe Onboarded: {coord.isStripeOnboarded ? "Yes" : "No"}
                        </p>
                        <p className="text-muted-foreground break-all">
                          Avatar Public ID: {coord.avatar?.public_id || "N/A"}
                        </p>
                        <p className="text-muted-foreground break-all">Avatar URL: {coord.avatar?.url || "N/A"}</p>
                        <p className="text-muted-foreground">Created At: {coord.createdAt || "N/A"}</p>
                        <p className="text-muted-foreground">Updated At: {coord.updatedAt || "N/A"}</p>
                        <p className="text-muted-foreground">Version: {coord.__v ?? "N/A"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No coordinator assigned.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Modules</p>
                {selectedCourse.modules.length ? (
                  <div className="space-y-2">
                    {selectedCourse.modules.map((module) => (
                      <div key={module._id} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{module.name}</p>
                        <p className="text-muted-foreground">Module ID: {module._id}</p>
                        <p className="text-muted-foreground">Version: {module.__v ?? "N/A"}</p>
                        <p className="text-muted-foreground">
                          Videos: {module.video.length} | Resources: {module.resources.length} | Assignments:{" "}
                          {module.assignment.length}
                        </p>
                        {module.video.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="font-medium">Videos</p>
                            {module.video.map((video) => (
                              <div key={video._id} className="text-muted-foreground break-all">
                                {video.no}. {video.name} | {video.url} | public_id: {video.public_id || "N/A"} | id:{" "}
                                {video._id}
                              </div>
                            ))}
                          </div>
                        )}
                        {module.resources.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="font-medium">Resources</p>
                            {module.resources.map((resource) => (
                              <div key={resource._id} className="text-muted-foreground break-all">
                                {resource.name} | {resource.url} | public_id: {resource.public_id || "N/A"} | id:{" "}
                                {resource._id}
                              </div>
                            ))}
                          </div>
                        )}
                        {module.assignment.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="font-medium">Assignments</p>
                            {module.assignment.map((assignment) => (
                              <div key={assignment._id} className="text-muted-foreground break-all">
                                {assignment.title} | start: {assignment.start} | id: {assignment._id}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No modules available.</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Enrolled IDs</p>
                {selectedCourse.enrolled.length ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground space-y-1">
                    {selectedCourse.enrolled.map((enrollId, index) => (
                      <p key={`${enrollId}-${index}`} className="break-all">
                        {String(enrollId)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No enrolled users.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
