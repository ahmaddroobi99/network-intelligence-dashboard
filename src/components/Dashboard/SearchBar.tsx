import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { searchNodes } from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";
import { NODE_TYPE_LABELS } from "@/lib/graph/types";
import { NODE_COLORS } from "@/lib/graph/visual";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useGraphStore((s) => s.searchQuery);
  const open = useGraphStore((s) => s.searchOpen);
  const index = useGraphStore((s) => s.searchIndex);
  const data = useGraphStore((s) => s.data);
  const setSearch = useGraphStore((s) => s.setSearch);
  const setSearchOpen = useGraphStore((s) => s.setSearchOpen);
  const moveSearchIndex = useGraphStore((s) => s.moveSearchIndex);
  const activateSearchIndex = useGraphStore((s) => s.activateSearchIndex);
  const selectNode = useGraphStore((s) => s.selectNode);

  const matches = useMemo(() => searchNodes(data.nodes, query), [data.nodes, query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        if (query) {
          setSearch("");
          inputRef.current?.blur();
        } else {
          selectNode(null);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [query, selectNode, setSearch, setSearchOpen]);

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => query && setSearchOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            moveSearchIndex(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveSearchIndex(-1);
          } else if (e.key === "Enter") {
            e.preventDefault();
            activateSearchIndex();
          }
        }}
        placeholder="Search nodes"
        aria-label="Search nodes"
        aria-controls="search-results"
        aria-expanded={open}
        className="h-9 w-full rounded-xl bg-elevated pl-9 pr-16 text-sm text-foreground shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring/70"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch("")}
            className="rounded-md p-1 text-subtle hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden rounded-md bg-panel px-1.5 py-0.5 text-2xs text-muted sm:inline">
            /
          </kbd>
        )}
      </div>
      {open && query.trim() ? (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-2xl bg-elevated p-1 shadow-[var(--shadow-border)]"
        >
          {matches.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">
              No matching nodes. Try another search term.
            </p>
          ) : (
            <>
              <p className="px-3 py-1.5 text-2xs uppercase tracking-[0.14em] text-subtle">
                <span className="tabular-nums">{matches.length}</span>{" "}
                {matches.length === 1 ? "match" : "matches"}
              </p>
              <ul className="max-h-72 overflow-auto">
                {matches.slice(0, 12).map((node, i) => (
                  <li key={node.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === index}
                      onMouseEnter={() =>
                        useGraphStore.setState({ searchIndex: i })
                      }
                      onClick={() => selectNode(node.id, true)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left",
                        i === index ? "bg-panel" : "hover:bg-panel/70",
                      )}
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ background: NODE_COLORS[node.type] }}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {node.label}
                      </span>
                      <span className="text-2xs uppercase tracking-wider text-subtle">
                        {NODE_TYPE_LABELS[node.type]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
