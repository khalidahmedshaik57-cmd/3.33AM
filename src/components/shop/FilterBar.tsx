"use client";

export default function FilterBar({
  category,
  setCategory,
  categories,
  collection,
  setCollection,
  collections,
  size,
  setSize,
  search,
  setSearch,
  sort,
  setSort
}: {
  category: string;
  setCategory: (value: string) => void;
  categories: string[];
  collection: string;
  setCollection: (value: string) => void;
  collections: string[];
  size: string;
  setSize: (value: string) => void;
  search: string;
  setSearch: (value: string) => void;
  sort: string;
  setSort: (value: string) => void;
}) {
  return (
    <div className="filter-bar">
      <div className="filter-categories" aria-label="Filter by category">
        {["All", ...categories].map((item) => (
          <button key={item} className={category === item ? "filter-button active" : "filter-button"} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      <div className="filter-extra">
        <input className="search-control" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pieces" aria-label="Search pieces" />
        <label className="sort-control"><span>Collection</span>
          <select value={collection} onChange={(event) => setCollection(event.target.value)} aria-label="Filter by collection">
            <option value="All">All</option>{collections.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="sort-control"><span>Size</span>
          <select value={size} onChange={(event) => setSize(event.target.value)} aria-label="Filter by size">
            {["All", "XS", "S", "M", "L", "XL", "XXL"].map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="sort-control"><span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </div>
  );
}
