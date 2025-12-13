import styles from "../components/Sidebar.module.css";
import { useState } from "react";
import { Filter, X } from "lucide-react";
import clsx from "clsx";

const categories = ["Math", "Science", "Art", "AP", "Language", "History", "Existential", "Programming", "Other"];

function Sidebar({ onSelectCategory }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryClick = (category) => {
    if (category === selectedCategory) {
      setSelectedCategory(null);
      onSelectCategory(null);
    } else {
      onSelectCategory(category.toLowerCase());
      setSelectedCategory(category);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <button className={styles.mobileFilterBtn} onClick={toggleSidebar}>
        <Filter size={18} />
        <span>Filters</span>
        {selectedCategory && <span className={styles.filterBadge}>1</span>}
      </button>

      {/* Mobile Overlay */}
      <div 
        className={clsx(styles.overlay, isOpen && styles.open)} 
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={clsx(styles.sideBar, isOpen && styles.open)}>
        <div className={styles.sidebarHeader}>
          <h2>Filters</h2>
          <button className={styles.closeBtn} onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.filterSection}>
          <h3>Filter by Category</h3>
          <div className={styles.categoryList}>
            {categories.map((category) => (
              <button
                key={category}
                className={clsx(
                  styles.categoryButton,
                  selectedCategory === category && styles.active
                )}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <button className={styles.clearBtn} onClick={() => handleCategoryClick(selectedCategory)}>
            Clear Filter
          </button>
        )}
      </aside>
    </>
  );
}

export default Sidebar;