import styles from "../components/Sidebar.module.css";
import { useState } from "react";
import { Filter, X } from "lucide-react";
import clsx from "clsx";
import { BiCategory } from "react-icons/bi";

const categories = [
  'Math',
  'Science',
  'English',
  'History',
  'Computer Science',
  'Web Development', 
  'Foreign Language',
  'Art',
  'Music',
  'Economics',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'SAT/ACT Prep',
  'AP Courses',
  'Other'];

function Sidebar({ onSelectCategory }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]); 
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryClick = (category) => {
  let newCategories;
  if (selectedCategories.includes(category)) {
    newCategories = selectedCategories.filter(cat => cat !== category);
  } else {
    newCategories = [...selectedCategories, category];
  }
  setSelectedCategories(newCategories);
  onSelectCategory(newCategories);  // ✅ Pass the new value
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
                  selectedCategories.includes(category) && styles.active
                )}
                onClick={() => handleCategoryClick(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <button className={styles.clearBtn} onClick={() => setSelectedCategories([])}>
            Clear Filter
          </button>
        )}
      </aside>
    </>
  );
}

export default Sidebar;