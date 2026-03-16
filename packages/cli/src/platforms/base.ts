export interface ConfigVariable {
  key: string
  label: string
  description?: string
  required: boolean
  default?: string
}

export interface PackOptions {
  cwd: string
  outputDir: string
  dryRun?: boolean
}

export interface PackedFile {
  path: string
  content: string
  hash: string
}

export interface PackResult {
  files: PackedFile[]
  configTemplate: Record<string, unknown> | null
  configVariables: ConfigVariable[]
}

export interface InstallOptions {
  agentSlug: string
  username: string
  workspacePath: string
  files: Array<{ path: string; content: string | null; content_hash: string }>
  configTemplate: Record<string, unknown> | null
  configAnswers: Record<string, string>
}

export interface InstallResult {
  filesWritten: number
  agentDir: string
}

export interface UninstallOptions {
  agentName: string
}

export interface UninstallResult {
  removed: boolean
  paths: string[]
}

export interface InstalledAgent {
  name: string
  source?: string
  workspace: string
}

export interface InitConfig {
  name: string
  model?: string
}

export interface PlatformAdapter {
  name: string
  home: string

  extractInitConfig(cwd: string): InitConfig | null
  pack(options: PackOptions): Promise<PackResult>
  install(options: InstallOptions): Promise<InstallResult>
  uninstall(options: UninstallOptions): Promise<UninstallResult>
  listInstalled(): Promise<InstalledAgent[]>
}
