import styles from "../components/Sidebar.module.css";
import { FaSearch } from "react-icons/fa";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import clsx from "clsx";


const categories = ["Math", "Science", "Art", "AP", "Language", "History", "Existential", "Programming", "Other"];
const sortBy = ["popular", "latest", "grade"]


function Sidebar({onSelectCategory}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const handleCategoryClick = (category) => {
    if (category === selectedCategory){
      setSelectedCategory(null)
      onSelectCategory(null)
    }
    else{onSelectCategory(category.toLowerCase());
    console.log(category.toLowerCase())
    setSelectedCategory(category);
    }

    console.log('HEREHEHREHRHERHEE', selectedCategory)

  };
  return (
    <div className={styles["side-bar"]}>

      <div className={styles["filter-section"]}>
        <h3>Filter by Category</h3>
        <div className={styles["category-list"]}>
          {categories.map((category) => (
            <button
              key={category}
              className={clsx(styles["category-button"], 
                selectedCategory === category && styles["active"])}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <ThemeToggle className={styles["toggle"]}></ThemeToggle>
    </div>
  );
}

export default Sidebar;
