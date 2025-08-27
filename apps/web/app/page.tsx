import dynamic from 'next/dynamic'
import { widgetRegistry } from './widgets/widgetRegistry.generated'

const ActivityFeed = dynamic(widgetRegistry['core/ActivityFeed'])

export default function Page() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Grofit Dashboard</h1>
        <p className="text-neutral-400 mt-2">Welcome. This is the starting point.</p>
      </div>
      <section>
        <ActivityFeed />
      </section>
    </main>
  )
}
