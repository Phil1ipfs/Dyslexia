import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import './FilterSidebar.css';

const FilterSidebar = ({
  className = '',
  selectedLevel,
  setSelectedLevel,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
  searchQuery,
  setSearchQuery,
  readingLevels,
  categories,
  sortOptions,
  closeMobileFilters
}) => {
  return (
    <div className={`filters-sidebar ${className}`}>
      <div className="sidebar-header">
        <h2 className="filters-title">Filters</h2>
        <button className="close-filters-btn" onClick={closeMobileFilters}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Antas Level</label>
        <select 
          className="filter-select" 
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          {readingLevels.map((level, index) => (
            <option key={index} value={level}>{level}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Category</label>
        <select 
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Sort By</label>
        <select 
          className="filter-select"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          {sortOptions.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label className="filter-label">Search</label>
        <div className="search-container">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
        </div>
      </div>
      
      <div className="filter-actions">
        <button 
          className="clear-filters-btn"
          onClick={() => {
            setSelectedLevel("All Levels");
            setSelectedCategory("All Categories");
            setSortOption("Newest First");
            setSearchQuery("");
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;