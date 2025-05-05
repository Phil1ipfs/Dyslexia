import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faTimes, 
  faFilter, 
  faSort,
  faLayerGroup,
  faList,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import './FilterSidebar.css';

const FilterSidebar = ({
  className = '',
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
  clearFilters,
  closeMobileFilters
}) => {
  return (
    <div className={`filters-sidebar ${className}`}>
      <div className="sidebar-header">
        <h2 className="filters-title">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" /> Filters
        </h2>
        <button className="close-filters-btn" onClick={closeMobileFilters}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
      
      {/* Antas Level Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <FontAwesomeIcon icon={faLayerGroup} className="filter-label-icon" /> Antas Level
        </label>
        <div className="select-wrapper">
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
      </div>
      
      {/* Category Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <FontAwesomeIcon icon={faList} className="filter-label-icon" /> Category
        </label>
        <div className="select-wrapper">
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
      </div>
      
      {/* Status Filter - New */}
      <div className="filter-group">
        <label className="filter-label">
          <FontAwesomeIcon icon={faCheck} className="filter-label-icon" /> Status
        </label>
        <div className="select-wrapper">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {statusOptions.map((status, index) => (
              <option key={index} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Sort Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <FontAwesomeIcon icon={faSort} className="filter-label-icon" /> Sort By
        </label>
        <div className="select-wrapper">
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
      </div>
      
      {/* Search Filter */}
      <div className="filter-group">
        <label className="filter-label">
          <FontAwesomeIcon icon={faSearch} className="filter-label-icon" /> Search
        </label>
        <div className="search-containerr">
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
      
      {/* Clear Filters Button */}
      <button 
        className="clear-filters-btn"
        onClick={clearFilters}
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;