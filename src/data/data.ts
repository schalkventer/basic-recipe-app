import { useState, useRef, useEffect } from "react";
import { type Recipe, collection } from "./data.libs";
import { useLiveQuery, eq, ilike, createTransaction } from "@tanstack/react-db";
import {
  getList,
  getSingle,
  type ListRecipeResponse,
  type SingleRecipeResponse,
} from "./data.api";
import { useQuery } from "@tanstack/react-query";

const transformer = (
  x: SingleRecipeResponse | ListRecipeResponse["items"][number],
): Recipe => {
  const current = collection.get(x.id);
  const full = "ingredients" in x ? x : null;

  return {
    id: x.id,
    author: full?.author ?? current?.author ?? null,
    category: x.category,
    title: x.title,
    image: x.image_url,
    ingredients: full?.ingredients ?? current?.ingredients ?? null,
    instructions: full?.instructions ?? current?.instructions ?? null,
    times: {
      cook: x.cook_time ?? current?.times?.cook ?? null,
      prep: full?.prep_time ?? current?.times?.prep ?? null,
      total: x.total_time ?? current?.times?.total ?? null,
    },
  };
};

export const useSingleRecipe = (
  id: Recipe["id"] | null,
): { syncing: boolean; recipe: Recipe | null } => {
  const { data } = useLiveQuery(
    (q) => {
      if (!id) return null;

      return q
        .from({ x: collection })
        .where(({ x }) => eq(x.id, id))
        .findOne();
    },
    [id],
  );

  const { isFetching } = useQuery({
    throwOnError: true,
    queryKey: ["recipes", "single", id],
    refetchInterval: 10 * 1000,
    queryFn: async () => {
      if (!id) return null;
      const response = transformer(await getSingle({ id }));

      const current = collection.has(id);
      if (!current) return collection.insert(response);

      collection.update(response.id, (x) => {
        x.author = response.author;
        x.category = response.category;
        x.title = response.title;
        x.image = response.image;
        x.times.cook = response.times.cook;
        x.times.prep = response.times.prep;
        x.times.total = response.times.total;
        x.ingredients = response.ingredients;
        x.instructions = response.instructions;
      });

      return response;
    },
  });

  return { syncing: isFetching, recipe: data ?? null };
};

export const useListRecipes = (props: {
  search: string;
  limit: number;
  offset: number;
}): { syncing: boolean; list: (Recipe | null)[] } => {
  const { search, limit, offset } = props;
  const [debounced, setDebounced] = useState<string>(search);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);

    ref.current = window.setTimeout(() => {
      setDebounced(search);
    }, 2000);
  }, [search]);

  const { data } = useLiveQuery(
    (q) => {
      const query = q.from({ x: collection });

      if (search !== "" && search.length > 1) {
        return query.where(({ x }) => ilike(x.title, `%${search}%`));
      }

      return query
        .limit(limit)
        .offset(offset)
        .orderBy(({ x }) => x.title, "asc");
    },
    [search, limit, offset],
  );

  const { isFetching } = useQuery({
    throwOnError: true,
    queryKey: ["recipes", "list", debounced, limit, offset],
    queryFn: async () => {
      const response = await getList({
        params: {
          limit,
          q: debounced !== "" && debounced.length > 1 ? debounced : undefined,
          mode: "keyword",
          offset,
        },
      });

      const items = response.items.map(transformer);

      const tx = createTransaction({
        mutationFn: async ({ transaction }) => {
          collection.utils.acceptMutations(transaction);
        },
      });

      tx.mutate(() => {
        for (const single of items) {
          const current = collection.has(single.id);
          if (!current) {
            collection.insert(single);
            continue;
          }

          collection.update(single.id, (x) => {
            x.author = single.author;
            x.category = single.category;
            x.title = single.title;
            x.image = single.image;
            x.times.cook = single.times.cook;
            x.times.prep = single.times.prep;
            x.times.total = single.times.total;
          });
        }
      });

      return items.map((x) => x.id);
    },
  });

  return {
    syncing: search !== debounced || isFetching,
    list: data ?? [],
  };
};
