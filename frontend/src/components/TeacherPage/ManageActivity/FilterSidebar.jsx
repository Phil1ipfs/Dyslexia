import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faTimes,
  faArrowUp,
  faArrowDown,
  faEraser,
  faSortAmountDown,
  faSortAmountUp,
  faSortAlphaDown,
  faSortAlphaUp
} from '@fortawesome/free-solid-svg-icons';
import './FilterSidebar.css';

const FilterSidebar = ({
  className,
  selectedLevel,
  setSelectedLevel,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  readingLevels,
  categories,
  sortOptions,
  statusOptions,
  closeMobileFilters,
  clearFilters
}) => {
  // Helper function to determine if any filter is active
  const isFilterActive = () => {
    return (
      selectedLevel !== readingLevels[0] ||
      selectedCategory !== categories[0] ||
      sortOption !== sortOptions[0] ||
      statusFilter !== statusOptions[0] ||
      searchQuery.trim() !== ''
    );
  };

  // Helper function to get appropriate icon for sort option
  const getSortIcon = (option) => {
    switch (option) {
      case 'Newest First':
        return faSortAmountDown;
      case 'Oldest First':
        return faSortAmountUp;
      case 'Alphabetical A-Z':
        return faSortAlphaDown;
      case 'Alphabetical Z-A':
        return faSortAlphaUp;
      default:
        return faFilter;
    }
  };

  return (
    <aside className={`filter-sidebar ${className || ''}`}>
      <div className="filter-sidebar-header">
        <h2>
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          Filters
        </h2>
        {/* Close button only visible on mobile */}
        <button className="close-filters-btn" onClick={closeMobileFilters}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>
      </div>

      <div className="filter-section">
        <h3>Reading Level</h3>
        <div className="filter-options">
          {readingLevels.map((level, index) => (
            <div key={index} className="filter-option">
              <label className={selectedLevel === level ? 'active' : ''}>
                <input
                  type="radio"
                  name="level"
                  checked={selectedLevel === level}
                  onChange={() => setSelectedLevel(level)}
                />
                <span>{level}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Category</h3>
        <div className="filter-options">
          {categories.map((category, index) => (
            <div key={index} className="filter-option">
              <label className={selectedCategory === category ? 'active' : ''}>
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => setSelectedCategory(category)}
                />
                <span>{category}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Status</h3>
        <div className="filter-options">
          {statusOptions.map((status, index) => (
            <div key={index} className="filter-option">
              <label className={statusFilter === status ? 'active' : ''}>
                <input
                  type="radio"
                  name="status"
                  checked={statusFilter === status}
                  onChange={() => setStatusFilter(status)}
                />
                <span>{status}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3>Sort By</h3>
        <div className="filter-options sort-options">
          {sortOptions.map((option, index) => (
            <div key={index} className="filter-option">
              <label className={sortOption === option ? 'active' : ''}>
                <input
                  type="radio"
                  name="sort"
                  checked={sortOption === option}
                  onChange={() => setSortOption(option)}
                />
                <FontAwesomeIcon icon={getSortIcon(option)} className="sort-icon" />
                <span>{option}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {isFilterActive() && (
        <button className="clear-filters-btn" onClick={clearFilters}>
          <FontAwesomeIcon icon={faEraser} /> Clear All Filters
        </button>
      )}
    </aside>
  );
};

export default FilterSidebar;