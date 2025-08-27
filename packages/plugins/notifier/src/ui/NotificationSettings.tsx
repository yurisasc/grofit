'use client'

import { Button } from '@grofit/ui'

export default function NotificationSettings() {
  // MVP placeholder UI
  return (
    <div className="space-y-3">
      <div className="text-sm text-neutral-400">Notification Channels</div>
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-md border border-neutral-800 p-3 flex items-center justify-between">
          <div>
            <div className="font-medium">Desktop</div>
            <div className="text-xs text-neutral-400">Show native desktop notifications</div>
          </div>
          <Button disabled>Enabled</Button>
        </div>
        <div className="rounded-md border border-neutral-800 p-3">
          <div className="font-medium">Discord</div>
          <div className="text-xs text-neutral-400 mb-2">Send to a Discord channel via webhook</div>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-sm"
              placeholder="Webhook URL (placeholder)"
            />
            <Button disabled>Save</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
