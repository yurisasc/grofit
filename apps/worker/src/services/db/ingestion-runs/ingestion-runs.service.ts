import { db, schema } from '@grofit/db'
import { Injectable } from '@nestjs/common'
import { and, eq, or } from 'drizzle-orm'

export type IngestionRun = typeof schema.ingestionRuns.$inferSelect
export type NewIngestionRun = typeof schema.ingestionRuns.$inferInsert

@Injectable()
export class IngestionRunsService {
  async startRun(source: string, identifier: string): Promise<IngestionRun> {
    const [run] = await db
      .insert(schema.ingestionRuns)
      .values({
        source,
        identifier,
        status: 'running',
        startedAt: new Date(),
        completedAt: null,
        metadata: null,
      })
      .onConflictDoUpdate({
        target: [schema.ingestionRuns.source, schema.ingestionRuns.identifier],
        set: {
          status: 'running',
          startedAt: new Date(),
          completedAt: null,
        },
      })
      .returning()
    return run
  }

  async updateRun(
    runId: number,
    status: IngestionRun['status'],
    details: { metadata?: object; sha256?: string } = {},
  ): Promise<void> {
    await db
      .update(schema.ingestionRuns)
      .set({
        status,
        completedAt: new Date(),
        ...(details.metadata !== undefined ? { metadata: details.metadata } : {}),
        ...(details.sha256 !== undefined ? { sha256: details.sha256 } : {}),
      })
      .where(eq(schema.ingestionRuns.id, runId))
  }

  async findCompletedRunByHash(
    source: string,
    identifier: string,
    hash: string,
  ): Promise<IngestionRun | undefined> {
    const runs = await db.query.ingestionRuns.findMany({
      where: and(
        eq(schema.ingestionRuns.source, source),
        eq(schema.ingestionRuns.identifier, identifier),
        or(
          eq(schema.ingestionRuns.status, 'completed'),
          eq(schema.ingestionRuns.status, 'skipped'),
        ),
        eq(schema.ingestionRuns.sha256, hash),
      ),
    })
    return runs[0]
  }
}
