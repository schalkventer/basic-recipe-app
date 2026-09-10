import { type $brand } from "zod";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { createCollection } from "@tanstack/react-db";
import { QueryClient } from "@tanstack/react-query";
import { createLocal } from "./data.api";

import {
  BrowserCollectionCoordinator,
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from "@tanstack/browser-db-sqlite-persistence";

export const queryClient = new QueryClient();

export const LOCAL_STORAGE_KEY = "c788940e-7d0c-46d2-bde7-de8a8d29f2e2";

export const persister = createAsyncStoragePersister({
  storage: window.localStorage,
});

const database = await openBrowserWASQLiteOPFSDatabase({
  databaseName: `${LOCAL_STORAGE_KEY}.sqlite`,
});

const coordinator = new BrowserCollectionCoordinator({
  dbName: `${LOCAL_STORAGE_KEY}.coordinator`,
});

export const persistence = createBrowserWASQLitePersistence({
  database,
  coordinator,
});

export type Recipe = {
  id: string & $brand<"RECIPE_ID">;
  category: string | null;
  title: string;
  image: string | null;
  author: string | null;
  ingredients: null | string[];
  instructions: null | string[];
  times: {
    prep: number | null;
    cook: number | null;
    total: number | null;
  };
};

export const collection = createCollection(
  persistedCollectionOptions<Recipe, Recipe["id"]>({
    persistence,
    id: "recipes",
    syncMode: "on-demand",
    getKey: (x) => x.id,
  }),
);
