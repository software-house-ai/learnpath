"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import * as LucideIcons from "lucide-react"

interface Domain {
  id: string
  name: string
  slug: string
  description: string
  icon_name: string
  color_hex: string
  skill_count: number
  goal_count: number
}

interface DomainGridProps {
  domains: Domain[]
}

export function DomainGrid({ domains }: DomainGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {domains.map(domain => {
        const Icon = (LucideIcons as any)[domain.icon_name] || LucideIcons.Code

        return (
          <Link
            key={domain.id}
            href={`/domains/${domain.slug}`}
            className="group block"
          >
            <div
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 h-full border-t-4"
              style={{ borderColor: domain.color_hex }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${domain.color_hex}20` }}
                >
                  <Icon size={32} style={{ color: domain.color_hex }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition">
                    {domain.name}
                  </h3>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {domain.description}
              </p>

              <div className="flex gap-3 text-sm text-gray-500">
                <Badge variant="secondary">{domain.skill_count} skills</Badge>
                <Badge variant="secondary">{domain.goal_count} paths</Badge>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
