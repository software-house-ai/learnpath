"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"
import Image from "next/image"

interface ContentItem {
  id: string
  title: string
  description: string
  content_type: string
  provider: string
  duration_minutes: number
  difficulty_level: string
  thumbnail_url: string | null
  rating_avg: number
  skill: {
    name: string
    slug: string
  }
}

interface RecentContentProps {
  items: ContentItem[]
}

export function RecentContent({ items }: RecentContentProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recently Added</h2>
        <Link href="/api/content" className="text-blue-600 hover:underline text-sm font-medium">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
            {item.thumbnail_url && (
              <div className="relative h-40 bg-gray-100">
                <Image
                  src={item.thumbnail_url}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {item.provider}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {item.content_type}
                </Badge>
              </div>
              <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{item.duration_minutes}min</span>
                </div>
                {item.rating_avg > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span>{item.rating_avg.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
