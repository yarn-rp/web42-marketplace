import { randomBytes } from "crypto"
import { Command } from "commander"
import chalk from "chalk"
import ora from "ora"

import { apiPost } from "../utils/api.js"
import { clearAuth, getConfig, setAuth } from "../utils/config.js"

export const authCommand = new Command("auth").description(
  "Authenticate with the Web42 marketplace"
)

authCommand
  .command("login")
  .description("Sign in via GitHub OAuth in the browser")
  .action(async () => {
    const config = getConfig()
    const code = randomBytes(16).toString("hex")

    const spinner = ora("Registering auth code...").start()

    try {
      await apiPost("/api/auth/cli", { action: "register", code })
      spinner.stop()

      const loginUrl = `${config.apiUrl}/login?cli_code=${code}`
      console.log()
      console.log(
        chalk.bold("Open this URL in your browser to authenticate:")
      )
      console.log()
      console.log(chalk.cyan(loginUrl))
      console.log()

      // Try to open browser automatically
      const { exec } = await import("child_process")
      const platform = process.platform
      const openCmd =
        platform === "darwin"
          ? "open"
          : platform === "win32"
            ? "start"
            : "xdg-open"
      exec(`${openCmd} "${loginUrl}"`)

      const pollSpinner = ora("Waiting for authentication...").start()

      // Poll for confirmation
      const maxAttempts = 60
      for (let i = 0; i < maxAttempts; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000))

        try {
          const result = await apiPost<{
            status: string
            token?: string
            user_id?: string
            username?: string
            full_name?: string
            avatar_url?: string
          }>("/api/auth/cli", { action: "poll", code })

          if (result.status === "authenticated" && result.user_id && result.token) {
            pollSpinner.succeed("Authenticated!")
            setAuth({
              userId: result.user_id,
              username: result.username ?? "",
              token: result.token,
              fullName: result.full_name,
              avatarUrl: result.avatar_url,
            })

            console.log()
            console.log(
              chalk.green(`Logged in as ${chalk.bold(`@${result.username}`)}`)
            )
            return
          }
        } catch {
          // Continue polling
        }
      }

      pollSpinner.fail("Authentication timed out. Please try again.")
    } catch (error) {
      spinner.fail("Failed to start auth flow")
      console.error(error)
      process.exit(1)
    }
  })

authCommand
  .command("logout")
  .description("Sign out and clear saved credentials")
  .action(() => {
    clearAuth()
    console.log(chalk.green("Logged out successfully."))
  })

authCommand
  .command("whoami")
  .description("Show the currently authenticated user")
  .action(() => {
    const config = getConfig()
    if (!config.authenticated || !config.username) {
      console.log(chalk.yellow("Not authenticated. Run `web42 auth login`."))
      return
    }
    console.log(chalk.green(`@${config.username}`))
    if (config.fullName) {
      console.log(chalk.dim(config.fullName))
    }
  })
