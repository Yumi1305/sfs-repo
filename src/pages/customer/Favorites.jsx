import styles from '../customer/Favorites.module.css';
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import MaterialCard from '../../components/MaterialCard';
import { Link, useNavigate } from 'react-router-dom';
import Lottie from "lottie-react";
import animationData from '../../assets/sad-face.json';
import { useUserContext } from '../../hooks/useUserContext';
import { supabase } from '../../lib/supabase';

function Favorites() {
  const {
    user,
    loading: userLoading,
    favoritedMaterialIds,
    error,
    clearError,
  } = useUserContext();

  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Fetch materials that are in the user's favorites
  useEffect(() => {
    const fetchFavoritedMaterials = async () => {
      if (!user || favoritedMaterialIds.size === 0) {
        setMaterials([]);
        setMaterialsLoading(false);
        return;
      }

      try {
        setMaterialsLoading(true);
        
        // Get favorite timestamps
        const { data: favorites, error: favError } = await supabase
          .from('user_favorited_materials')
          .select('material_id, favorited_at')
          .eq('user_id', user.id)
          .order('favorited_at', { ascending: false });

        if (favError) throw favError;
        if (!favorites?.length) {
          setMaterials([]);
          return;
        }

        // Get full material data
        const materialIds = favorites.map(f => f.material_id);
        const { data: materialsData, error: matError } = await supabase
          .from('study_materials')
          .select('*')
          .in('id', materialIds)
          .eq('status', 'approved');

        if (matError) throw matError;

        // Combine and sort by favorited_at
        const favoritedAtMap = new Map(favorites.map(f => [f.material_id, f.favorited_at]));
        const sortedMaterials = (materialsData || [])
          .map(m => ({ ...m, favorited_at: favoritedAtMap.get(m.id) }))
          .sort((a, b) => new Date(b.favorited_at) - new Date(a.favorited_at));

        setMaterials(sortedMaterials);
      } catch (err) {
        console.error('Error fetching favorited materials:', err);
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchFavoritedMaterials();
  }, [user, favoritedMaterialIds]); // Re-fetch when favorites change

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Clear errors on mount
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Loading state
  if (userLoading || materialsLoading) {
    return (
      <div>
        <NavBar onSearch={handleSearch} />
        {/* <div className={styles['loading-container']}>
          <div className={styles['spinner']}></div>
          <p>Loading your favorites...</p>
        </div> */}
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    navigate('/login');
    return null;
  }

  // Filter materials that are still favorited (in case of optimistic updates)
  const favoritedMaterials = materials.filter(m => favoritedMaterialIds.has(m.id));
  
  // Apply search filter
  const displayedMaterials = searchTerm
    ? favoritedMaterials.filter(m =>
        m.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : favoritedMaterials;

  const totalFavorites = favoritedMaterials.length;
  const totalDisplayed = displayedMaterials.length;

  return (
    <>
      <NavBar onSearch={handleSearch} />
      
      {error && (
        <div className={styles["error-message"]}>
          <p>⚠️ {error}</p>
          <button onClick={clearError} className={styles["clear-error-btn"]}>
            ✕ Dismiss
          </button>
        </div>
      )}

      {totalFavorites > 0 ? (
        <>
          <div className={styles['filters-container']}>
            <div className={styles["content-filters"]}>
              <span className={styles["filter-label"]}>
                {totalFavorites} favorite{totalFavorites !== 1 ? 's' : ''}
              </span>
              
              {searchTerm && (
                <button className={styles["clear-filter-btn"]} onClick={clearSearch}>
                  Clear search ✕
                </button>
              )}
            </div>
          </div>

          <section className={styles["main-section"]}>
            {searchTerm && (
              <div className={styles["active-filter"]}>
                <span>Searching: "{searchTerm}"</span>
                <span className={styles["result-count"]}>
                  ({totalDisplayed} result{totalDisplayed !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            
            {displayedMaterials.length > 0 ? (
              displayedMaterials.map(material => (
                <MaterialCard key={`material-${material.id}`} material={material} />
              ))
            ) : searchTerm ? (
              <div className={styles["no-results"]}>
                <p>No favorites found matching "{searchTerm}"</p>
                <button onClick={clearSearch} className={styles["clear-search-btn"]}>
                  Clear Search
                </button>
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section className={styles.section2}>
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: 200, marginBottom: '-2rem' }}
          />
          <div className={styles.no}>You have no favorites!</div>
          <Link to="/" className={styles.return}>
            Return to dashboard
          </Link>
        </section>
      )}
    </>
  );
}

export default Favorites;