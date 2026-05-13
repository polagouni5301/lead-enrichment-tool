import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../utils/cn'

type DataTableProps<TData> = {
  data: TData[]
  columns: ColumnDef<TData, unknown>[]
  searchPlaceholder?: string
  filterKey?: string
  renderExpanded?: (row: TData) => ReactNode
  pageSize?: number
  compact?: boolean
}

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Search records',
  filterKey,
  renderExpanded,
  pageSize = 6,
  compact,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const tableColumns = useMemo(() => {
    if (!renderExpanded) return columns

    const expander: ColumnDef<TData, unknown> = {
      id: 'expander',
      header: '',
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl"
          onClick={row.getToggleExpandedHandler()}
        >
          <ChevronDown
            className={cn('h-4 w-4 transition', row.getIsExpanded() ? 'rotate-180' : '')}
            aria-hidden="true"
          />
          Toggle row details
        </Button>
      ),
      size: 44,
    }

    return [expander, ...columns]
  }, [columns, renderExpanded])

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, expanded },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).toLowerCase()
      if (!query) return true

      if (filterKey) {
        return String(row.getValue(filterKey)).toLowerCase().includes(query)
      }

      return Object.values(row.original as Record<string, unknown>).some((value) =>
        String(value).toLowerCase().includes(query),
      )
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
          <Input
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
        <p className="text-sm font-semibold text-brand-muted">
          {table.getFilteredRowModel().rows.length} record{table.getFilteredRowModel().rows.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white/80">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full border-collapse text-left">
            <thead className="table-sticky-shadow bg-brand-cream/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'whitespace-nowrap px-4 py-3 text-xs font-extrabold uppercase text-brand-gray',
                        compact && 'px-3 py-2',
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          className={cn(
                            'inline-flex items-center gap-1',
                            header.column.getCanSort() ? 'cursor-pointer hover:text-brand-coral' : 'cursor-default',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? (
                            <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : null}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr className="border-t border-black/[0.06] transition hover:bg-brand-card/70">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={cn('px-4 py-4 align-middle text-sm text-brand-muted', compact && 'px-3 py-2')}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && renderExpanded ? (
                      <tr key={`${row.id}-expanded`} className="border-t border-black/[0.06] bg-brand-card/50">
                        <td colSpan={row.getVisibleCells().length} className="p-4">
                          {renderExpanded(row.original)}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-12 text-center text-sm font-semibold text-brand-muted" colSpan={tableColumns.length}>
                    No matching records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-muted">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden="true" />}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
