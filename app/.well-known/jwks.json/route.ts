import { NextResponse } from "next/server"
import { importSPKI, exportJWK } from "jose"

const ALG = "RS256"

export async function GET(): Promise<Response> {
  const pem = process.env.JWT_PUBLIC_KEY
  if (!pem) {
    return NextResponse.json(
      { error: "JWKS not configured" },
      { status: 500 }
    )
  }

  const publicKey = await importSPKI(pem, ALG)
  const jwk = await exportJWK(publicKey)
  jwk.alg = ALG
  jwk.use = "sig"
  jwk.kid = "web42-primary"

  return NextResponse.json(
    { keys: [jwk] },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    }
  )
}
