export type SeedResult = {
  recordsCreated: number;
};

export type SeederMetadata = {
  name: string;
  createdAt: number;
  firstRunAt: number;
  lastRunAt: number;
  runCount: number;
  totalRecordsCreated: number;
  lastRunRecordsCreated: number;
};
