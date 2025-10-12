// Fragrantica API Service for ingredient fetching
import { FragranticaResponse, Ingredient } from '@/lib/types';

export class FragranticaService {
  private static instance: FragranticaService;
  private baseUrl = 'https://www.fragrantica.com/api';
  private cache = new Map<string, FragranticaResponse>();

  public static getInstance(): FragranticaService {
    if (!FragranticaService.instance) {
      FragranticaService.instance = new FragranticaService();
    }
    return FragranticaService.instance;
  }

  /**
   * Search for perfume by name and fetch ingredients
   */
  async searchPerfume(perfumeName: string): Promise<FragranticaResponse | null> {
    try {
      // Check cache first
      const cacheKey = perfumeName.toLowerCase().trim();
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // Since Fragrantica doesn't have a public API, we'll simulate the response
      // In a real implementation, you would need to use web scraping or a proxy service
      const response = await this.simulateFragranticaSearch(perfumeName);
      
      if (response) {
        this.cache.set(cacheKey, response);
      }
      
      return response;
    } catch (error) {
      console.error('Error searching Fragrantica:', error);
      return null;
    }
  }

  /**
   * Simulate Fragrantica search (replace with actual API call)
   */
  private async simulateFragranticaSearch(perfumeName: string): Promise<FragranticaResponse | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock data based on common perfume names
    const mockData: Record<string, FragranticaResponse> = {
      'chanel no 5': {
        name: 'Chanel No. 5',
        brand: 'Chanel',
        notes: {
          top: ['Aldehydes', 'Ylang-Ylang', 'Neroli', 'Bergamot', 'Lemon'],
          middle: ['Rose', 'Jasmine', 'Lily of the Valley', 'Iris'],
          base: ['Sandalwood', 'Vanilla', 'Amber', 'Musk', 'Vetiver']
        },
        ingredients: [
          'Aldehydes', 'Ylang-Ylang', 'Neroli', 'Bergamot', 'Lemon',
          'Rose', 'Jasmine', 'Lily of the Valley', 'Iris',
          'Sandalwood', 'Vanilla', 'Amber', 'Musk', 'Vetiver'
        ],
        images: ['https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Chanel+No.5']
      },
      'dior sauvage': {
        name: 'Dior Sauvage',
        brand: 'Dior',
        notes: {
          top: ['Calabrian Bergamot', 'Pepper'],
          middle: ['Sichuan Pepper', 'Lavender', 'Pink Pepper', 'Patchouli', 'Geranium', 'Ambroxan'],
          base: ['Labdanum', 'Ambroxan', 'Cedar', 'Ambergris']
        },
        ingredients: [
          'Calabrian Bergamot', 'Pepper', 'Sichuan Pepper', 'Lavender',
          'Pink Pepper', 'Patchouli', 'Geranium', 'Ambroxan',
          'Labdanum', 'Cedar', 'Ambergris'
        ],
        images: ['https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=Dior+Sauvage']
      },
      'tom ford black orchid': {
        name: 'Tom Ford Black Orchid',
        brand: 'Tom Ford',
        notes: {
          top: ['Black Pepper', 'Ylang-Ylang', 'Black Currant', 'Truffle'],
          middle: ['Fruity Notes', 'Spicy Notes', 'Floral Notes'],
          base: ['Patchouli', 'Incense', 'Sandalwood', 'Vanilla', 'Dark Chocolate']
        },
        ingredients: [
          'Black Pepper', 'Ylang-Ylang', 'Black Currant', 'Truffle',
          'Patchouli', 'Incense', 'Sandalwood', 'Vanilla', 'Dark Chocolate'
        ],
        images: ['https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=Black+Orchid']
      }
    };

    const normalizedName = perfumeName.toLowerCase().trim();
    const foundKey = Object.keys(mockData).find(key => 
      normalizedName.includes(key) || key.includes(normalizedName)
    );

    return foundKey ? mockData[foundKey] : null;
  }

  /**
   * Convert Fragrantica response to ingredients with icons
   */
  convertToIngredients(response: FragranticaResponse): Ingredient[] {
    const ingredientIcons: Record<string, string> = {
      'aldehydes': '🧪',
      'bergamot': '🍊',
      'lemon': '🍋',
      'rose': '🌹',
      'jasmine': '🌸',
      'lavender': '💜',
      'vanilla': '🌿',
      'sandalwood': '🌳',
      'musk': '🦌',
      'amber': '🟤',
      'patchouli': '🍃',
      'pepper': '🌶️',
      'cedar': '🌲',
      'chocolate': '🍫',
      'truffle': '🍄',
      'incense': '🕯️'
    };

    return response.ingredients.map(ingredient => {
      const normalizedName = ingredient.toLowerCase();
      const icon = Object.keys(ingredientIcons).find(key => 
        normalizedName.includes(key)
      );
      
      return {
        name: ingredient,
        icon: icon ? ingredientIcons[icon] : '🌿',
        category: this.categorizeIngredient(ingredient, response.notes),
        description: this.getIngredientDescription(ingredient)
      };
    });
  }

  /**
   * Categorize ingredient based on fragrance notes
   */
  private categorizeIngredient(ingredient: string, notes: FragranticaResponse['notes']): string {
    const normalizedIngredient = ingredient.toLowerCase();
    
    if (notes.top.some(note => note.toLowerCase().includes(normalizedIngredient))) {
      return 'Top Note';
    }
    if (notes.middle.some(note => note.toLowerCase().includes(normalizedIngredient))) {
      return 'Middle Note';
    }
    if (notes.base.some(note => note.toLowerCase().includes(normalizedIngredient))) {
      return 'Base Note';
    }
    
    return 'Other';
  }

  /**
   * Get ingredient description
   */
  private getIngredientDescription(ingredient: string): string {
    const descriptions: Record<string, string> = {
      'aldehydes': 'Synthetic compounds that add sparkle and freshness',
      'bergamot': 'Citrus fruit with fresh, slightly bitter aroma',
      'lemon': 'Bright, fresh citrus note',
      'rose': 'Classic floral note, romantic and elegant',
      'jasmine': 'Intoxicating white floral with sweet, heady aroma',
      'lavender': 'Calming, herbaceous floral note',
      'vanilla': 'Sweet, warm, and comforting note',
      'sandalwood': 'Creamy, woody note with soft, milky quality',
      'musk': 'Animalic note that adds depth and sensuality',
      'amber': 'Warm, resinous note with golden, honey-like quality',
      'patchouli': 'Earthy, woody note with sweet, musty character',
      'pepper': 'Spicy, warming note that adds energy',
      'cedar': 'Dry, woody note with pencil shavings quality',
      'chocolate': 'Rich, sweet gourmand note',
      'truffle': 'Earthy, luxurious note with mushroom-like quality',
      'incense': 'Resinous, smoky note with spiritual quality'
    };

    const normalizedIngredient = ingredient.toLowerCase();
    const foundKey = Object.keys(descriptions).find(key => 
      normalizedIngredient.includes(key)
    );

    return foundKey ? descriptions[foundKey] : 'Aromatic compound used in perfumery';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const fragranticaService = FragranticaService.getInstance();
