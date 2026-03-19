# Supabase Patterns

## Authenticated Client
```typescript
import { createClient } from "@/db/supabase/server"

const db = await createClient()
const { data, error } = await db
  .from("agents")
  .select("*, owner:users!owner_id(username)")
  .eq("id", agentId)
  .single()
```

## Service Client (webhooks only)
```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## RLS Policy Template
```sql
CREATE POLICY "Users can read own agents"
  ON agents FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own agents"
  ON agents FOR INSERT
  WITH CHECK (owner_id = auth.uid());
```

## Access Control RPC
```typescript
const { data: hasAccess } = await supabaseAdmin.rpc("has_agent_access", {
  p_user_id: auth.userId,
  p_agent_id: agentId,
})
```
