# @warlock.js/scheduler — Inventory

## Package Info

- Version: 4.0.165
- Type: Standalone Package
- Dependencies: None (dayjs only)

## Directory Tree

```
src/
├── cron-parser.ts
├── index.ts
├── job.ts
├── scheduler.ts
├── types.ts
└── utils.ts
```

## Exports by File

### src/cron-parser.ts
*Parses standard 5-field cron expressions and calculates matching run times.*

- **Type** `CronFields`
- **Class** `CronParser`
  - `public get fields(): Readonly<CronFields>`
  - `public get expression(): string`
  - `public constructor(private readonly _expression: string)`
  - `public nextRun(from?: Dayjs): Dayjs`
  - `public matches(date: Dayjs): boolean`
- **Function** `parseCron(expression: string): CronParser`

### src/job.ts
*Represents a single scheduled task with a fluent API for timing and execution control.*
*Lines: 704*

- **Type** `JobCallback`
- **Class** `Job`
  - `public name: string`
  - `public nextRun: Dayjs | null`
  - `public get isRunning(): boolean`
  - `public get lastRun(): Dayjs | null`
  - `public get intervals(): Readonly<JobIntervals>`
  - `public constructor(name: string, callback: JobCallback)`
  - `public every(value: number, timeType: TimeType): this`
  - `public everySecond(): this`
  - `public everySeconds(seconds: number): this`
  - `public everyMinute(): this`
  - `public everyMinutes(minutes: number): this`
  - `public everyHour(): this`
  - `public everyHours(hours: number): this`
  - `public everyDay(): this`
  - `public daily(): this`
  - `public twiceDaily(): this`
  - `public everyWeek(): this`
  - `public weekly(): this`
  - `public everyMonth(): this`
  - `public monthly(): this`
  - `public everyYear(): this`
  - `public yearly(): this`
  - `public always(): this`
  - `public cron(expression: string): this`
  - `public get cronExpression(): string | null`
  - `public on(day: Day | number): this`
  - `public at(time: string): this`
  - `public beginOf(type: TimeType): this`
  - `public endOf(type: TimeType): this`
  - `public inTimezone(tz: string): this`
  - `public preventOverlap(skip?: boolean): this`
  - `public retry(maxRetries: number, delay?: number, backoffMultiplier?: number): this`
  - `public terminate(): this`
  - `public prepare(): void`
  - `public shouldRun(): boolean`
  - `public async run(): Promise<JobResult>`
  - `public waitForCompletion(): Promise<void>`
- **Function** `job(name: string, callback: JobCallback): Job`

### src/scheduler.ts
*Coordinates multiple jobs, handling their execution patterns and lifecycle.*
*Lines: 380*

- **Class** `Scheduler extends EventEmitter implements TypedEventEmitter<SchedulerEvents>`
  - `public get isRunning(): boolean`
  - `public get jobCount(): number`
  - `public addJob(job: Job): this`
  - `public newJob(name: string, jobCallback: JobCallback): Job`
  - `public addJobs(jobs: Job[]): this`
  - `public removeJob(jobName: string): boolean`
  - `public getJob(jobName: string): Job | undefined`
  - `public list(): readonly Job[]`
  - `public runEvery(ms: number): this`
  - `public runInParallel(parallel: boolean, maxConcurrency?: number): this`
  - `public start(): void`
  - `public stop(): void`
  - `public async shutdown(timeout?: number): Promise<void>`
- **Constant** `scheduler: Scheduler`

### src/types.ts
*Defines constants, interfaces and types for intervals, results, and events.*

- **Type** `TimeType`
- **Type** `Day`
- **Type** `JobIntervals`
- **Type** `JobResult`
- **Type** `JobStatus`
- **Type** `RetryConfig`
- **Type** `SchedulerEvents`

### src/utils.ts
*Internal utility functions for day parsing.*

- **Function** `parseWeekDayNumber(day: Day): number`

### src/index.ts
*Entry point exporting all core scheduler functionality and types.*

- **Re-exports**:
  - `CronParser`, `parseCron` from `./cron-parser`
  - `Job`, `job` from `./job`
  - `Scheduler`, `scheduler` from `./scheduler`
  - `CronFields` from `./cron-parser`
  - `Day`, `JobIntervals`, `JobResult`, `JobStatus`, `RetryConfig`, `SchedulerEvents`, `TimeType` from `./types`
