// src/components/common/CategorySearchFilter/CategorySearchFilter.tsx
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import styles from './CategorySearchFilter.module.css';

interface CategorySearchFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  placeholder?: string;
}

export function CategorySearchFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  placeholder = 'Todas las categorías',
}: CategorySearchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const displayLabel =
    !selectedCategory || selectedCategory === 'ALL' || selectedCategory === 'Todas las categorías'
      ? placeholder
      : selectedCategory;

  const handleSelect = (category: string) => {
    onSelectCategory(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Filtrar por categoría"
      >
        <Search className={styles.searchIcon} size={15} />
        <span className={styles.triggerText}>{displayLabel}</span>
        {selectedCategory && selectedCategory !== 'ALL' && selectedCategory !== 'Todas las categorías' && (
          <span
            className={styles.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('ALL');
            }}
            title="Limpiar filtro"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} size={14} />
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.searchBox}>
            <Search className={styles.inputSearchIcon} size={14} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                className={styles.clearSearchInput}
                onClick={() => setSearchTerm('')}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className={styles.optionsList}>
            <button
              type="button"
              className={`${styles.optionItem} ${
                !selectedCategory || selectedCategory === 'ALL' || selectedCategory === 'Todas las categorías'
                  ? styles.optionSelected
                  : ''
              }`}
              onClick={() => handleSelect('ALL')}
            >
              <span>Todas las categorías</span>
              {(!selectedCategory || selectedCategory === 'ALL' || selectedCategory === 'Todas las categorías') && (
                <Check size={14} className={styles.checkIcon} />
              )}
            </button>

            {filteredCategories.length === 0 ? (
              <div className={styles.noResults}>No se encontraron categorías</div>
            ) : (
              filteredCategories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => handleSelect(category)}
                  >
                    <span>{category}</span>
                    {isSelected && <Check size={14} className={styles.checkIcon} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
