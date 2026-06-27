import { Link } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportCard } from '@/components/reports/ReportCard'
import { useStore } from '@/store'
import { DEMO_REPORTS } from '@/lib/mockData'

export default function MyReportsPage() {
  const { user, reports } = useStore()
  const myReports = user
    ? reports.filter((r) => r.userId === user.uid)
    : reports // show all in demo mode

  // Add demo reports for demo users
  const displayReports = myReports.length > 0 ? myReports : DEMO_REPORTS.slice(0, 3)

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {displayReports.length} report{displayReports.length !== 1 ? 's' : ''} filed
            </p>
          </div>
          <Button asChild>
            <Link to="/report">
              <Plus className="h-4 w-4" />
              New Report
            </Link>
          </Button>
        </div>

        {displayReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 mb-4 text-muted-foreground/40" />
            <h3 className="font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Be the first to report pollution in your area</p>
            <Button asChild><Link to="/report">Report Pollution</Link></Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {displayReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewDetails={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
