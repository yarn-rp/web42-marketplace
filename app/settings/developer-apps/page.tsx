"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Copy, Plus, Trash2 } from "lucide-react"

interface DeveloperApp {
  id: string
  name: string
  client_id: string
  secret_prefix: string
  created_at: string
  revoked_at: string | null
}

interface NewAppResponse extends DeveloperApp {
  client_secret: string
}

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<DeveloperApp[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newAppName, setNewAppName] = useState("")
  const [creating, setCreating] = useState(false)
  const [newSecret, setNewSecret] = useState<NewAppResponse | null>(null)

  const fetchApps = useCallback(async () => {
    try {
      const res = await fetch("/api/apps")
      if (res.ok) {
        const data = await res.json()
        setApps(data.apps ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchApps()
  }, [fetchApps])

  const handleCreate = async () => {
    if (!newAppName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAppName.trim() }),
      })
      if (res.ok) {
        const data: NewAppResponse = await res.json()
        setNewSecret(data)
        setNewAppName("")
        setCreateOpen(false)
        fetchApps()
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    await fetch(`/api/apps/${id}`, { method: "DELETE" })
    fetchApps()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="container max-w-4xl py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Developer Apps
          </h1>
          <p className="text-muted-foreground">
            Create client credentials for your agents to validate incoming
            tokens via the introspection endpoint.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New App
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Developer App</DialogTitle>
              <DialogDescription>
                Give your app a name. You&apos;ll receive a client ID and secret
                for token introspection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  placeholder="My Agent Server"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={creating || !newAppName.trim()}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {newSecret && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-lg">
              Save your client secret
            </CardTitle>
            <CardDescription>
              This is the only time the secret will be shown. Copy it now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Client ID
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                  {newSecret.client_id}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(newSecret.client_id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Client Secret
              </Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                  {newSecret.client_secret}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(newSecret.client_secret)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewSecret(null)}
            >
              I&apos;ve saved it
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading...
            </div>
          ) : apps.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No developer apps yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow
                    key={app.id}
                    className={app.revoked_at ? "opacity-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {app.name}
                      {app.revoked_at && (
                        <span className="ml-2 text-xs text-destructive">
                          Revoked
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">
                        {app.client_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono">
                        {app.secret_prefix}****
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {!app.revoked_at && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Revoke &quot;{app.name}&quot;?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Agents using these credentials will no longer be
                                able to validate tokens. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRevoke(app.id)}
                              >
                                Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
