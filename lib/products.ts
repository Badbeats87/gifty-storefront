import { getSupabaseClient } from './supabase';
import type { Database } from './database.types';

type Business = Database['public']['Tables']['businesses']['Row'];

export type Product = Business & {
  image: string;
  rating: number;
  reviews: number;
};

// Map businesses to products with emoji icons based on their names
const getEmojiForBusiness = (name: string): string => {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('restaurant') || lowerName.includes('pizza') || lowerName.includes('pasquale')) {
    return '🍝';
  }
  if (lowerName.includes('cafe') || lowerName.includes('coffee')) {
    return '☕';
  }
  if (lowerName.includes('taqueria') || lowerName.includes('naranjos')) {
    return '🌮';
  }
  if (lowerName.includes('yoga') || lowerName.includes('wellness')) {
    return '🧘';
  }
  if (lowerName.includes('book')) {
    return '📚';
  }

  return '🎁'; // Default gift emoji
};

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    // Transform businesses to products with emoji icons
    const products: Product[] = (data as Business[]).map((business) => ({
      ...business,
      image: getEmojiForBusiness(business.name),
      rating: 4.8, // Default rating - could be fetched from reviews
      reviews: 324, // Default review count
    }));

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .eq('is_visible', true)
      .single();

    if (error || !data) {
      console.error('Error fetching product:', error);
      return null;
    }

    const businessData = data as Business;
    const product: Product = {
      ...businessData,
      image: getEmojiForBusiness(businessData.name),
      rating: 4.8,
      reviews: 324,
    };

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('is_active', true)
      .eq('is_visible', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    const products: Product[] = (data as Business[]).map((business) => ({
      ...business,
      image: getEmojiForBusiness(business.name),
      rating: 4.8,
      reviews: 324,
    }));

    return products;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}
