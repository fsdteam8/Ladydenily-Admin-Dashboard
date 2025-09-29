"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { CoursePagination } from "@/components/course-pagination"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Coordinator {
  _id: string
  name: string
  email: string
  avatar?: {
    url: string
  }
}

interface Video {
  name: string
  no: number
  url: string
  _id: string
}

interface Resource {
  name: string
  url: string
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
}

interface ApiCourse {
  _id: string
  name: string
  description: string
  photo: string | null
  price: number
  offerPrice: number
  coordinator: Coordinator[]
  modules: Module[]
  enrolled: any[]
  createdAt: string
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

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return
    try {
      await deleteCourse(courseId, token)
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
      setTotalCourses((prev) => prev - 1)
    } catch (err) {
      console.error("Error deleting course:", err)
      setError(err instanceof Error ? err.message : "Failed to delete course")
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
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
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, totalCourses)} of {totalCourses} results
            </p>
            <CoursePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}