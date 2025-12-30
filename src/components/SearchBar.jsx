import { useState } from 'react';
import { FaSearch } from "react-icons/fa";
import styles from './SearchBar.module.css';

function SearchBar({ onSearch, placeholder = "Search..." }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    } else {
      // If search term is empty, clear the search
      onSearch('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
      setSearchTerm("")
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className={styles['search-bar']}>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
      />
      <button
        onClick={handleSearch}
        className={styles['search-icon']}
        type="button"
      >
        <FaSearch />
      </button>
    </div>
  );
}

export default SearchBar;