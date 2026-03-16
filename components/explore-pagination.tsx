import Link from "next/link"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ExplorePaginationProps {
  currentPage: number
  totalPages: number
  searchParams: URLSearchParams
}

function buildPageHref(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params.toString())
  if (page <= 1) {
    next.delete("page")
  } else {
    next.set("page", String(page))
  }
  const qs = next.toString()
  return `/explore${qs ? `?${qs}` : ""}`
}

export function ExplorePagination({
  currentPage,
  totalPages,
  searchParams,
}: ExplorePaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | "ellipsis")[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("ellipsis")
    const innerStart = Math.max(2, currentPage - 1)
    const innerEnd = Math.min(totalPages - 1, currentPage + 1)
    for (let i = innerStart; i <= innerEnd; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
  }

  const uniquePages = pages

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={
              currentPage <= 1
                ? buildPageHref(searchParams, 1)
                : buildPageHref(searchParams, currentPage - 1)
            }
            aria-disabled={currentPage <= 1}
            className={
              currentPage <= 1
                ? "pointer-events-none opacity-50"
                : undefined
            }
          />
        </PaginationItem>
        {uniquePages.map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href={buildPageHref(searchParams, p)}
                isActive={currentPage === p}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href={
              currentPage >= totalPages
                ? buildPageHref(searchParams, totalPages)
                : buildPageHref(searchParams, currentPage + 1)
            }
            aria-disabled={currentPage >= totalPages}
            className={
              currentPage >= totalPages
                ? "pointer-events-none opacity-50"
                : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
