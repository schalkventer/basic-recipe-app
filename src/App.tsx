import { type $brand } from "zod";
import { useState } from "react";
import { useListRecipes, useSingleRecipe } from "./data";
import "./spinner.css";

const PAGINATION = 20;

export const App = () => {
  const [search, setSearch] = useState<string>("");

  const [selected, setSelected] = useState<
    null | (string & $brand<"RECIPE_ID">)
  >(null);

  const { recipe: viewing, syncing: recipeSyncing } = useSingleRecipe(selected);

  const { list, syncing: listSyncing } = useListRecipes({
    search,
    limit: PAGINATION,
    offset: 0,
  });

  const syncing = recipeSyncing || listSyncing;

  return (
    <>
      {syncing && (
        <div className="spinner">
          <div className="spinner-circle"></div>
          Syncing
        </div>
      )}

      <input
        placeholder="Search"
        onChange={(e) => setSearch(e.target.value)}
        value={search}
      />

      <ul>
        {list?.map((item) => {
          if (!item) return <li>Loading...</li>;

          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  setSelected(item.id);
                }}
              >
                {item.title}
              </button>
            </li>
          );
        })}

        {syncing &&
          PAGINATION - (list?.length ?? 0) > 0 &&
          new Array(PAGINATION - (list?.length ?? 0))
            .fill(null)
            .map((_, index) => {
              return <li key={index}>░░░░░░░░░░░░░░░░░░░░░░░</li>;
            })}
      </ul>

      <dialog
        open={selected !== null}
        onClick={() => setSelected(null)}
        style={{ position: "fixed", top: 100 }}
      >
        <h2>{viewing?.title}</h2>

        <div style={{ display: "flex" }}>
          <div>
            {viewing?.image && (
              <img
                src={viewing?.image}
                alt={viewing?.title}
                width={300}
                height={300}
                style={{ objectFit: "contain" }}
              />
            )}

            <dl>
              <div>
                <dt>Category</dt>
                <dd>{viewing?.category}</dd>
              </div>

              {viewing?.times.cook && (
                <div>
                  <dt>Cook Time</dt>
                  <dd>{viewing?.times.cook}</dd>
                </div>
              )}

              {viewing?.times.total && (
                <div>
                  <dt>Total Time</dt>
                  <dd>{viewing?.times.total}</dd>
                </div>
              )}
            </dl>
          </div>

          <ul style={{ width: 300 }}>
            {!viewing?.ingredients && <li>Loading...</li>}

            {viewing?.ingredients?.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>

          <ol style={{ width: 300 }}>
            {!viewing?.instructions && <li>Loading...</li>}

            {viewing?.instructions?.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <button onClick={() => setSelected(null)}>Close</button>
      </dialog>
    </>
  );
};
