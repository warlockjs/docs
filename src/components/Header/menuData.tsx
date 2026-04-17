export type MenuItem = {
  id: number;
  title: string;
  path?: string;
  newTab?: boolean;
  submenu?: MenuItem[];
};

const menuData: MenuItem[] = [
  {
    id: 1,
    title: "Framework",
    path: "/docs/framework/getting-started/introduction",
    newTab: false,
  },
  {
    id: 2,
    title: "Seal",
    path: "/docs/seal/getting-started/introduction",
    newTab: false,
  },
  {
    id: 3,
    title: "Cascade",
    path: "/docs/cascade/getting-started/introduction",
    newTab: false,
  },
  {
    id: 4,
    title: "Cache",
    path: "/docs/cache/introduction",
    newTab: false,
  },
  {
    id: 5,
    title: "More",
    submenu: [
      {
        id: 51,
        title: "Herald — Message Bus",
        path: "/docs/herald/introduction",
        newTab: false,
      },
      {
        id: 52,
        title: "Logger — Logging",
        path: "/docs/logger/introduction",
        newTab: false,
      },
      {
        id: 53,
        title: "Scheduler — Job Scheduling",
        path: "/docs/scheduler/introduction",
        newTab: false,
      },
    ],
  },
];

export default menuData;
